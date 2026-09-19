# 🛠️ Tech Stack
## Disaster Relief Resource Mapper

---

## Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | UI framework | Component model, state management |
| Vite | 5.x | Build tool | Fast HMR, modern bundling |
| deck.gl | 8.x | 3D map layers | GPU-accelerated geospatial rendering |
| react-map-gl | 7.x | Base map wrapper | React bindings for MapLibre |
| MapLibre GL JS | 3.x | Map rendering engine | Open source, no paid API key |
| Three.js | 0.165.x | 3D graphics | Cyclone particle system animation |
| @react-three/fiber | 8.x | React + Three.js | Declarative Three.js in React |
| @react-three/drei | 9.x | Three.js helpers | Pre-built useful Three.js components |
| Framer Motion | 11.x | UI animations | Panel transitions, loading states |
| Axios | 1.x | HTTP client | API calls to FastAPI backend |
| @radix-ui/react-slider | latest | Slider components | Accessible, customizable sliders |

### Map Tiles
- **OpenStreetMap** via MapLibre — free, no API key needed
- Dark style: `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` (free)

---

## Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.11+ | Primary language | Academic requirement |
| FastAPI | 0.111.x | REST API framework | Fast, auto-docs, async support |
| Uvicorn | 0.29.x | ASGI server | Runs FastAPI locally |
| Pandas | 2.x | Data manipulation | CSV/JSON processing |
| GeoPandas | 0.14.x | Geospatial data | Coordinate operations |
| NumPy | 1.26.x | Numerical operations | Elevation grid math |
| SciPy | 1.13.x | Scientific computing | Distance calculations |
| Pydantic | 2.x | Data validation | Request/response schemas |
| Requests | 2.x | HTTP client | Fetch elevation data if needed |

---

## Data Sources

| Data | Source | Format | Cost |
|------|--------|--------|------|
| Base map tiles | OpenStreetMap / CartoDB | Vector tiles | Free |
| Elevation (terrain) | SRTM via NASA EarthData | GeoTIFF → CSV | Free |
| Resource data | Synthetic (generated) | JSON | N/A |
| City boundaries | OpenStreetMap Nominatim | GeoJSON | Free |

### SRTM Elevation Data
- URL: https://earthexplorer.usgs.gov (free registration)
- Alternative: https://opentopography.org (API, free tier)
- Format: GeoTIFF, converted to CSV grid via `rasterio`
- Resolution: 30m x 30m cells (SRTM 1 arc-second)

---

## Dev Tools

| Tool | Purpose |
|------|---------|
| Git + GitHub | Version control |
| VS Code | IDE (both members) |
| Postman | API testing (Zahid) |
| Python venv | Backend isolation |
| npm | Frontend package management |
| ESLint + Prettier | Frontend code quality |

---

## Folder Structure

```
disaster-relief-mapper/
├── frontend/                    # React app (Swapnil)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx          # Main deck.gl map
│   │   │   ├── FloodLayer.jsx       # Flood simulation layer
│   │   │   ├── CycloneEffect.jsx    # Three.js cyclone
│   │   │   ├── ResourceMarkers.jsx  # Resource pins
│   │   │   ├── ControlPanel.jsx     # Left sidebar controls
│   │   │   ├── InfoPanel.jsx        # Right sidebar stats
│   │   │   └── RouteLayer.jsx       # Rerouting paths
│   │   ├── hooks/
│   │   │   ├── useFloodSimulation.js
│   │   │   ├── useCycloneSimulation.js
│   │   │   └── useRerouting.js
│   │   ├── services/
│   │   │   └── api.js               # All axios API calls
│   │   ├── constants/
│   │   │   ├── regions.js           # City configs
│   │   │   └── colors.js            # Theme colors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # Python FastAPI (Zahid)
│   ├── main.py                  # FastAPI app + routes
│   ├── engines/
│   │   ├── flood_engine.py      # Flood logic
│   │   ├── cyclone_engine.py    # Cyclone logic
│   │   └── router.py            # Rerouting logic
│   ├── data/
│   │   ├── generate_data.py     # Synthetic data generator
│   │   ├── resources.json       # Generated resource data
│   │   ├── elevation_chennai.csv
│   │   ├── elevation_mumbai.csv
│   │   └── README.md            # Data documentation
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── requirements.txt
│   └── .env
│
├── docs/                        # All documentation
│   ├── PRD.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TECHSTACK.md
│   ├── SCHEMA.md
│   ├── ARCHITECTURE.md
│   └── RULES.md
│
└── README.md                    # Main project README
```

---

## Local Setup Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python data/generate_data.py   # Generate synthetic data
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # Runs on localhost:5173
```

### API available at
```
http://localhost:8000
http://localhost:8000/docs   # Auto-generated Swagger UI
```
