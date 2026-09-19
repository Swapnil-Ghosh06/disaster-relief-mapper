# ⚙️ ZAHID — Personal Phase Plan
## Disaster Relief Resource Mapper | Backend + Data Logic

> **Role:** Backend Engineer + Data Pipeline Lead  
> **Stack:** Python, FastAPI, Pandas, GeoPandas, NumPy  
> **Deadline:** 30 September 2026  
> **Days:** 11

---

## 🗓️ Phase Overview

| Phase | What | Days | Status |
|-------|------|------|--------|
| 0 | Python Environment + FastAPI Skeleton | Day 1 | ✅ |
| 1 | Synthetic Data + Elevation Pipeline | Days 2–3 | ✅ |
| 2 | Flood Engine + API | Days 4–5 | ✅ |
| 3 | Cyclone Engine + API | Days 6–7 | ✅ |
| 4 | Rerouting Engine + API | Day 8 | ✅ |
| 5 | Validation + Docs + README | Days 9–10 | ✅ |
| 6 | Integration Testing + Fixes | Day 11 | ✅ |

---

## 📅 Phase 0 — Day 1
### Python Environment + FastAPI Skeleton

**Goal:** Backend server runs, CORS enabled, all empty routes defined. Swapnil can call your API on Day 2 even if responses are empty.

**Tasks:**
- [x] Clone GitHub repo (Swapnil shares link)
- [x] Create and activate virtual environment:
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate   # Windows: venv\Scripts\activate
  ```
- [x] Install all dependencies:
  ```bash
  pip install fastapi uvicorn pandas geopandas numpy scipy requests pydantic rasterio
  pip freeze > requirements.txt
  ```
- [x] Create `main.py` with full FastAPI skeleton:
- [x] Create folder structure:
  ```
  backend/
  ├── main.py
  ├── engines/
  │   ├── __init__.py
  │   ├── flood_engine.py
  │   ├── cyclone_engine.py
  │   └── router.py
  ├── data/
  │   ├── generate_data.py
  │   └── resources.json  (empty for now)
  ├── models/
  │   ├── __init__.py
  │   └── schemas.py
  └── requirements.txt
  ```
- [x] Run server:
  ```bash
  uvicorn main:app --reload --port 8000
  ```
- [x] Open `http://localhost:8000/docs` → confirm all 6 routes visible in Swagger UI
- [x] Push: `feat: backend FastAPI skeleton with all routes`
- [x] Message Swapnil: "Backend up at port 8000, all routes returning 200"

**Done when:** `http://localhost:8000/docs` shows all 6 endpoints, CORS allows localhost:5173.

---

## 📅 Phase 1 — Days 2–3
### Synthetic Data Generation + Elevation Pipeline

**Goal:** `resources.json` fully populated with realistic data. Elevation CSVs ready for all 4 cities. Swapnil can load real markers on Day 3.

### Day 2 — Synthetic Resource Generator

- [x] Create `data/generate_data.py`:
- [x] Populate `SHELTER_NAMES`, `FOOD_BANK_NAMES`, `MEDICAL_NAMES` lists (10 each, unique)
- [x] `elevation_m` = random float between 0.5–12.0 (coastal cities have low elevation)
- [x] `status` = always `"online"` in generated data (simulation changes it at runtime)
- [x] Run script → verify `resources.json` has 65 items across all regions
- [x] Commit: `data: add synthetic resource generator and resources.json`
- [x] Share `resources.json` path with Swapnil so he can mock frontend

### Day 3 — Elevation Data

- [x] Generate elevation CSVs for all regions
- [x] Update `GET /elevation` endpoint to return actual data
- [x] Update `GET /resources` to filter by region and return real data
- [x] Update `GET /regions` to return full city configs
- [x] Test all 3 GET endpoints with Postman or curl
- [x] Commit: `feat: GET /resources, /elevation, /regions all returning real data`
- [x] Message Swapnil: "GET endpoints ready, test with region=chennai"

**Done when:** Swapnil can call all 3 GET endpoints and receive real data.

---

## 📅 Phase 2 — Days 4–5
### Flood Engine + API

**Goal:** `/flood/simulate` endpoint correctly identifies which resources go underwater at any given water level.

### Day 4 — Flood Engine Logic

- [ ] Create `engines/flood_engine.py`:

