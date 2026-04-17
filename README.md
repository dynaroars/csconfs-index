# csconfs-index

`csconfs-index` compares CS conferences/areas by publication effort using CSRankings + DBLP-style venue groupings.

This project was inspired by the [**ICLRPoints**]( https://iclrpoints.com/) work ([arXiv](https://arxiv.org/abs/2503.16623))

Data sources used here include CSRankings and DBLP; venues are defined in `data/area.csv` (CSRankings + CORE A*).


---

## Prerequisites

- Python 3.8+
- Git

---

## Clone and setup

### 1. Clone

```bash
git clone https://github.com/dynaroars/csconfs-index.git
cd csconfs-index
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Data


 `area.csv` | Area ↔ conference mapping
 `csrankings_march.csv` | CSRankings faculty
 `dblp.xml.gz` | DBLP dump

Download DBLP (~1 GB): [dblp.org/xml/dblp.xml.gz](https://dblp.org/xml/dblp.xml.gz) or [FAQ](https://dblp.org/faq/1474679.html). Put `dblp.xml.gz` in `data/`:

```bash
mv ~/Downloads/dblp.xml.gz data/
# Windows: move %UserProfile%\Downloads\dblp.xml.gz data\
```

---

## Build

```bash
python generate_per_year_data.py
```

Reads DBLP + CSVs, writes `per_year_data.json`.

---

## Run

Serve over HTTP

**Option A — static server:**

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

---

## Project layout

```
csconfs-index/
├── index.html
├── app.js
├── styles.css
├── per_year_data.json    # generated
├── generate_per_year_data.py
├── requirements.txt
├── data/
│   ├── area.csv
│   ├── csrankings_march.csv
│   ├── csrankings.csv
│   └── dblp.xml.gz       # you download
└── backend/
    ├── iclr_api.py
    └── iclr_point.py
```

---

## Changing venues

Edit `data/area.csv`:

```text
parent_area,area,abbrv,conference
AI,Artificial intelligence,ai,AAAI
...
```

Then `python generate_per_year_data.py`, restart server, refresh.

---

## Data sources

- [CSRankings](https://csrankings.org) — faculty, venues
- [DBLP](https://dblp.org) — publications
- [CORE](https://www.core.edu.au/conference-portal) — A* venues in `area.csv`
