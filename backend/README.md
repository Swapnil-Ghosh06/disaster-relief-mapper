# 🌊 Disaster Relief Resource Mapper — Backend API

FastAPI backend service powering real-time flood inundation physics, cyclone radial damage estimation, elevation topography queries, and shortest-path emergency facility rerouting.

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

| Method | Endpoint | Description | Sample Parameters / Payload |
|--------|----------|-------------|-----------------------------|
| `GET` | `/` | Health check & service metadata | None |
| `GET` | `/regions` | Available disaster regions & coordinates | None |
| `GET` | `/resources` | Relief facilities for a region | `?region=chennai` |
| `GET` | `/elevation` | DEM elevation grid & bounding box | `?region=chennai` |
| `POST` | `/flood/simulate` | Simulates flood water level inundation | `{"region": "chennai", "water_level_m": 4.5}` |
| `POST` | `/cyclone/simulate` | Simulates cyclone wind swath damage | `{"region": "chennai", "eye_lat": 13.08, "eye_lng": 80.27, "radius_km": 10.0, "severity": 6}` |
| `POST` | `/reroute` | Computes nearest operational alternatives | `{"region": "chennai", "offline_ids": ["SH001", "MC001"]}` |

---

## 🧪 Running Automated Tests

```bash
pytest -v
```

---

## 📂 Project Structure

```
backend/
├── main.py                  # FastAPI app instance, CORS middleware, routes
├── requirements.txt         # Project dependencies
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
│   ├── elevation_*.csv      # Regional DEM CSV files
│   └── README.md            # Data dictionary documentation
└── tests/
    ├── __init__.py
    ├── test_api.py          # HTTP endpoint & status code tests
    └── test_engines.py      # Engine logic & mathematical formula tests
```
