import gzip
import xml.etree.ElementTree as ET

CSRANKINGS_PATH = "data/csrankings.csv"
AREA_PATH = "data/area.csv"
DBLP_PATH = "data/dblp.xml.gz"

_dblp_cache = None
_dblp_conf_cache = None

def load_faculty_names(csrankings_path):
    faculty_set = set()
    with open(csrankings_path, "r", encoding="utf-8") as f:
        next(f)
        for line in f:
            parts = line.strip().split(",")
            if len(parts) < 1:
                continue
            name = parts[0]
            faculty_set.add(name)
    return faculty_set

def load_conference_to_area(area_path):
    conf_to_area = {}
    area_to_parent = {}
    with open(area_path, "r", encoding="utf-8") as f:
        next(f)
        for line in f:
            parent_area, area, abbrv, conference = line.strip().split(",")
            conf_to_area[conference] = area
            area_to_parent[area] = parent_area
    return conf_to_area, area_to_parent

def parse_dblp_full(dblp_path, conf_to_area, faculty_set):
    year_area_data = {}
    year_conf_data = {}
    
    with gzip.open(dblp_path, "rb") as dblp_file:
        context = ET.iterparse(dblp_file, events=("end",))
        _, root = next(context)

        for _, elem in context:
            if elem.tag == "inproceedings":
                year_text = elem.findtext("year")
                booktitle = elem.findtext("booktitle")
                
                if not year_text or not booktitle:
                    root.clear()
                    continue

                try:
                    year = int(year_text)
                except ValueError:
                    root.clear()
                    continue

                area = None
                conference = None
                for conf, conf_area in conf_to_area.items():
                    if conf in booktitle:
                        area = conf_area
                        conference = conf
                        break

                if area:
                    if year not in year_area_data:
                        year_area_data[year] = {}
                    if area not in year_area_data[year]:
                        year_area_data[year][area] = {"publication_count": 0, "faculty_names": set()}
                    
                    year_area_data[year][area]["publication_count"] += 1

                    if conference:
                        if year not in year_conf_data:
                            year_conf_data[year] = {}
                        if conference not in year_conf_data[year]:
                            year_conf_data[year][conference] = {"publication_count": 0, "faculty_names": set()}
                        year_conf_data[year][conference]["publication_count"] += 1

                    for author_elem in elem.findall("author"):
                        author_name = author_elem.text
                        if author_name and author_name in faculty_set:
                            year_area_data[year][area]["faculty_names"].add(author_name)
                            if conference:
                                year_conf_data[year][conference]["faculty_names"].add(author_name)
                            
            root.clear()
    
    return year_area_data, year_conf_data

def get_cached_dblp_data(conf_to_area, faculty_set):
    global _dblp_cache, _dblp_conf_cache
    if _dblp_cache is None:
        _dblp_cache, _dblp_conf_cache = parse_dblp_full(DBLP_PATH, conf_to_area, faculty_set)
    return _dblp_cache

def get_cached_dblp_conf_data(conf_to_area, faculty_set):
    global _dblp_conf_cache
    if _dblp_conf_cache is None:
        get_cached_dblp_data(conf_to_area, faculty_set)
    return _dblp_conf_cache

def compute_fractional_faculty(area_to_faculty):
    faculty_to_areas = {}
    for area, faculty_members in area_to_faculty.items():
        for faculty_member in faculty_members:
            faculty_to_areas.setdefault(faculty_member, set()).add(area)

    area_to_fractional_faculty_count = {}
    for faculty, areas in faculty_to_areas.items():
        share = 1 / len(areas)
        for area in areas:
            area_to_fractional_faculty_count[area] = area_to_fractional_faculty_count.get(area, 0) + share

    return area_to_fractional_faculty_count

def compute_iclr_points_all_years(faculty_set, conf_to_area, area_to_parent, years=None, baseline_area="Machine learning"):
    year_area_data = get_cached_dblp_data(conf_to_area, faculty_set)
    available_years = sorted(year_area_data.keys())
    if years is None:
        years_to_aggregate = available_years
    else:
        years_to_aggregate = [y for y in years if y in available_years]
    
    if not years_to_aggregate:
        return []
    aggregated_publication_count_by_area = {}
    aggregated_faculty_sets_by_area = {}
    
    for year in years_to_aggregate:
        if year in year_area_data:
            for area, data in year_area_data[year].items():
                aggregated_publication_count_by_area[area] = aggregated_publication_count_by_area.get(area, 0) + data["publication_count"]
                if area not in aggregated_faculty_sets_by_area:
                    aggregated_faculty_sets_by_area[area] = set()
                aggregated_faculty_sets_by_area[area].update(data["faculty_names"])
    
    if not aggregated_publication_count_by_area:
        return []
    area_to_fractional_faculty_count = compute_fractional_faculty(aggregated_faculty_sets_by_area)
    baseline_fractional_faculty_count = area_to_fractional_faculty_count.get(baseline_area)
    baseline_publication_count = aggregated_publication_count_by_area.get(baseline_area)
    
    if baseline_fractional_faculty_count is None or baseline_publication_count is None or baseline_publication_count == 0:
        return []
    
    baseline = baseline_fractional_faculty_count / baseline_publication_count
    iclr_points_results = []
    for area in sorted(aggregated_publication_count_by_area.keys()):
        publication_count = aggregated_publication_count_by_area[area]
        fractional_faculty_count = area_to_fractional_faculty_count.get(area, 0)
        
        if publication_count == 0:
            continue
        
        faculty_per_pub = fractional_faculty_count / publication_count
        iclr_points = faculty_per_pub / baseline
        parent_area = area_to_parent.get(area)
        
        iclr_points_results.append({
            "area": area,
            "parent": parent_area,
            "publication_count": publication_count,
            "faculty_count": round(fractional_faculty_count, 2),
            "faculty_per_pub": round(faculty_per_pub, 6),
            "iclr_points": round(iclr_points, 2)
        })
    
    return iclr_points_results
