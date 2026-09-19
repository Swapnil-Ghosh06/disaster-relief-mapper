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
| 0 | Python Environment + FastAPI Skeleton | Day 1 | ⬜ |
| 1 | Synthetic Data + Elevation Pipeline | Days 2–3 | ⬜ |
| 2 | Flood Engine + API | Days 4–5 | ⬜ |
| 3 | Cyclone Engine + API | Days 6–7 | ⬜ |
| 4 | Rerouting Engine + API | Day 8 | ⬜ |
| 5 | Validation + Docs + README | Days 9–10 | ⬜ |
| 6 | Integration Testing + Fixes | Day 11 | ⬜ |

---

## 📅 Phase 0 — Day 1
### Python Environment + FastAPI Skeleton

**Goal:** Backend server runs, CORS enabled, all empty routes defined. Swapnil can call your API on Day 2 even if responses are empty.

**Tasks:**
- [ ] Clone GitHub repo (Swapnil shares link)
- [ ] Create and activate virtual environment:
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate   # Windows: venv\Scripts\activate
  ```
- [ ] Install all dependencies:
  ```bash
  pip install fastapi uvicorn pandas geopandas numpy scipy requests pydantic rasterio
  pip freeze > requirements.txt
  ```
- [ ] Create `main.py` with full FastAPI skeleton:
  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  
  app = FastAPI(title="Disaster Relief Mapper API", version="1.0")
  
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:5173"],
      allow_methods=["*"],
      allow_headers=["*"]
  )
  
  @app.get("/resources")
  async def get_resources(region: str = "chennai"):
      return {"status": "coming soon"}
  
  @app.get("/elevation")
  async def get_elevation(region: str = "chennai"):
      return {"status": "coming soon"}
  
  @app.get("/regions")
  async def get_regions():
      return {"status": "coming soon"}
  
  @app.post("/flood/simulate")
  async def flood_simulate():
      return {"status": "coming soon"}
  
  @app.post("/cyclone/simulate")
  async def cyclone_simulate():
      return {"status": "coming soon"}
  
  @app.post("/reroute")
  async def reroute():
      return {"status": "coming soon"}
  ```
- [ ] Create folder structure:
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
- [ ] Run server:
  ```bash
  uvicorn main:app --reload --port 8000
  ```
- [ ] Open `http://localhost:8000/docs` → confirm all 6 routes visible in Swagger UI
- [ ] Push: `feat: backend FastAPI skeleton with all routes`
- [ ] Message Swapnil: "Backend up at port 8000, all routes returning 200"

**Done when:** `http://localhost:8000/docs` shows all 6 endpoints, CORS allows localhost:5173.

---

## 📅 Phase 1 — Days 2–3
### Synthetic Data Generation + Elevation Pipeline

**Goal:** `resources.json` fully populated with realistic data. Elevation CSVs ready for all 4 cities. Swapnil can load real markers on Day 3.

### Day 2 — Synthetic Resource Generator

- [ ] Create `data/generate_data.py`:

**Chennai bounding box:** lat 12.95–13.25, lng 80.15–80.32

```python
import json
import random

REGIONS = {
    "chennai":      {"lat": (12.95, 13.25), "lng": (80.15, 80.32)},
    "mumbai":       {"lat": (18.90, 19.25), "lng": (72.77, 72.98)},
    "bhubaneswar":  {"lat": (20.20, 20.40), "lng": (85.75, 85.92)},
    "kolkata":      {"lat": (22.45, 22.70), "lng": (88.28, 88.47)},
}

def random_coord(region_id):
    r = REGIONS[region_id]
    return (
        round(random.uniform(*r["lat"]), 4),
        round(random.uniform(*r["lng"]), 4)
    )

# Generate 30 shelters, 20 food banks, 15 medical camps per region
# Each resource needs:
#   id, type, name, lat, lng, elevation_m, capacity/beds/daily_meals, status, contact, address, region
```

- [ ] Populate `SHELTER_NAMES`, `FOOD_BANK_NAMES`, `MEDICAL_NAMES` lists (10 each, unique)
- [ ] `elevation_m` = random float between 0.5–12.0 (coastal cities have low elevation)
- [ ] `status` = always `"online"` in generated data (simulation changes it at runtime)
- [ ] Run script → verify `resources.json` has 65 items across all regions
- [ ] Commit: `data: add synthetic resource generator and resources.json`
- [ ] Share `resources.json` path with Swapnil so he can mock frontend

### Day 3 — Elevation Data

**Option A (Preferred) — Use pre-built CSV:**
- [ ] Download SRTM data from: https://opentopography.org
  - Select region: Chennai bbox
  - Format: GeoTIFF
  - Download and process with `rasterio`

