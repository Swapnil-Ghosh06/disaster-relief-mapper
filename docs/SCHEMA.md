# 🗄️ Data Schema
## Disaster Relief Resource Mapper

---

## 1. Resource Data — `resources.json`

### Shelter Object
```json
{
  "id": "SH001",
  "type": "shelter",
  "name": "Anna Nagar Relief Shelter",
  "lat": 13.0850,
  "lng": 80.2101,
  "elevation_m": 4.2,
  "capacity": 250,
  "current_occupancy": 0,
  "status": "online",
  "contact": "+91-44-23456789",
  "address": "Anna Nagar, Chennai - 600040",
  "region": "chennai"
}
```

### Food Bank Object
```json
{
  "id": "FB001",
  "type": "food_bank",
  "name": "T Nagar Community Kitchen",
  "lat": 13.0418,
  "lng": 80.2341,
  "elevation_m": 6.1,
  "daily_meals": 500,
  "status": "online",
  "contact": "+91-44-23456790",
  "address": "T Nagar, Chennai - 600017",
  "region": "chennai"
}
```

### Medical Camp Object
```json
{
  "id": "MC001",
  "type": "medical_camp",
  "name": "Adyar Flood Medical Post",
  "lat": 13.0012,
  "lng": 80.2565,
  "elevation_m": 2.8,
  "beds": 50,
  "speciality": "general",
  "status": "online",
  "contact": "+91-44-23456791",
  "address": "Adyar, Chennai - 600020",
  "region": "chennai"
}
```

### Status Values
```
"online"   → operational, available
"offline"  → submerged / destroyed / unreachable
"damaged"  → partially operational (cyclone damage)
```

---

## 2. Elevation Grid — `elevation_chennai.csv`

```csv
lat,lng,elevation_m
13.0000,80.1500,1.2
13.0000,80.1530,2.4
13.0000,80.1560,3.1
13.0030,80.1500,0.8
...
```

Grid resolution: ~0.003° per cell (~300m spacing)  
Coverage: Bounding box of each city region

---

## 3. API Request / Response Schemas

### GET /resources
```json
// Response
{
  "region": "chennai",
  "total": 65,
  "resources": [
    { /* Shelter/FoodBank/MedicalCamp object */ },
    ...
  ]
}
```

### GET /elevation
```json
// Query params: ?region=chennai
// Response
{
  "region": "chennai",
  "bbox": {
    "min_lat": 12.9500,
    "max_lat": 13.2000,
    "min_lng": 80.1500,
    "max_lng": 80.3200
  },
  "grid": [
    { "lat": 13.0000, "lng": 80.1500, "elevation_m": 1.2 },
    ...
  ]
}
```

### POST /flood/simulate
```json
// Request
{
  "region": "chennai",
  "water_level_m": 5.0,
  "resource_ids": ["SH001", "SH002", "FB001", "MC001"]
}

// Response
{
  "water_level_m": 5.0,
  "offline": ["SH001", "MC001"],
  "online": ["SH002", "FB001"],
  "affected_capacity": 300
}
```

### POST /cyclone/simulate
```json
// Request
{
  "region": "chennai",
  "eye_lat": 13.0827,
  "eye_lng": 80.2707,
  "radius_km": 15.0,
  "severity": 7
}

// Response
{
  "eye": { "lat": 13.0827, "lng": 80.2707 },
  "radius_km": 15.0,
  "damaged": ["SH003", "FB002", "MC002"],
  "safe": ["SH001", "SH002", "FB001"],
  "affected_capacity": 150
}
```

### POST /reroute
```json
// Request
{
  "offline_ids": ["SH001", "MC001"],
  "region": "chennai"
}

// Response
{
  "routes": [
    {
      "from_id": "SH001",
      "from_name": "Anna Nagar Relief Shelter",
      "from_lat": 13.0850,
      "from_lng": 80.2101,
      "to_id": "SH004",
      "to_name": "Kilpauk Relief Center",
      "to_lat": 13.0900,
      "to_lng": 80.2300,
      "distance_km": 2.3,
      "resource_type": "shelter"
    },
    ...
  ]
}
```

### GET /regions
```json
// Response
{
  "regions": [
    {
      "id": "chennai",
      "name": "Chennai, Tamil Nadu",
      "center_lat": 13.0827,
      "center_lng": 80.2707,
      "zoom": 11,
      "disaster_risk": ["flood", "cyclone"]
    },
    {
      "id": "mumbai",
      "name": "Mumbai, Maharashtra",
      "center_lat": 19.0760,
      "center_lng": 72.8777,
      "zoom": 11,
      "disaster_risk": ["flood"]
    },
    {
      "id": "bhubaneswar",
      "name": "Bhubaneswar, Odisha",
      "center_lat": 20.2961,
      "center_lng": 85.8245,
      "zoom": 11,
      "disaster_risk": ["cyclone", "flood"]
    },
    {
      "id": "kolkata",
      "name": "Kolkata, West Bengal",
      "center_lat": 22.5726,
      "center_lng": 88.3639,
      "zoom": 11,
      "disaster_risk": ["flood", "cyclone"]
    }
  ]
}
```

---

## 4. Pydantic Models (Backend)

```python
# models/schemas.py

from pydantic import BaseModel
from typing import List, Literal, Optional

class FloodSimulateRequest(BaseModel):
    region: str
    water_level_m: float
    resource_ids: List[str]

class CycloneSimulateRequest(BaseModel):
    region: str
    eye_lat: float
    eye_lng: float
    radius_km: float
    severity: int  # 1-10

class RerouteRequest(BaseModel):
    offline_ids: List[str]
    region: str

class ResourceStatus(BaseModel):
    id: str
    status: Literal["online", "offline", "damaged"]

class Route(BaseModel):
    from_id: str
    from_name: str
    from_lat: float
    from_lng: float
    to_id: str
    to_name: str
    to_lat: float
    to_lng: float
    distance_km: float
    resource_type: str
```

---

## 5. Frontend State Shape

```javascript
// App-level state (React useState / useReducer)
{
  region: "chennai",
  disasterType: "flood" | "cyclone",
  severity: 5,
  waterLevel: 0,
  simulationRunning: false,
  simulationSpeed: 1,
  
  resources: [...],           // All resources from API
  offlineIds: [],             // Currently offline resource IDs
  routes: [],                 // Active rerouting paths
  
  cycloneEye: null,           // { lat, lng } or null
  
  layers: {
    shelters: true,
    foodBanks: true,
    medicalCamps: true,
    roads: false,
    elevationGrid: true
  },
  
  stats: {
    total: 65,
    offline: 0,
    affectedCapacity: 0,
    activeReroutes: 0
  }
}
```
