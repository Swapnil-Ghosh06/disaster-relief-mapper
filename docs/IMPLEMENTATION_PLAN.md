# 🗺️ Disaster Relief Resource Mapper — Implementation Plan

> **Team:** Swapnil Ghosh (Frontend/3D) + Syed Zahid Saleem (Backend/Data)  
> **Deadline:** 30 September 2026  
> **Days Available:** ~11 days  
> **Stack:** React + deck.gl + Three.js (Frontend) | Python FastAPI + GeoPandas (Backend)

---

## 🎯 Project Vision

A real-time, interactive 3D disaster simulation platform. Users pick a region, trigger a flood or cyclone, watch it animate across a 3D terrain map, see resources (shelters, food banks, medical camps) go offline dynamically, and get rerouted to the nearest available aid — all controlled via an intuitive parameter panel.

---

## 📦 Phases Overview

| Phase | Name | Days | Owner |
|-------|------|------|-------|
| 0 | Setup & Scaffolding | Day 1 | Both |
| 1 | Base Map + Data Layer | Days 2–3 | Both |
| 2 | Flood Simulation | Days 4–5 | Swapnil + Zahid |
| 3 | Cyclone Simulation | Days 6–7 | Swapnil + Zahid |
| 4 | Rerouting Engine | Day 8 | Zahid |
| 5 | UI Polish + Controls | Days 9–10 | Swapnil |
| 6 | Integration + Testing | Day 11 | Both |

---

## 👤 SWAPNIL — Frontend & 3D Implementation Plan

### Phase 0 — Day 1: Project Setup
- [ ] Create GitHub repo `disaster-relief-mapper`
- [ ] Initialize React app with Vite: `npm create vite@latest frontend -- --template react`
- [ ] Install dependencies:
  ```bash
  npm install @deck.gl/react @deck.gl/layers @deck.gl/geo-layers
  npm install three @react-three/fiber @react-three/drei
  npm install maplibre-gl react-map-gl
  npm install axios framer-motion
  npm install @radix-ui/react-slider @radix-ui/react-toggle
  ```
- [ ] Set up folder structure (see architecture doc)
- [ ] Configure `.env` with Mapbox/MapLibre token
- [ ] Create base `App.jsx` with layout skeleton

### Phase 1 — Days 2–3: Base Map Rendering
- [ ] Set up `MapView.jsx` using `react-map-gl` + OpenStreetMap tiles
- [ ] Configure deck.gl `DeckGL` overlay on top of base map
- [ ] Load `resources.json` from backend API (GET /resources)
- [ ] Render resource markers using `ScatterplotLayer`:
  - 🟢 Shelters — green
  - 🔵 Food Banks — blue  
  - 🔴 Medical Camps — red
- [ ] Enable 3D tilt view (pitch: 45°, bearing: 0°)
- [ ] Add zoom/pan controls
- [ ] Test: markers appear correctly on map

### Phase 2 — Days 4–5: Flood Simulation Layer
- [ ] Create `FloodLayer.jsx` component
- [ ] Fetch elevation grid from backend (GET /elevation?region=chennai)
- [ ] Build custom deck.gl `GridCellLayer` that colors cells based on:
  ```
  cell_color = SUBMERGED (blue) if elevation < water_level else TERRAIN
  ```
- [ ] Wire water level slider → updates `waterLevel` state → re-renders layer
- [ ] Animate flood rising: use `useEffect` + `requestAnimationFrame` to increment water level over time when "Simulate" is clicked
- [ ] Resources below water level → send list to backend → get offline status back
- [ ] Submerged resources change icon to greyed-out/red X
- [ ] Test: slider at 0m shows dry map, slider at 8m shows most of low-lying area submerged

### Phase 3 — Days 6–7: Cyclone Simulation
- [ ] Create `CycloneEffect.jsx` component
- [ ] Cyclone eye = user clicks on map → captures lat/lng
- [ ] Render cyclone using Three.js:
  - Spiral particle system (500–1000 particles rotating around eye)
  - Wind radius = circle overlay (deck.gl `ScatterplotLayer` with opacity)
  - Eye = calm center point
- [ ] Animate rotation: `useFrame` hook spins particles around eye
- [ ] Resources within wind radius → mark as damaged
- [ ] Cyclone path: if user defines start + end point, animate eye moving along path
- [ ] Severity slider → controls wind radius size
- [ ] Test: place cyclone over Chennai coast, watch resources near coast go offline

### Phase 4 — Day 8 (Integration with Zahid's rerouting)
- [ ] Connect to POST /reroute endpoint
- [ ] When resource goes offline → automatically call reroute
- [ ] Render reroute path using deck.gl `PathLayer`
- [ ] Show popup: "Shelter X offline → Nearest available: Shelter Y (2.3 km)"
- [ ] Test: take down 3 shelters, confirm rerouting updates correctly

### Phase 5 — Days 9–10: UI Polish & Control Panel
- [ ] Build `ControlPanel.jsx` — fixed left sidebar:
  - Region dropdown (Chennai, Mumbai, Bhubaneswar, Kolkata)
  - Disaster toggle (Flood / Cyclone)
  - Severity slider (1–10)
  - Water level slider (flood mode, 0–15m)
  - Simulation speed control
  - Layer toggles (shelters / hospitals / food banks / roads)
  - Reset button
  - "Simulate" button with loading state
