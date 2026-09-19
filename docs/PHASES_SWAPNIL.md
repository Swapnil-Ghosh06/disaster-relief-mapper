# ⚡ SWAPNIL — Personal Phase Plan
## Disaster Relief Resource Mapper | Frontend + 3D Simulation

> **Role:** Frontend Engineer + 3D Simulation Lead  
> **Stack:** React, deck.gl, Three.js, MapLibre, Framer Motion  
> **Deadline:** 30 September 2026  
> **Days:** 11

---

## 🗓️ Phase Overview

| Phase | What | Days | Status |
|-------|------|------|--------|
| 0 | Repo + Project Setup | Day 1 | ⬜ |
| 1 | Base Map + Resource Markers | Days 2–3 | ⬜ |
| 2 | Flood Simulation Layer | Days 4–5 | ⬜ |
| 3 | Cyclone Simulation (Three.js) | Days 6–7 | ⬜ |
| 4 | Rerouting Visualization | Day 8 | ⬜ |
| 5 | UI Polish + Control Panel | Days 9–10 | ⬜ |
| 6 | Final Testing + Handoff | Day 11 | ⬜ |

---

## 📅 Phase 0 — Day 1
### Repo + Project Scaffolding

**Goal:** Working React app with folder structure ready. Nothing visual yet — just setup done right so you never fight tooling again.

**Tasks:**
- [ ] Create GitHub repo `disaster-relief-mapper`
- [ ] Initialize Vite React app inside `/frontend`:
  ```bash
  npm create vite@latest frontend -- --template react
  cd frontend
  ```
- [ ] Install all dependencies in one shot:
  ```bash
  npm install @deck.gl/react @deck.gl/layers @deck.gl/geo-layers
  npm install three @react-three/fiber @react-three/drei
  npm install maplibre-gl react-map-gl
  npm install axios framer-motion
  npm install @radix-ui/react-slider
  ```
- [ ] Create folder structure:
  ```
  src/
  ├── components/
  │   ├── MapView.jsx
  │   ├── FloodLayer.jsx
  │   ├── CycloneEffect.jsx
  │   ├── ResourceMarkers.jsx
  │   ├── ControlPanel.jsx
  │   ├── InfoPanel.jsx
  │   └── RouteLayer.jsx
  ├── hooks/
  │   ├── useFloodSimulation.js
  │   ├── useCycloneSimulation.js
  │   └── useRerouting.js
  ├── services/
  │   └── api.js
  ├── constants/
  │   ├── regions.js
  │   └── colors.js
  ├── App.jsx
  └── main.jsx
  ```
- [ ] Create empty files with placeholder comments in each
- [ ] Set up `.env`:
  ```
  VITE_API_URL=http://localhost:8000
  ```
- [ ] Push initial commit: `feat: initial project scaffold`
- [ ] Add Zahid as collaborator on GitHub
- [ ] Confirm Zahid's backend is also set up (coordinate)

**Done when:** `npm run dev` runs, blank white page appears, no errors in console.

---

## 📅 Phase 1 — Days 2–3
### Base Map + Resource Markers

**Goal:** 3D map loads, all 65 resources appear as color-coded pins on the correct city.

### Day 2 — Map Setup

- [ ] In `MapView.jsx`, set up MapLibre dark basemap:
  ```jsx
  import Map from 'react-map-gl/maplibre';
  
  <Map
    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    initialViewState={{
      latitude: 13.0827,
      longitude: 80.2707,
      zoom: 11,
      pitch: 45,
      bearing: 0
    }}
  />
  ```
- [ ] Wrap with `DeckGL` overlay
- [ ] Confirm map renders in dark style with 3D tilt
- [ ] Add zoom/pan/rotate mouse controls
- [ ] Set up `services/api.js` with base URL from `.env`

### Day 3 — Resource Markers

