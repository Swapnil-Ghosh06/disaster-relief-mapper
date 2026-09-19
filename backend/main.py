"""
Disaster Relief Resource Mapper — Backend API
=============================================
FastAPI service exposing spatial disaster simulation engines, topographical
elevation queries, relief facility registries, and automated emergency rerouting.
"""

import os
import json
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    Resource,
    ResourcesResponse,
    RegionConfig,
    RegionsResponse,
    ElevationResponse,
    ElevationPoint,
    BoundingBox,
    FloodSimulateRequest,
    FloodSimulateResponse,
    CycloneSimulateRequest,
    CycloneSimulateResponse,
    RerouteRequest,
    RerouteResponse,
    Route,
)
from engines.flood_engine import load_elevation, simulate_flood
from engines.cyclone_engine import simulate_cyclone
from engines.router import generate_all_routes

# Base directory paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
RESOURCES_FILE = os.path.join(DATA_DIR, "resources.json")

VALID_REGIONS: Dict[str, Dict[str, Any]] = {
    "chennai": {
        "id": "chennai",
        "name": "Chennai, Tamil Nadu",
        "center_lat": 13.0827,
        "center_lng": 80.2707,
        "zoom": 11.8,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Coastal city, high flood + cyclone risk",
        "bbox": {"min_lat": 12.9200, "max_lat": 13.1800, "min_lng": 80.1200, "max_lng": 80.2900}
    },
    "mumbai": {
        "id": "mumbai",
        "name": "Mumbai, Maharashtra",
        "center_lat": 19.0760,
        "center_lng": 72.8777,
        "zoom": 11.8,
        "disaster_risk": ["flood"],
        "description": "Financial capital, severe monsoon flooding",
        "bbox": {"min_lat": 18.9000, "max_lat": 19.2500, "min_lng": 72.7800, "max_lng": 72.9800}
    },
    "bhubaneswar": {
        "id": "bhubaneswar",
        "name": "Bhubaneswar, Odisha",
        "center_lat": 20.2961,
        "center_lng": 85.8245,
        "zoom": 11.8,
        "disaster_risk": ["cyclone", "flood"],
        "description": "Cyclone-prone coastal state capital",
        "bbox": {"min_lat": 20.2000, "max_lat": 20.4000, "min_lng": 85.7400, "max_lng": 85.9200}
    },
    "kolkata": {
        "id": "kolkata",
        "name": "Kolkata, West Bengal",
        "center_lat": 22.5726,
        "center_lng": 88.3639,
        "zoom": 11.8,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Delta city, extreme flood vulnerability",
        "bbox": {"min_lat": 22.4500, "max_lat": 22.7000, "min_lng": 88.2800, "max_lng": 88.4600}
    },
    "wellington": {
        "id": "wellington",
        "name": "Wellington (Digital Twin Inspo)",
        "center_lat": -41.2865,
        "center_lng": 174.7762,
        "zoom": 12.6,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Coastal harbor smart city with 3D mountain terrain",
        "bbox": {"min_lat": -41.3400, "max_lat": -41.2400, "min_lng": 174.7200, "max_lng": 174.8400}
    },
}