```python
# Process elevation GeoTIFF → CSV grid
import rasterio
import numpy as np
import pandas as pd

with rasterio.open("srtm_chennai.tif") as src:
    data = src.read(1)
    transform = src.transform
    
rows = []
for i in range(0, data.shape[0], 10):   # sample every 10 pixels
    for j in range(0, data.shape[1], 10):
        lng, lat = transform * (j, i)
        elevation = float(data[i, j])
        if elevation > -9999:   # filter nodata
            rows.append({"lat": round(lat, 4), "lng": round(lng, 4), "elevation_m": round(elevation, 1)})

pd.DataFrame(rows).to_csv("data/elevation_chennai.csv", index=False)
```

**Option B (Fallback) — Generate synthetic elevation:**
```python
# If OpenTopography download fails, generate synthetic coastal elevation
# Chennai coast is low (0-3m), inland rises to 10-15m
import numpy as np

lats = np.arange(12.95, 13.25, 0.003)
lngs = np.arange(80.15, 80.32, 0.003)

rows = []
for lat in lats:
    for lng in lngs:
        # Simple gradient: closer to coast (lng ~80.28) = lower elevation
        dist_from_coast = abs(lng - 80.28)
        elevation = max(0.5, dist_from_coast * 60 + random.uniform(-1, 2))
        rows.append({"lat": round(lat,4), "lng": round(lng,4), "elevation_m": round(elevation,1)})
```

- [ ] Generate elevation CSVs for all 4 regions
- [ ] Update `GET /elevation` endpoint to return actual data:
  ```python
  @app.get("/elevation")
  async def get_elevation(region: str = "chennai"):
      df = pd.read_csv(f"data/elevation_{region}.csv")
      return {
          "region": region,
          "grid": df.to_dict(orient="records")
      }
  ```
- [ ] Update `GET /resources` to filter by region and return real data:
  ```python
  @app.get("/resources")
  async def get_resources(region: str = "chennai"):
      with open("data/resources.json") as f:
          all_resources = json.load(f)
      filtered = [r for r in all_resources if r["region"] == region]
      return {"region": region, "total": len(filtered), "resources": filtered}
  ```
- [ ] Update `GET /regions` to return full city configs:
  ```python
  @app.get("/regions")
  async def get_regions():
      return {"regions": [
          {"id": "chennai", "name": "Chennai, Tamil Nadu", "center_lat": 13.0827, "center_lng": 80.2707, "zoom": 11},
          {"id": "mumbai", "name": "Mumbai, Maharashtra", "center_lat": 19.0760, "center_lng": 72.8777, "zoom": 11},
          {"id": "bhubaneswar", "name": "Bhubaneswar, Odisha", "center_lat": 20.2961, "center_lng": 85.8245, "zoom": 11},
          {"id": "kolkata", "name": "Kolkata, West Bengal", "center_lat": 22.5726, "center_lng": 88.3639, "zoom": 11},
      ]}
  ```
- [ ] Test all 3 GET endpoints with Postman or curl
- [ ] Commit: `feat: GET /resources, /elevation, /regions all returning real data`
- [ ] Message Swapnil: "GET endpoints ready, test with region=chennai"

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

- [ ] Create Pydantic model in `models/schemas.py`:
  ```python
  from pydantic import BaseModel
  from typing import List
  
  class FloodSimulateRequest(BaseModel):
      region: str
      water_level_m: float
      resource_ids: List[str] = []   # optional filter
  ```
- [ ] Update `/flood/simulate` in `main.py`:
  ```python
  from engines.flood_engine import load_elevation, simulate_flood
  import json
  
  @app.post("/flood/simulate")
  async def flood_simulate(request: FloodSimulateRequest):
      with open("data/resources.json") as f:
          all_resources = json.load(f)
      
      resources = [r for r in all_resources if r["region"] == request.region]
      elevation_lookup = load_elevation(request.region)
      result = simulate_flood(request.water_level_m, resources, elevation_lookup)
      return result
  ```
- [ ] Test cases with Postman:
  - water_level_m = 0 → all online
  - water_level_m = 3.0 → coastal resources offline
  - water_level_m = 10.0 → most resources offline
- [ ] Confirm response matches SCHEMA.md format exactly
- [ ] Commit: `feat: flood simulation engine and /flood/simulate endpoint`
- [ ] Message Swapnil: "POST /flood/simulate ready, test with water_level_m values 0–10"

**Done when:** Flood endpoint returns correct offline/online split for any water level.

---

## 📅 Phase 3 — Days 6–7
### Cyclone Engine + API

**Goal:** `/cyclone/simulate` identifies resources within the storm's wind radius using Haversine distance.

### Day 6 — Haversine + Cyclone Logic

- [ ] Create `engines/cyclone_engine.py`:

