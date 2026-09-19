"""
Pydantic Schemas & Data Models
==============================
Defines the request and response models for all API endpoints in the
Disaster Relief Resource Mapper backend.
"""

from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field


class Resource(BaseModel):
    """
    Representation of a disaster relief resource entity.
    
    Attributes:
        id: Unique identifier (e.g., 'SH001', 'FB001', 'MC001').
        type: Resource category ('shelter', 'food_bank', or 'medical_camp').
        name: Human-readable facility name.
        lat: Latitude in decimal degrees (WGS84).
        lng: Longitude in decimal degrees (WGS84).
        elevation_m: Elevation above sea level in meters.
        capacity: Maximum occupancy for shelters.
        current_occupancy: Current number of sheltered people.
        daily_meals: Maximum meal preparation throughput per day for food banks.
        beds: Bed capacity for medical camps.
        speciality: Medical camp specialization ('general', 'emergency', 'trauma', 'pediatric').
        status: Operational state ('online', 'offline', or 'damaged').
        contact: Emergency phone number or dispatch contact.
        address: Street / locality address.
        region: Geographic region identifier (e.g., 'chennai', 'mumbai').
    """
    id: str = Field(..., description="Unique alphanumeric identifier")
    type: Literal["shelter", "food_bank", "medical_camp"] = Field(..., description="Resource category")
    name: str = Field(..., description="Facility name")
    lat: float = Field(..., description="Latitude coordinate in decimal degrees")
    lng: float = Field(..., description="Longitude coordinate in decimal degrees")
    elevation_m: float = Field(..., description="Elevation in meters above mean sea level")
    capacity: Optional[int] = Field(None, description="Shelter capacity count")
    current_occupancy: Optional[int] = Field(0, description="Current sheltered count")
    daily_meals: Optional[int] = Field(None, description="Daily meal throughput for food banks")
    beds: Optional[int] = Field(None, description="Available beds in medical camps")
    speciality: Optional[str] = Field(None, description="Medical specialization")
    status: Literal["online", "offline", "damaged"] = Field("online", description="Operational status")
    contact: Optional[str] = Field(None, description="Emergency dispatch telephone")
    address: Optional[str] = Field(None, description="Street address string")
    region: str = Field(..., description="Region identifier key")


class ResourcesResponse(BaseModel):
    """Response model for GET /resources."""
    region: str = Field(..., description="Region identifier key")
    total: int = Field(..., description="Total count of relief resources in region")
    resources: List[Dict[str, Any]] = Field(..., description="List of relief resource objects")


class RegionConfig(BaseModel):
    """Configuration and metadata for an available urban region."""
    id: str = Field(..., description="Unique slug for the region")
    name: str = Field(..., description="Human-readable city name")
    center_lat: float = Field(..., description="Geographic center latitude")
    center_lng: float = Field(..., description="Geographic center longitude")
    zoom: float = Field(11.0, description="Default map zoom level")
    disaster_risk: List[str] = Field(default_factory=list, description="Associated disaster risks (flood, cyclone)")
    description: Optional[str] = Field(None, description="Brief regional summary")


class RegionsResponse(BaseModel):
    """Response model for GET /regions."""
    regions: List[RegionConfig] = Field(..., description="List of configured urban regions")


class ElevationPoint(BaseModel):
    """A single coordinate node in the regional elevation grid."""
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    elevation_m: float = Field(..., description="Elevation in meters above sea level")


class BoundingBox(BaseModel):
    """Spatial bounding box coordinates for a region."""
    min_lat: float = Field(..., description="Southernmost latitude boundary")
    max_lat: float = Field(..., description="Northernmost latitude boundary")
    min_lng: float = Field(..., description="Westernmost longitude boundary")
    max_lng: float = Field(..., description="Easternmost longitude boundary")


class ElevationResponse(BaseModel):
    """Response model for GET /elevation."""
    region: str = Field(..., description="Region identifier key")
    bbox: Optional[BoundingBox] = Field(None, description="Spatial bounding box")
    grid: List[ElevationPoint] = Field(..., description="Array of elevation sampling points")


class FloodSimulateRequest(BaseModel):
    """Request payload for POST /flood/simulate."""
    region: str = Field(..., description="Region to simulate flood on (e.g. 'chennai')")
    water_level_m: float = Field(..., ge=0.0, le=20.0, description="Simulated flood water level in meters (0 to 20m)")
    resource_ids: Optional[List[str]] = Field(default_factory=list, description="Optional subset filter of resource IDs")


class FloodSimulateResponse(BaseModel):
    """Response payload for POST /flood/simulate."""
    water_level_m: float = Field(..., description="Input simulated water level in meters")
    offline: List[str] = Field(..., description="List of submerged / offline resource IDs")
    online: List[str] = Field(..., description="List of functional / online resource IDs")
    affected_capacity: int = Field(..., description="Aggregated metric of lost capacity / beds / meals")


class CycloneEye(BaseModel):
    """Geographic position of the cyclone eye."""
    lat: float = Field(..., description="Latitude of cyclone eye")
    lng: float = Field(..., description="Longitude of cyclone eye")


class CycloneSimulateRequest(BaseModel):
    """Request payload for POST /cyclone/simulate."""
    region: str = Field(..., description="Region identifier key")
    eye_lat: float = Field(..., description="Latitude of cyclone center")
    eye_lng: float = Field(..., description="Longitude of cyclone center")
    radius_km: float = Field(..., gt=0.0, le=200.0, description="Base wind radius in kilometers")
    severity: int = Field(..., ge=1, le=10, description="Cyclone severity index from 1 to 10")


class CycloneSimulateResponse(BaseModel):
    """Response payload for POST /cyclone/simulate."""
    eye: CycloneEye = Field(..., description="Cyclone center coordinate object")
    radius_km: float = Field(..., description="Effective damage radius after severity scaling")
    severity: int = Field(..., description="Input cyclone severity scale")
    damaged: List[str] = Field(..., description="List of damaged / offline resource IDs within radius")
    safe: List[str] = Field(..., description="List of safe / functional resource IDs outside radius")
    affected_capacity: int = Field(..., description="Aggregated metric of lost capacity / beds / meals")


class RerouteRequest(BaseModel):
    """Request payload for POST /reroute."""
    offline_ids: List[str] = Field(..., description="Array of offline or damaged resource IDs requiring rerouting")
    region: str = Field(..., description="Region identifier key")


class Route(BaseModel):
    """Shortest geodesic path recommendation from an offline resource to an online alternative."""
    from_id: str = Field(..., description="ID of offline resource")
    from_name: str = Field(..., description="Name of offline resource")
    from_lat: float = Field(..., description="Latitude of offline resource")
    from_lng: float = Field(..., description="Longitude of offline resource")
    to_id: str = Field(..., description="ID of nearest online alternative")
    to_name: str = Field(..., description="Name of nearest online alternative")
    to_lat: float = Field(..., description="Latitude of nearest online alternative")
    to_lng: float = Field(..., description="Longitude of nearest online alternative")
    distance_km: float = Field(..., ge=0.0, description="Geodesic distance between facilities in km")
    resource_type: str = Field(..., description="Matching resource category")


class RerouteResponse(BaseModel):
    """Response payload for POST /reroute."""
    routes: List[Route] = Field(..., description="List of calculated reroute connections")