def ensure_data_files():
    """Ensure resources.json and elevation grids exist; generate if missing."""
    if not os.path.exists(RESOURCES_FILE):
        print("[INIT] resources.json not found. Running data generator...")
        from data.generate_data import main as run_generator
        run_generator()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for initialization and warm-up caching."""
    ensure_data_files()
    # Pre-cache elevation grids for instant query responses (<5ms)
    for region_key in VALID_REGIONS:
        load_elevation(region_key, data_dir=DATA_DIR)
    yield


app = FastAPI(
    title="Disaster Relief Resource Mapper API",
    description="High-performance backend for simulation of flood & cyclone disasters, spatial DEM queries, and dynamic facility rerouting.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite dev server and external frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_all_resources() -> List[Dict[str, Any]]:
    """Helper to safely load resources from JSON storage."""
    ensure_data_files()
    try:
        with open(RESOURCES_FILE, mode="r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read relief resource dataset: {str(exc)}"
        )


@app.get("/", tags=["Health"])
async def root():
    """Service health verification endpoint."""
    return {
        "status": "online",
        "service": "Disaster Relief Resource Mapper API",
        "version": "1.0.0",
        "endpoints": ["/regions", "/resources", "/elevation", "/flood/simulate", "/cyclone/simulate", "/reroute"]
    }


@app.get("/regions", response_model=RegionsResponse, tags=["Metadata"])
async def get_regions():
    """
    Retrieve list and spatial bounding configurations of all supported disaster regions.
    """
    region_list = [
        RegionConfig(
            id=cfg["id"],
            name=cfg["name"],
            center_lat=cfg["center_lat"],
            center_lng=cfg["center_lng"],
            zoom=cfg["zoom"],
            disaster_risk=cfg["disaster_risk"],
            description=cfg.get("description"),
        )
        for cfg in VALID_REGIONS.values()
    ]
    return RegionsResponse(regions=region_list)


@app.get("/resources", response_model=ResourcesResponse, tags=["Resources"])
async def get_resources(
    region: str = Query(default="chennai", description="Region key (e.g., 'chennai', 'mumbai', 'kolkata')")
):
    """
    Retrieve all operational disaster relief facilities (shelters, food banks, medical camps)
    for a designated geographic region.
    """
    normalized_region = region.lower().strip()
    if normalized_region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region '{region}'. Supported regions: {list(VALID_REGIONS.keys())}"
        )
        
    all_res = _load_all_resources()
    filtered = [r for r in all_res if r.get("region", "").lower() == normalized_region]
    
    return ResourcesResponse(
        region=normalized_region,
        total=len(filtered),
        resources=filtered
    )


@app.get("/elevation", response_model=ElevationResponse, tags=["Topography"])
async def get_elevation(
    region: str = Query(default="chennai", description="Region key (e.g., 'chennai', 'mumbai')")
):
    """
    Retrieve dense digital elevation model (DEM) grid cells and bounding box for a region.
    """
    normalized_region = region.lower().strip()
    if normalized_region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region '{region}'. Supported regions: {list(VALID_REGIONS.keys())}"
        )
        
    lookup = load_elevation(normalized_region, data_dir=DATA_DIR)
    
    grid = [
        ElevationPoint(lat=lat, lng=lng, elevation_m=elev)
        for (lat, lng), elev in lookup.items()
    ]
    
    bbox_info = None
    if normalized_region in VALID_REGIONS and "bbox" in VALID_REGIONS[normalized_region]:
        b = VALID_REGIONS[normalized_region]["bbox"]
        bbox_info = BoundingBox(
            min_lat=b["min_lat"],
            max_lat=b["max_lat"],
            min_lng=b["min_lng"],
            max_lng=b["max_lng"]
        )
        
    return ElevationResponse(
        region=normalized_region,
        bbox=bbox_info,
        grid=grid
    )


@app.post("/flood/simulate", response_model=FloodSimulateResponse, tags=["Disaster Simulation"])
async def flood_simulate(request: FloodSimulateRequest):
    """
    Simulate flood water level inundation and identify compromised / operational relief assets.
    """
    normalized_region = request.region.lower().strip()
    if normalized_region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region '{request.region}'. Supported regions: {list(VALID_REGIONS.keys())}"
        )
        
    if request.water_level_m < 0.0 or request.water_level_m > 20.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Water level must be between 0.0 and 20.0 meters."
        )
        
    all_res = _load_all_resources()
    regional_resources = [r for r in all_res if r.get("region", "").lower() == normalized_region]
    
    # Apply optional resource_ids filter if provided and non-empty
    if request.resource_ids:
        id_set = set(request.resource_ids)
        regional_resources = [r for r in regional_resources if r.get("id") in id_set]
        
    elevation_lookup = load_elevation(normalized_region, data_dir=DATA_DIR)
    result = simulate_flood(request.water_level_m, regional_resources, elevation_lookup)
    
    return FloodSimulateResponse(**result)


@app.post("/cyclone/simulate", response_model=CycloneSimulateResponse, tags=["Disaster Simulation"])
async def cyclone_simulate(request: CycloneSimulateRequest):
    """
    Simulate cyclone landfall and compute high-wind damage swath using Haversine geodesic equations.
    """
    normalized_region = request.region.lower().strip()
    if normalized_region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region '{request.region}'. Supported regions: {list(VALID_REGIONS.keys())}"
        )
        
    if request.severity < 1 or request.severity > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cyclone severity index must be an integer between 1 and 10."
        )
        
    if request.radius_km <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cyclone radius_km must be a positive number."
        )
        
    all_res = _load_all_resources()
    regional_resources = [r for r in all_res if r.get("region", "").lower() == normalized_region]
    
    result = simulate_cyclone(
        eye_lat=request.eye_lat,
        eye_lng=request.eye_lng,
        radius_km=request.radius_km,
        severity=request.severity,
        resources=regional_resources
    )
    
    return CycloneSimulateResponse(**result)


@app.post("/reroute", response_model=RerouteResponse, tags=["Emergency Rerouting"])
async def reroute(request: RerouteRequest):
    """
    Compute optimal shortest-distance backup paths to functional facilities of identical category
    for all incapacitated relief resources.
    """
    normalized_region = request.region.lower().strip()
    if normalized_region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region '{request.region}'. Supported regions: {list(VALID_REGIONS.keys())}"
        )
        
    if not request.offline_ids:
        return RerouteResponse(routes=[])
        
    all_res = _load_all_resources()
    regional_resources = [r for r in all_res if r.get("region", "").lower() == normalized_region]
    
    routes_data = generate_all_routes(request.offline_ids, regional_resources)
    routes = [Route(**item) for item in routes_data]
    
    return RerouteResponse(routes=routes)
