# 🌊 Disaster Relief Resource Mapper

> An interactive 3D disaster simulation platform — visualize floods and cyclones hitting a region, watch resources go offline in real-time, and get dynamic rerouting to available aid.

**Jain (Deemed-to-be) University | Python Programming — Sem 03 Mini Project**  
**Team:** Swapnil Ghosh · Syed Zahid Saleem  
**Mentor:** Dr. Jayashri Inchal

---

## ✨ Features

- 🗺️ **3D Interactive Map** — OpenStreetMap tiles with deck.gl GPU rendering
- 🌊 **Flood Simulation** — Animated water rise over real terrain elevation data
- 🌀 **Cyclone Simulation** — Three.js spiral particle system with wind radius
- 📍 **Resource Tracking** — 65 shelters, food banks, and medical camps
- 🔄 **Dynamic Rerouting** — Auto-finds nearest available resource when one goes offline
- 🎛️ **Full Parameter Control** — Severity, water level, speed, region, layers
- 📊 **Live Stats** — Real-time count of offline resources and active reroutes

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, deck.gl, Three.js, MapLibre |
| Backend | Python 3.11, FastAPI, Pandas, GeoPandas |
| Data | Synthetic JSON, SRTM Elevation CSV, OSM Tiles |

---

## 🚀 Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python data/generate_data.py
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

API docs at `http://localhost:8000/docs`

---

## 📁 Docs

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements |
| [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) | Day-by-day build plan |
| [Tech Stack](docs/TECHSTACK.md) | Full tech breakdown |
| [Schema](docs/SCHEMA.md) | Data schemas + API contracts |
| [Architecture](docs/ARCHITECTURE.md) | System design + data flow |
| [Rules](docs/RULES.md) | Contribution guidelines |

---

## 👥 Team

| Member | Role |
|--------|------|
| Swapnil Ghosh | Frontend, 3D simulation, UI/UX |
| Syed Zahid Saleem | Backend, data pipeline, rerouting logic |