```python
import math
from typing import List

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate great-circle distance between two points in kilometers.
    Uses Haversine formula.
    """
    R = 6371   # Earth radius in km
    
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def apply_severity(radius_km: float, severity: int) -> float:
    """Scale actual damage radius based on severity (1-10)."""
    # Severity 1 = 50% of stated radius, Severity 10 = 150%
    scale = 0.5 + (severity / 10)
    return radius_km * scale


def simulate_cyclone(
    eye_lat: float,
    eye_lng: float,
    radius_km: float,
    severity: int,
    resources: List[dict]
) -> dict:
    """
    Given cyclone eye position and wind radius, determine affected resources.
    
    Returns:
        dict with 'damaged' and 'safe' resource ID lists
    """
    effective_radius = apply_severity(radius_km, severity)
    
    damaged = []
    safe = []
    affected_capacity = 0
    
    for resource in resources:
        dist = haversine(eye_lat, eye_lng, resource["lat"], resource["lng"])
        
        if dist <= effective_radius:
            damaged.append(resource["id"])
            cap = resource.get("capacity") or resource.get("daily_meals") or resource.get("beds") or 0
            affected_capacity += cap
        else:
            safe.append(resource["id"])
    
    return {
        "eye": {"lat": eye_lat, "lng": eye_lng},
        "radius_km": effective_radius,
        "severity": severity,
        "damaged": damaged,
        "safe": safe,
        "affected_capacity": affected_capacity
    }
```

### Day 7 — Wire Cyclone Endpoint

- [ ] Add Pydantic model:
  ```python
  class CycloneSimulateRequest(BaseModel):
      region: str
      eye_lat: float
      eye_lng: float
      radius_km: float
      severity: int   # 1-10
  ```
- [ ] Update `/cyclone/simulate` in `main.py`:
  ```python
  from engines.cyclone_engine import simulate_cyclone
  
  @app.post("/cyclone/simulate")
  async def cyclone_simulate(request: CycloneSimulateRequest):
      with open("data/resources.json") as f:
          all_resources = json.load(f)
      
      resources = [r for r in all_resources if r["region"] == request.region]
      result = simulate_cyclone(
          request.eye_lat, request.eye_lng,
          request.radius_km, request.severity,
          resources
      )
      return result
  ```
- [ ] Test cases with Postman:
  - Eye at Chennai coast (13.06, 80.29), radius 5km → only coastal resources damaged
  - Eye at city center, radius 20km → most resources damaged
  - Severity 1 vs severity 10 → different effective radius
- [ ] Confirm response matches SCHEMA.md format
- [ ] Commit: `feat: cyclone engine with haversine and /cyclone/simulate endpoint`
- [ ] Message Swapnil: "POST /cyclone/simulate ready — click anywhere on map and send those coords"

**Done when:** Cyclone endpoint correctly identifies resources within wind radius.

---

## 📅 Phase 4 — Day 8
### Rerouting Engine + API

**Goal:** When resources go offline, find the nearest available alternative of the same type. Return route details for Swapnil to draw arcs on map.

- [ ] Create `engines/router.py`:

```python
from engines.cyclone_engine import haversine
from typing import List, Dict

def find_nearest_alternative(
    offline_resource: dict,
    all_resources: List[dict],
    offline_ids: List[str]
) -> dict | None:
    """
    Find nearest online resource of the same type as the offline one.
    
    Args:
        offline_resource: The resource that just went offline
        all_resources: All resources in the region
        offline_ids: IDs of all currently offline resources
    
    Returns:
        Route dict or None if no alternative found
    """
    resource_type = offline_resource["type"]
    
    # Candidates: same type, not in offline list
    candidates = [
        r for r in all_resources
        if r["type"] == resource_type and r["id"] not in offline_ids
    ]
    
    if not candidates:
        return None   # No alternatives available for this type
    
    # Sort by distance from offline resource
    candidates.sort(key=lambda c: haversine(
        offline_resource["lat"], offline_resource["lng"],
        c["lat"], c["lng"]
    ))
    
    nearest = candidates[0]
    distance = haversine(
        offline_resource["lat"], offline_resource["lng"],
        nearest["lat"], nearest["lng"]
    )
    
    return {
        "from_id": offline_resource["id"],
        "from_name": offline_resource["name"],
        "from_lat": offline_resource["lat"],
        "from_lng": offline_resource["lng"],
        "to_id": nearest["id"],
        "to_name": nearest["name"],
        "to_lat": nearest["lat"],
        "to_lng": nearest["lng"],
        "distance_km": round(distance, 2),
        "resource_type": resource_type
    }


def generate_all_routes(offline_ids: List[str], all_resources: List[dict]) -> List[dict]:
    """Generate rerouting for all offline resources."""
    offline_resources = [r for r in all_resources if r["id"] in offline_ids]
    
    routes = []
    for resource in offline_resources:
        route = find_nearest_alternative(resource, all_resources, offline_ids)
        if route:
            routes.append(route)
    
    return routes
```