- [ ] Build `InfoPanel.jsx` — right sidebar:
  - Live stats: total resources, offline count, people affected (estimated)
  - Active reroutes list
  - Legend
- [ ] Add animations: Framer Motion for panel transitions
- [ ] Dark theme — emergency operations aesthetic (deep navy, red accents, white text)
- [ ] Custom map style (dark basemap)
- [ ] Responsive layout
- [ ] Loading states and error handling

### Phase 6 — Day 11: Final Polish
- [ ] Add splash screen / intro animation
- [ ] Error boundaries
- [ ] Performance check (60fps on simulation)
- [ ] Cross-browser test
- [ ] Record demo GIF for README

---

## 👤 ZAHID — Backend & Data Implementation Plan

### Phase 0 — Day 1: Backend Setup
- [ ] Initialize Python project:
  ```bash
  python -m venv venv
  pip install fastapi uvicorn pandas geopandas numpy scipy requests
  ```
- [ ] Create `backend/main.py` with FastAPI app skeleton
- [ ] Enable CORS for frontend (localhost:5173)
- [ ] Test: `uvicorn main:app --reload` runs without errors

### Phase 1 — Days 2–3: Data Generation & Elevation
- [ ] Create `generate_data.py` — synthetic resource generator:
  - 30 shelters (name, lat, lng, capacity, status)
  - 20 food banks (name, lat, lng, daily_meals, status)
  - 15 medical camps (name, lat, lng, beds, speciality, status)
  - Output: `data/resources.json`
- [ ] Coordinates must be realistic for chosen region (Chennai default)
- [ ] Fetch SRTM elevation data:
  - Use OpenTopography API or pre-downloaded SRTM tile
  - Process into grid: `{lat, lng, elevation_m}`
  - Save as `data/elevation.csv`
- [ ] Build API endpoints:
  ```
  GET /resources → returns resources.json
  GET /elevation?region=chennai → returns elevation grid
  GET /regions → returns list of available regions
  ```

### Phase 2 — Days 4–5: Flood Logic
- [ ] Create `flood_engine.py`:
  ```python
  def get_submerged_resources(water_level: float, resources: list, elevation_data: dict):
      # Returns list of resource IDs where elevation < water_level
  ```
- [ ] Add endpoint:
  ```
  POST /flood/simulate
  Body: { region, water_level, resource_ids }
  Returns: { offline: [...], online: [...] }
  ```
- [ ] Test with water_level = 3.0 → correct resources go offline

### Phase 3 — Days 6–7: Cyclone Logic
- [ ] Create `cyclone_engine.py`:
  ```python
  def get_affected_resources(eye_lat, eye_lng, radius_km, resources):
      # Haversine distance formula
      # Returns resources within radius
  ```
- [ ] Add endpoint:
  ```
  POST /cyclone/simulate
  Body: { eye_lat, eye_lng, radius_km, severity }
  Returns: { damaged: [...], safe: [...] }
  ```

### Phase 4 — Day 8: Rerouting Engine
- [ ] Create `router.py`:
  - Input: offline resource IDs, all resources
  - Logic: for each offline resource, find nearest online resource of same type
  - Algorithm: Haversine distance, sort by proximity
  - Output: `{ from_id, to_id, distance_km, resource_type }`
- [ ] Add endpoint:
  ```
  POST /reroute
  Body: { offline_ids, all_resources }
  Returns: { routes: [...] }
  ```

### Phase 5 — Days 9–10: Data Quality + Docs
- [ ] Add input validation (Pydantic models)
- [ ] Add error handling + proper HTTP status codes
- [ ] Write API documentation (auto-generated via FastAPI /docs)
- [ ] Write `README.md` (full setup instructions)
- [ ] Write `data/README.md` (data sources, schema explanation)
- [ ] Test all endpoints with Postman/curl

### Phase 6 — Day 11: Integration Testing
- [ ] Full end-to-end test with frontend
- [ ] Fix any CORS or data format issues
- [ ] Performance check: API response < 200ms
- [ ] Deploy locally, confirm everything works together

---

## 🔗 Integration Points (Both)

| Frontend calls | Backend provides |
|----------------|-----------------|
| GET /resources | All resource markers |
| GET /elevation | Elevation grid for region |
| POST /flood/simulate | Which resources go offline |
| POST /cyclone/simulate | Which resources get damaged |
| POST /reroute | Nearest available alternatives |
| GET /regions | Available city options |

---

## ✅ Definition of Done

- [ ] 3D map loads with all resource markers
- [ ] Flood simulation animates with water level slider
- [ ] Cyclone simulation shows spiral + wind radius
- [ ] Resources go offline dynamically during simulation
- [ ] Rerouting suggests alternatives automatically
- [ ] Control panel has all parameters working
- [ ] Dark theme, polished UI
- [ ] README complete
- [ ] GitHub repo clean with proper commits
- [ ] Submitted before 30-09-2026
