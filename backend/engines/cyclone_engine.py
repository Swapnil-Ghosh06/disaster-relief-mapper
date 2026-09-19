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
    
    Args:
        lat1 (float): Latitude of point 1 in decimal degrees (WGS84).
        lng1 (float): Longitude of point 1 in decimal degrees (WGS84).
        lat2 (float): Latitude of point 2 in decimal degrees (WGS84).
        lng2 (float): Longitude of point 2 in decimal degrees (WGS84).
    
    Returns:
        float: Great-circle geodesic distance in kilometers between the two coordinates.
        
    Notes / Formula:
        Spherical Haversine Equation (Earth radius R = 6371.0 km):
            Δlat = radians(lat2 - lat1)
            Δlng = radians(lng2 - lng1)
            a = sin²(Δlat / 2) + cos(radians(lat1)) · cos(radians(lat2)) · sin²(Δlng / 2)
            c = 2 · arcsin(√a)  [or 2 · atan2(√a, √(1 - a))]
            d = R · c
            
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
    
    # Clamp 'a' to [0.0, 1.0] to prevent math domain error due to floating point inaccuracies
    a = min(1.0, max(0.0, a))
    
    c = 2.0 * math.asin(math.sqrt(a))
    
    return earth_radius_km * c


def apply_severity(radius_km: float, severity: int) -> float:
    """
    Dynamically scale the effective wind swath radius based on cyclone severity (1–10).
    
    Args:
        radius_km (float): Base meteorological wind radius in kilometers.
        severity (int): Cyclone intensity scale from 1 (minor tropical depression) to 10 (super cyclonic storm).
        
    Returns:
        float: Scaled effective damage radius in kilometers.
        
    Notes / Formula:
        Linear Interpolation Scaling:
            scale_factor = 0.5 + (clamped_severity - 1) * ((2.0 - 0.5) / (10 - 1))
                         = 0.5 + (clamped_severity - 1) * (1.5 / 9.0)
                         = 0.5 + (clamped_severity - 1) / 6.0
            effective_radius = radius_km * scale_factor
            
            - Severity 1  -> 0.50x base radius
            - Severity 4  -> 1.00x base radius
            - Severity 7  -> 1.50x base radius
            - Severity 10 -> 2.00x base radius
            
    Example:
        >>> apply_severity(10.0, 1)
        5.0
        >>> apply_severity(10.0, 4)
        10.0
        >>> apply_severity(10.0, 10)
        20.0
    """
    clamped_severity = max(1, min(10, severity))
    scale = 0.5 + (clamped_severity - 1) * (1.5 / 9.0)
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
        eye_lat (float): Latitude of the cyclone eye center in decimal degrees.
        eye_lng (float): Longitude of the cyclone eye center in decimal degrees.
        radius_km (float): Base meteorological radius of destructive winds in km.
        severity (int): Cyclone severity level (1 to 10).
        resources (List[Dict[str, Any]]): Array of resource objects in the simulated region.
        
    Returns:
        Dict[str, Any]: Cyclone simulation summary containing:
            - eye (dict): { 'lat': float, 'lng': float }
            - radius_km (float): Scaled effective damage radius in km
            - severity (int): Input severity level
            - damaged (List[str]): List of facility IDs within destructive swath
            - safe (List[str]): List of operational facility IDs outside swath
            - affected_capacity (int): Aggregated throughput / capacity lost
            
    Notes / Formula:
        Radial Damage Criterion:
            r_eff = apply_severity(radius_km, severity)
            For facility i:
                d_i = haversine(eye_lat, eye_lng, lat_i, lng_i)
                status_i = "damaged" if d_i <= r_eff else "safe"
                
        Capacity Loss Formula:
            affected_capacity = sum(capacity_j for j in damaged_facilities)
            
    Example:
        >>> res = [{"id": "SH001", "lat": 13.08, "lng": 80.27, "capacity": 200}]
        >>> simulate_cyclone(13.08, 80.27, 5.0, 4, res)
        {'eye': {'lat': 13.08, 'lng': 80.27}, 'radius_km': 5.0, 'severity': 4, 'damaged': ['SH001'], 'safe': [], 'affected_capacity': 200}
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
