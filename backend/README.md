# 🌊 Disaster Relief Resource Mapper — Backend API

FastAPI backend service powering real-time flood inundation physics, cyclone radial damage estimation, digital elevation model (DEM) topography queries, and shortest-path emergency facility rerouting.

Built with **Python (FastAPI) + React** for disaster response simulation.

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Generate Synthetic Datasets
```bash
python data/generate_data.py
```

### 3. Start Development Server
```bash
uvicorn main:app --reload --port 8000
```

Interactive OpenAPI Swagger documentation is available at:
👉 **`http://localhost:8000/docs`**

---

## 📡 API Endpoints

Full schema reference is documented in [`docs/SCHEMA.md`](file:///d:/Coding/disaster%20management/docs/SCHEMA.md).

| Method | Endpoint | Description | Request Parameters / Payload | Response Shape |
|--------|----------|-------------|------------------------------|----------------|
| `GET` | `/` | Service health status | None | `{"status": "online", "service": str, "version": str, "endpoints": [...]}` |
| `GET` | `/regions` | Available disaster regions & coordinates | None | `{"regions": [{"id": str, "name": str, "center_lat": float, "center_lng": float, "zoom": float, "disaster_risk": [...]}]}` |
| `GET` | `/resources` | Relief facilities for a region | Query: `?region=chennai` (optional) | `{"region": str, "total": int, "resources": [{"id": str, "type": str, "name": str, "lat": float, "lng": float, "elevation_m": float, "status": "online", ...}]}` |
| `GET` | `/elevation` | DEM elevation grid & bounding box | Query: `?region=chennai` (optional) | `{"region": str, "bbox": {"min_lat": float, "max_lat": float, ...}, "grid": [{"lat": float, "lng": float, "elevation_m": float}]}` |
| `POST` | `/flood/simulate` | Simulates flood water level inundation | Body: `{"region": "chennai", "water_level_m": 4.5, "resource_ids": []}` | `{"water_level_m": float, "offline": [str], "online": [str], "affected_capacity": int}` |
| `POST` | `/cyclone/simulate` | Simulates cyclone wind swath damage | Body: `{"region": "chennai", "eye_lat": 13.08, "eye_lng": 80.27, "radius_km": 10.0, "severity": 6}` | `{"eye": {"lat": float, "lng": float}, "radius_km": float, "severity": int, "damaged": [str], "safe": [str], "affected_capacity": int}` |
| `POST` | `/reroute` | Computes nearest operational alternatives | Body: `{"region": "chennai", "offline_ids": ["SH001", "MC001"]}` | `{"routes": [{"from_id": str, "from_name": str, "to_id": str, "to_name": str, "distance_km": float, "resource_type": str}]}` |

---

## 🧪 Running Automated Tests

```bash
pytest -v
```

---

## 📂 Project Structure

```
backend/
├── main.py                  # FastAPI app instance, CORS middleware, routes & input validation
├── requirements.txt         # Pinned project dependencies
├── models/
│   ├── __init__.py
│   └── schemas.py           # Pydantic request & response schemas
├── engines/
│   ├── __init__.py
│   ├── flood_engine.py      # Flood water inundation logic & DEM lookup caching
│   ├── cyclone_engine.py    # Haversine distance & cyclone damage simulation
│   └── router.py            # Nearest-alternative geodesic routing algorithm
├── data/
│   ├── generate_data.py     # Synthetic data & DEM elevation grid generator
│   ├── resources.json       # Relief resource catalog
│   ├── elevation_*.csv      # Regional DEM CSV files (~300m resolution)
│   └── README.md            # Data dictionary documentation
└── tests/
    ├── __init__.py
    ├── test_api.py          # HTTP endpoint & status code tests
    └── test_engines.py      # Engine logic & mathematical formula tests
```
