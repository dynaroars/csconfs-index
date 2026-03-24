import json
import os
import sys
import time
from urllib.parse import urlencode
from urllib.request import urlopen

from backend.iclr_point import (
    CSRANKINGS_PATH, AREA_PATH,
    load_faculty_names, load_conference_to_area,
    get_cached_dblp_data,
    get_cached_dblp_conf_data,
)

CSRANKINGS_URL = "https://raw.githubusercontent.com/emeryberger/CSRankings/gh-pages/csrankings.csv"
CITATION_CACHE_PATH = "data/openalex_citation_cache.json"
OPENALEX_MAILTO = os.environ.get("OPENALEX_MAILTO", "no-reply@example.com")
OPENALEX_BATCH_SIZE = 50

def load_citation_cache():
    if not os.path.exists(CITATION_CACHE_PATH):
        return {}
    with open(CITATION_CACHE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_citation_cache(cache):
    os.makedirs(os.path.dirname(CITATION_CACHE_PATH), exist_ok=True)
    with open(CITATION_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2, sort_keys=True)


def fetch_openalex_citation_batch(dois):
    if not dois:
        return {}
    filter_value = "|".join(dois)
    params = {
        "filter": f"doi:{filter_value}",
        "per-page": 200,
        "select": "doi,cited_by_count",
        "mailto": OPENALEX_MAILTO,
    }
    url = "https://api.openalex.org/works?" + urlencode(params)
    with urlopen(url, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))

    result = {}
    for work in payload.get("results", []):
        doi_raw = work.get("doi")
        if not doi_raw:
            continue
        doi_str = doi_raw.strip().lower()
        if doi_str.startswith("https://doi.org/"):
            doi_str = doi_str.split("https://doi.org/", 1)[1]
        if not doi_str.startswith("10."):
            continue
        result[doi_str] = int(work.get("cited_by_count") or 0)
    return result


def build_citation_lookup(paper_records):
    cache = load_citation_cache()
    all_dois = sorted(
        set(p["doi"].strip().lower() for p in paper_records if p.get("doi"))
    )
    missing = [d for d in all_dois if d not in cache]
    for i in range(0, len(missing), OPENALEX_BATCH_SIZE):
        batch = missing[i : i + OPENALEX_BATCH_SIZE]
        fetched = fetch_openalex_citation_batch(batch)
        for doi in batch:
            cache[doi] = int(fetched.get(doi, 0))
        time.sleep(0.15)
    save_citation_cache(cache)
    return cache


def fetch_csrankings_csv():
    os.makedirs(os.path.dirname(CSRANKINGS_PATH), exist_ok=True)
    with urlopen(CSRANKINGS_URL, timeout=60) as r:
        raw = r.read().decode("utf-8", errors="replace")
    lines = [line for line in raw.splitlines() if line.strip()]
    with open(CSRANKINGS_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

def generate_per_year_data():
    fetch_csrankings_csv()
    faculty_set = load_faculty_names(CSRANKINGS_PATH)
    conf_to_area, area_to_parent = load_conference_to_area(AREA_PATH)
    year_area_data = get_cached_dblp_data(conf_to_area, faculty_set)
    year_conf_data = get_cached_dblp_conf_data(conf_to_area, faculty_set)

    if year_area_data is None:
        sys.exit(1)

    json_data = {
        "years": {},
        "years_by_conference": {},
        "area_to_parent": area_to_parent,
        "conference_to_area": conf_to_area,
        "available_areas": sorted(set(area_to_parent.keys())),
        "available_conferences": []
    }
    
    for year, area_data in year_area_data.items():
        year_str = str(year)
        json_data["years"][year_str] = {}
        
        for area, data in area_data.items():
            json_data["years"][year_str][area] = {
                "publication_count": data["publication_count"],
                "faculty_names": sorted(list(data["faculty_names"]))
            }

    conf_set = set()
    if year_conf_data:
        for year, confs in year_conf_data.items():
            year_str = str(year)
            json_data["years_by_conference"][year_str] = {}
            for conf, data in confs.items():
                conf_set.add(conf)
                json_data["years_by_conference"][year_str][conf] = {
                    "publication_count": data["publication_count"],
                    "faculty_names": sorted(list(data["faculty_names"])),
                    "area": conf_to_area.get(conf)
                }

    json_data["available_conferences"] = sorted(conf_set)
    
    with open("per_year_data.json", "w") as f:
        json.dump(json_data, f, indent=2)

if __name__ == "__main__":
    generate_per_year_data()