```python
import pandas as pd
from typing import List, Dict

def load_elevation(region: str) -> Dict:
    """Load elevation grid for a region into a lookup dict."""
    df = pd.read_csv(f"data/elevation_{region}.csv")
    # Build lookup: (rounded_lat, rounded_lng) → elevation_m
    lookup = {}
    for _, row in df.iterrows():
        key = (round(row["lat"], 3), round(row["lng"], 3))
        lookup[key] = row["elevation_m"]
    return lookup


def get_resource_elevation(resource: dict, elevation_lookup: dict) -> float:
    """Find the elevation at a resource's coordinates."""
    # Round to match lookup grid resolution
    key = (round(resource["lat"], 3), round(resource["lng"], 3))
    
    if key in elevation_lookup:
        return elevation_lookup[key]
    
    # Fallback: find nearest grid point
    min_dist = float("inf")
    nearest_elev = resource.get("elevation_m", 5.0)  # use stored value if no match
    
    for (glat, glng), elev in elevation_lookup.items():
        dist = abs(glat - resource["lat"]) + abs(glng - resource["lng"])
        if dist < min_dist:
            min_dist = dist
            nearest_elev = elev
    
    return nearest_elev


def simulate_flood(water_level_m: float, resources: List[dict], elevation_lookup: dict) -> dict:
    """
    Given a water level, determine which resources are submerged.
    
    Returns:
        dict with 'offline' and 'online' resource ID lists
    """
    offline = []
    online = []
    affected_capacity = 0
    
    for resource in resources:
        elev = get_resource_elevation(resource, elevation_lookup)
        
        if elev < water_level_m:
            offline.append(resource["id"])
            # Sum up capacity of offline resources
            cap = resource.get("capacity") or resource.get("daily_meals") or resource.get("beds") or 0
            affected_capacity += cap
        else:
            online.append(resource["id"])
    
    return {
        "water_level_m": water_level_m,
        "offline": offline,
        "online": online,
        "affected_capacity": affected_capacity
    }
```

### Day 5 — Wire Flood Endpoint

- [x] Create Pydantic model in `models/schemas.py`
- [x] Update `/flood/simulate` in `main.py`
- [x] Test cases with Postman/pytest:
  - water_level_m = 0 → all online
  - water_level_m = 3.0 → coastal resources offline
  - water_level_m = 10.0 → most resources offline
- [x] Confirm response matches SCHEMA.md format exactly
- [x] Commit: `feat: flood simulation engine and /flood/simulate endpoint`
- [x] Message Swapnil: "POST /flood/simulate ready, test with water_level_m values 0–10"

**Done when:** Flood endpoint returns correct offline/online split for any water level.

---

## 📅 Phase 3 — Days 6–7
### Cyclone Engine + API

**Goal:** `/cyclone/simulate` identifies resources within the storm's wind radius using Haversine distance.

### Day 6 — Haversine + Cyclone Logic

- [x] Create `engines/cyclone_engine.py`

### Day 7 — Wire Cyclone Endpoint

- [x] Add Pydantic model
- [x] Update `/cyclone/simulate` in `main.py`
- [x] Test cases with Postman/pytest:
  - Eye at Chennai coast (13.06, 80.29), radius 5km → only coastal resources damaged
  - Eye at city center, radius 20km → most resources damaged
  - Severity 1 vs severity 10 → different effective radius
- [x] Confirm response matches SCHEMA.md format
- [x] Commit: `feat: cyclone engine with haversine and /cyclone/simulate endpoint`
- [x] Message Swapnil: "POST /cyclone/simulate ready — click anywhere on map and send those coords"

**Done when:** Cyclone endpoint correctly identifies resources within wind radius.

---

## 📅 Phase 4 — Day 8
### Rerouting Engine + API

**Goal:** When resources go offline, find the nearest available alternative of the same type. Return route details for Swapnil to draw arcs on map.

- [x] Create `engines/router.py`
- [x] Add Pydantic model
- [x] Update `/reroute` endpoint
- [x] Test cases:
  - 1 offline shelter → returns nearest online shelter
  - 5 offline resources (mixed types) → 5 routes of correct types
  - All shelters offline → each points to the next available one
  - 0 offline → empty routes array