- [ ] Fetch resources from `GET /resources` (use Zahid's mock JSON locally if backend not ready yet)
- [ ] Create `ResourceMarkers.jsx` using `ScatterplotLayer`:
  ```javascript
  // Color mapping
  shelter    → [34, 197, 94]   // green
  food_bank  → [59, 130, 246]  // blue
  medical    → [239, 68, 68]   // red
  ```
- [ ] Set radius: 80 pixels, filled circles
- [ ] onClick marker → show popup with name, capacity, status
- [ ] Add legend component (small, bottom-right corner)
- [ ] Wire `regions.js` constants so region switch updates map center + zoom
- [ ] Pull region list from `GET /regions`

**Done when:** Dark 3D map loads, all green/blue/red markers visible, click any marker → popup shows.

---

## 📅 Phase 2 — Days 4–5
### Flood Simulation Layer

**Goal:** Water level slider raises animated flood over terrain. Resources drown dynamically.

### Day 4 — Elevation Grid + Water Layer

- [ ] Fetch elevation grid from `GET /elevation?region=chennai`
- [ ] Parse grid into array of `{ lat, lng, elevation_m }` cells
- [ ] Build `FloodLayer.jsx` using deck.gl `GridCellLayer`:
  ```javascript
  // Cell color logic
  const getColor = (cell) => {
    if (cell.elevation_m < waterLevel) {
      return [30, 100, 255, 180]   // blue, semi-transparent = submerged
    }
    return [60, 60, 60, 0]         // transparent = dry
  }
  ```
- [ ] Wire `waterLevel` state from ControlPanel → FloodLayer
- [ ] Confirm: slider at 0 = no blue cells, slider at 8 = coastal areas blue

### Day 5 — Animate + Resource Offline Logic

- [ ] Build `useFloodSimulation.js` hook:
  ```javascript
  // When "Simulate" clicked, auto-increment water level over time
  const startFlood = () => {
    const interval = setInterval(() => {
      setWaterLevel(prev => {
        if (prev >= maxLevel) { clearInterval(interval); return prev; }
        return prev + 0.1;
      });
    }, 100 / speed);
  }
  ```
- [ ] On water level change → call `POST /flood/simulate` → get offline IDs
- [ ] Pass offline IDs to `ResourceMarkers` → those markers render as grey + ❌
- [ ] Trigger rerouting automatically after offline IDs update
- [ ] Add "Reset" button → water level back to 0, all markers back online

**Done when:** Hit Simulate → water rises, markers go grey as they drown, rerouting triggers.

---

## 📅 Phase 3 — Days 6–7
### Cyclone Simulation (Three.js)

**Goal:** User clicks map to place cyclone eye → animated 3D spiral appears → nearby resources go offline.

### Day 6 — Cyclone Eye Placement + Wind Radius

- [ ] Add click handler on map → capture `{ lat, lng }` → set as `cycloneEye` state
- [ ] Render wind radius circle using deck.gl `ScatterplotLayer` (large radius, low opacity):
  ```javascript
  // Semi-transparent red circle = wind radius
  new ScatterplotLayer({
    data: [cycloneEye],
    getRadius: radiusInMeters,
    getFillColor: [239, 68, 68, 40],
    getLineColor: [239, 68, 68, 200],
    stroked: true,
    lineWidthMinPixels: 2
  })
  ```
- [ ] Wire severity slider → `radiusKm` → `radiusInMeters`
- [ ] Call `POST /cyclone/simulate` when eye is placed or radius changes
- [ ] Damaged resources → same grey/X treatment as flood

### Day 7 — Three.js Spiral Particle System

- [ ] Create `CycloneEffect.jsx` as an absolutely positioned canvas overlay
- [ ] Use `@react-three/fiber` Canvas at the cyclone eye screen position
- [ ] Particle system:
  ```javascript
  // ~800 particles in a spiral
  // Each particle:
  //   - Orbits around eye point
  //   - Distance from center: random 0.5 → 3 units
  //   - Rotation speed: faster near center (angular velocity ∝ 1/r)
  //   - Color: white → grey → blue-grey gradient by distance
  //   - Size: small (0.02–0.05)
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    positions.forEach((p, i) => {
      const angle = p.startAngle + t * p.angularSpeed;
      p.x = Math.cos(angle) * p.radius;
      p.z = Math.sin(angle) * p.radius;
      p.y = p.height;    // slight vertical spread
    });
  });
  ```
- [ ] Eye of cyclone = calm center, no particles in innermost 0.3 units
- [ ] Add "Move cyclone" mode — user can drag eye across map, particles follow
- [ ] Test: visually looks like a rotating storm system

**Done when:** Click map → spiral appears + spins + wind radius circle visible + resources within radius go offline.

---

## 📅 Phase 4 — Day 8
### Rerouting Visualization

**Goal:** When resources go offline, routes to alternatives appear on map as animated paths.

- [ ] Build `RouteLayer.jsx` using deck.gl `ArcLayer`:
  ```javascript
  // Arc from offline resource → nearest available alternative
  new ArcLayer({
    data: routes,
    getSourcePosition: r => [r.from_lng, r.from_lat],
    getTargetPosition: r => [r.to_lng, r.to_lat],
    getSourceColor: [239, 68, 68],    // red = offline source
    getTargetColor: [34, 197, 94],    // green = available destination
    getWidth: 3,
    greatCircle: true
  })
  ```
- [ ] Build `useRerouting.js` hook:
  - Calls `POST /reroute` with current offline IDs
  - Returns routes array
  - Auto-calls whenever offlineIds changes
- [ ] Show route tooltip on hover: "Rerouted from X → Y (2.3 km)"
- [ ] Wire to `InfoPanel` — list all active reroutes in sidebar
- [ ] Test: take down 5 shelters → 5 arcs appear → each pointing to nearest alternative

**Done when:** Offline resources have glowing arcs pointing to their alternatives on the map.

---

## 📅 Phase 5 — Days 9–10
### UI Polish + Full Control Panel

**Goal:** The app looks like an actual emergency operations dashboard, not a student project.

### Day 9 — Control Panel

Build `ControlPanel.jsx` — fixed left sidebar (320px wide):

- [ ] **Region selector** — dropdown, updates map center + fetches new data
- [ ] **Disaster type toggle** — Flood / Cyclone pill toggle
  - Flood mode shows: water level slider
  - Cyclone mode shows: "click map to place eye" instruction
- [ ] **Severity slider** — 1–10, controls intensity
- [ ] **Water level slider** — 0–15m (flood mode only)
- [ ] **Simulation speed** — Slow / Normal / Fast
- [ ] **Layer toggles** — checkboxes for Shelters / Food Banks / Medical Camps / Elevation Grid
- [ ] **Simulate button** — triggers animation, shows loading spinner while API call runs
- [ ] **Reset button** — clears everything back to default

### Day 10 — Info Panel + Visual Polish

Build `InfoPanel.jsx` — fixed right sidebar (280px wide):

- [ ] Live stats card:
  - Total resources: N
  - Currently offline: N (red number)
  - Estimated affected: N people
  - Active reroutes: N
- [ ] Active reroutes list — scrollable, each item shows from → to + distance
- [ ] Legend — shelter/food bank/medical color coding
- [ ] Disaster severity label (e.g., "Category 3 Cyclone")

**Visual design — emergency ops aesthetic:**
- [ ] Background: `#0a0f1e` (deep navy)
- [ ] Accent: `#ef4444` (alert red) + `#3b82f6` (data blue)
- [ ] Text: `#f1f5f9` (near white)
- [ ] Sidebar glass effect: `backdrop-filter: blur(12px)` + subtle border
- [ ] Font: `Space Mono` or `JetBrains Mono` for data, `Inter` for labels
- [ ] Framer Motion: sidebar slides in on load, stats counter animates up
- [ ] Pulse animation on offline markers
- [ ] Glow effect on cyclone eye point

**Done when:** Looks like NASA mission control. Panels are clean, dark, all controls work, animations smooth.

---

## 📅 Phase 6 — Day 11
### Final Polish + Integration Testing

**Goal:** Everything works together end-to-end. Demo-ready.

- [ ] Full end-to-end run: launch backend → launch frontend → run full flood simulation
- [ ] Full end-to-end run: cyclone placement → spin animation → rerouting arcs
- [ ] Fix any integration bugs from Zahid's API
- [ ] Check 60fps on simulation (Chrome DevTools Performance tab)
- [ ] Remove all `console.log` statements
- [ ] Check for any React warnings in console
- [ ] Test region switching (Chennai → Mumbai → Bhubaneswar → Kolkata)
- [ ] Add loading screen / splash on first load
- [ ] Record a 30-second screen capture for the README demo GIF
- [ ] Final commit: `feat: complete disaster relief mapper v1.0`

---

## 🎨 Design Reference

```
Color Palette:
  Background:   #0a0f1e  (deep navy)
  Surface:      #111827  (dark card)
  Border:       #1f2937  (subtle)
  Text primary: #f1f5f9
  Text muted:   #64748b
  
  Shelter:      #22c55e  (green)
  Food Bank:    #3b82f6  (blue)
  Medical:      #ef4444  (red)
  Flood water:  #1e40af  (dark blue, 70% opacity)
  Cyclone:      #f97316  (orange-red)
  Route arc:    red → green gradient
  
  Alert red:    #ef4444
  Online green: #22c55e
  Warning amber: #f59e0b
```

---

## 📦 Dependencies Reference

```bash
# All frontend installs
npm install @deck.gl/react @deck.gl/layers @deck.gl/geo-layers
npm install three @react-three/fiber @react-three/drei
npm install maplibre-gl react-map-gl
npm install axios framer-motion
npm install @radix-ui/react-slider
```

---

## 🚨 Blockers to Watch

| Risk | What to do |
|------|-----------|
| Zahid's API not ready | Use local `resources.json` mock file — don't wait |
| Three.js cyclone too complex | Ship circle overlay first, add particles Day 7 only if Day 6 is done |
| deck.gl layer performance | Reduce elevation grid resolution if fps drops |
| Map tiles slow | Switch to a different CDN tile source |

---

## ✅ Swapnil's Daily Checklist Template

```
Day X — [Phase Name]

Morning:
  [ ] git pull origin dev
  [ ] Check if Zahid pushed any API changes
  [ ] Check today's tasks in this doc

During:
  [ ] Build
  [ ] Test in browser after every major component
  [ ] Commit every 2 hours: feat/fix: description

End of day:
  [ ] Push branch
  [ ] Open PR to dev
  [ ] Message Zahid: "Done with X, need Y from you by Z"
  [ ] Check tomorrow's tasks
```
