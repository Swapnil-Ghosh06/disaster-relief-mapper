"""
Cyclone Simulation Engine
=========================
Calculates cyclone wind radius impact on regional disaster relief resources
using spherical trigonometry (Haversine geodesic distance calculation).
"""

import math
from typing import List, Dict, Any


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance between two geographic coordinates.
    
    Uses the Haversine formula to account for Earth's spherical curvature.
    
    Args:
        lat1 (float): Latitude of point 1 in decimal degrees.
        lng1 (float): Longitude of point 1 in decimal degrees.
        lat2 (float): Latitude of point 2 in decimal degrees.
        lng2 (float): Longitude of point 2 in decimal degrees.
    
    Returns:
        float: Distance in kilometers between the two coordinates.
        
    Example:
        >>> haversine(13.0827, 80.2707, 13.0900, 80.2800)
        1.34
    """
    earth_radius_km = 6371.0  # Mean radius of Earth in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    
    # Clamp 'a' to [0, 1] to prevent domain errors in math.sqrt due to floating point rounding
    a = min(1.0, max(0.0, a))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return earth_radius_km * c


def apply_severity(radius_km: float, severity: int) -> float:
    """
    Scale the effective disaster damage radius based on cyclone intensity (1–10).
    
    Severity scaling formula:
        effective_radius = radius_km * (0.5 + (severity / 10.0))
        - Severity 1  -> 60% of base radius
        - Severity 5  -> 100% of base radius
        - Severity 10 -> 150% of base radius
    
    Args:
        radius_km (float): Base meteorological wind radius in kilometers.
        severity (int): Cyclone severity index from 1 (minor storm) to 10 (super cyclone).
        
    Returns:
        float: Effective impact radius in kilometers.
    """
    clamped_severity = max(1, min(10, severity))
    scale = 0.5 + (clamped_severity / 10.0)
    return radius_km * scale


def simulate_cyclone(
    eye_lat: float,
    eye_lng: float,
    radius_km: float,
    severity: int,
    resources: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Determine which relief facilities fall within a cyclone's destructive wind swath.
    
    Args:
        eye_lat (float): Latitude of the cyclone eye center.
        eye_lng (float): Longitude of the cyclone eye center.
        radius_km (float): Base radius of destructive winds in km.
        severity (int): Cyclone severity level (1 to 10).
        resources (List[dict]): Array of resource objects in the simulated region.
        
    Returns:
        dict: Simulation summary containing:
            - eye (dict): { 'lat': float, 'lng': float }
            - radius_km (float): Scaled effective damage radius
            - severity (int): Input severity level
            - damaged (list[str]): IDs of facilities within the destructive radius
            - safe (list[str]): IDs of facilities remaining unaffected
            - affected_capacity (int): Total combined throughput/capacity lost
    """
    effective_radius = apply_severity(radius_km, severity)
    
    damaged: List[str] = []
    safe: List[str] = []
    affected_capacity = 0
    
    for resource in resources:
        res_lat = float(resource["lat"])
        res_lng = float(resource["lng"])
        
        dist = haversine(eye_lat, eye_lng, res_lat, res_lng)
        
        if dist <= effective_radius:
            damaged.append(resource["id"])
            # Sum up capacity/meals/beds metrics
            cap = (
                resource.get("capacity")
                or resource.get("daily_meals")
                or resource.get("beds")
                or 0
            )
            affected_capacity += int(cap)
        else:
            safe.append(resource["id"])
            
    return {
        "eye": {"lat": round(eye_lat, 4), "lng": round(eye_lng, 4)},
        "radius_km": round(effective_radius, 2),
        "severity": severity,
        "damaged": damaged,
        "safe": safe,
        "affected_capacity": affected_capacity,
    }