- [x] Commit: `feat: rerouting engine and /reroute endpoint`
- [x] Message Swapnil: "POST /reroute ready — send offline_ids array and region"

**Done when:** Reroute endpoint returns correct nearest-alternative routes for any set of offline IDs.

---

## 📅 Phase 5 — Days 9–10
### Validation + Docs + README

**Goal:** Code is clean, validated, documented. README is submission-ready.

### Day 9 — Input Validation + Error Handling

- [x] Add validation to all endpoints
- [x] Wrap file reads in try/except with proper error messages
- [x] Test all error cases: invalid region, missing file, bad params
- [x] Add docstrings to every function in all engine files (academic requirement)

### Day 10 — README + Data Docs

- [x] Write `README.md`
- [x] Write `data/README.md` — explain each data file, how generated, what each field means
- [x] Verify FastAPI auto-docs at `/docs` is complete and accurate
- [x] Run `generate_data.py` from scratch → confirm clean run
- [x] Run full backend from scratch → all 6 endpoints return correct data
- [x] Commit: `docs: complete README, data documentation, API validation`

**Done when:** New person can clone repo, follow README, and have backend running in under 5 minutes.

---

## 📅 Phase 6 — Day 11
### Integration Testing + Bug Fixes

**Goal:** Backend works perfectly with Swapnil's frontend. All flows tested end-to-end.

- [x] Full flood flow: Swapnil triggers flood → `/flood/simulate` returns correct data → `/reroute` returns correct routes
- [x] Full cyclone flow: Eye placed on map → `/cyclone/simulate` → `/reroute`
- [x] Region switching: Mumbai data loads correctly, elevation different from Chennai
- [x] All regions tested
- [x] API response time < 200ms for all endpoints (test with Postman/pytest timer)
- [x] Fix any data format mismatches with frontend
- [x] Fix any CORS issues
- [x] Final cleanup — remove debug prints, clean up commented code
- [x] Final commit: `feat: backend complete v1.0 — all endpoints tested and verified`

---

## 🧪 Testing Checklist (Postman)

```
GET /regions
  ✓ Returns 4 cities with correct coordinates

GET /resources?region=chennai
  ✓ Returns ~65 resources
  ✓ All have id, type, name, lat, lng, elevation_m, status
  ✓ All status = "online"

GET /elevation?region=chennai
  ✓ Returns grid array
  ✓ Each item has lat, lng, elevation_m
  ✓ Coastal cells (lng ~80.28) have lower elevation

POST /flood/simulate { region: "chennai", water_level_m: 0 }
  ✓ All resources online, none offline

POST /flood/simulate { region: "chennai", water_level_m: 5 }
  ✓ Resources below 5m elevation → offline
  ✓ affected_capacity > 0

POST /cyclone/simulate { region: "chennai", eye_lat: 13.06, eye_lng: 80.29, radius_km: 5, severity: 5 }
  ✓ Coastal resources within 5km → damaged
  ✓ Inland resources → safe

POST /reroute { offline_ids: ["SH001", "FB001"], region: "chennai" }
  ✓ Returns 2 routes
  ✓ Each route has from → to of same resource_type
  ✓ distance_km is a positive number
  ✓ to_id is NOT in offline_ids

POST /reroute { offline_ids: [], region: "chennai" }
  ✓ Returns empty routes array
```

---

## 🚨 Blockers to Watch

| Risk | What to do |
|------|-----------|
| OpenTopography download fails | Use synthetic elevation generator (Option B in Phase 1) |
| `geopandas` install fails | `pip install geopandas` sometimes needs `GDAL` — use `conda install geopandas` as fallback |
| `rasterio` install fails | Skip it, use synthetic elevation instead |
| API too slow | Cache elevation lookup dict at startup, not on every request |

---

## ✅ Zahid's Daily Checklist Template

```
Day X — [Phase Name]

Morning:
  [ ] git pull origin dev
  [ ] Check if Swapnil needs any API changes
  [ ] Check today's tasks in this doc

During:
  [ ] Build
  [ ] Test each endpoint after implementing
  [ ] Commit every 2 hours: feat/fix: description

End of day:
  [ ] Push branch
  [ ] Open PR to dev
  [ ] Message Swapnil: "Done with X endpoint, ready at /route_name"
  [ ] Share any schema changes that affect frontend
  [ ] Check tomorrow's tasks
```