- [ ] Add Pydantic model:
  ```python
  class RerouteRequest(BaseModel):
      offline_ids: List[str]
      region: str
  ```
- [ ] Update `/reroute` endpoint:
  ```python
  from engines.router import generate_all_routes
  
  @app.post("/reroute")
  async def reroute(request: RerouteRequest):
      with open("data/resources.json") as f:
          all_resources = json.load(f)
      
      resources = [r for r in all_resources if r["region"] == request.region]
      routes = generate_all_routes(request.offline_ids, resources)
      return {"routes": routes}
  ```
- [ ] Test cases:
  - 1 offline shelter → returns nearest online shelter
  - 5 offline resources (mixed types) → 5 routes of correct types
  - All shelters offline → each points to the next available one
  - 0 offline → empty routes array
- [ ] Commit: `feat: rerouting engine and /reroute endpoint`
- [ ] Message Swapnil: "POST /reroute ready — send offline_ids array and region"

**Done when:** Reroute endpoint returns correct nearest-alternative routes for any set of offline IDs.

---

## 📅 Phase 5 — Days 9–10
### Validation + Docs + README

**Goal:** Code is clean, validated, documented. README is submission-ready.

### Day 9 — Input Validation + Error Handling

- [ ] Add validation to all endpoints:
  ```python
  from fastapi import HTTPException
  
  VALID_REGIONS = ["chennai", "mumbai", "bhubaneswar", "kolkata"]
  
  # In each endpoint that takes region:
  if request.region not in VALID_REGIONS:
      raise HTTPException(status_code=400, detail=f"Invalid region. Choose from: {VALID_REGIONS}")
  
  # For cyclone severity:
  if not 1 <= request.severity <= 10:
      raise HTTPException(status_code=400, detail="Severity must be between 1 and 10")
  
  # For water level:
  if not 0 <= request.water_level_m <= 20:
      raise HTTPException(status_code=400, detail="Water level must be between 0 and 20 meters")
  ```
- [ ] Wrap file reads in try/except with proper error messages
- [ ] Test all error cases: invalid region, missing file, bad params
- [ ] Add docstrings to every function in all engine files (academic requirement):
  ```python
  def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
      """
      Calculate the great-circle distance between two geographic coordinates.
      
      Uses the Haversine formula to account for Earth's curvature.
      
      Args:
          lat1: Latitude of point 1 in decimal degrees
          lng1: Longitude of point 1 in decimal degrees
          lat2: Latitude of point 2 in decimal degrees
          lng2: Longitude of point 2 in decimal degrees
      
      Returns:
          Distance in kilometers (float)
      
      Example:
          >>> haversine(13.0827, 80.2707, 13.0900, 80.2800)
          1.34
      """
  ```

### Day 10 — README + Data Docs

- [ ] Write `README.md` (see template below)
- [ ] Write `data/README.md` — explain each data file, how generated, what each field means
- [ ] Verify FastAPI auto-docs at `/docs` is complete and accurate
- [ ] Run `generate_data.py` from scratch → confirm clean run
- [ ] Run full backend from scratch → all 6 endpoints return correct data
- [ ] Commit: `docs: complete README, data documentation, API validation`

**README Template:**
```markdown
# Disaster Relief Resource Mapper — Backend

Python FastAPI backend for disaster simulation and resource rerouting.

## Setup
\`\`\`bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python data/generate_data.py
uvicorn main:app --reload --port 8000
\`\`\`

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /resources | All resources for a region |
| GET | /elevation | Elevation grid for a region |
| GET | /regions | Available city configs |
| POST | /flood/simulate | Flood impact calculation |
| POST | /cyclone/simulate | Cyclone impact calculation |
| POST | /reroute | Find nearest available resources |

Full docs: http://localhost:8000/docs

## Data
- resources.json: 65 synthetic relief resources across 4 Indian cities
- elevation_*.csv: SRTM elevation grids (30m resolution)
```

**Done when:** New person can clone repo, follow README, and have backend running in under 5 minutes.

---

## 📅 Phase 6 — Day 11
### Integration Testing + Bug Fixes

**Goal:** Backend works perfectly with Swapnil's frontend. All flows tested end-to-end.

- [ ] Full flood flow: Swapnil triggers flood → `/flood/simulate` returns correct data → `/reroute` returns correct routes
- [ ] Full cyclone flow: Eye placed on map → `/cyclone/simulate` → `/reroute`
- [ ] Region switching: Mumbai data loads correctly, elevation different from Chennai
- [ ] All 4 regions tested
- [ ] API response time < 200ms for all endpoints (test with Postman timer)
- [ ] Fix any data format mismatches with frontend
- [ ] Fix any CORS issues
- [ ] Final cleanup — remove debug prints, clean up commented code
- [ ] Final commit: `feat: backend complete v1.0 — all endpoints tested and verified`

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
