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
    
    Uses the spherical trigonometry Haversine formula on Earth of radius R = 6371.0 km:
    
    Mathematical Formulation:
        Δlat = lat2 - lat1 (radians)
        Δlng = lng2 - lng1 (radians)
        a = sin²(Δlat / 2) + cos(lat1) · cos(lat2) · sin²(Δlng / 2)
        c = 2 · atan2(√a, √(1 - a))  [or 2 · arcsin(√a)]
        d = R · c
    
    Args:
        lat1 (float): Latitude of point 1 in decimal degrees.
        lng1 (float): Longitude of point 1 in decimal degrees.
        lat2 (float): Latitude of point 2 in decimal degrees.
        lng2 (float): Longitude of point 2 in decimal degrees.
    
    Returns:
        float: Great-circle distance in kilometers between the two coordinates.
        
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
    
    Uses linear interpolation between severity=1 (0.5x base radius) and severity=10 (2.0x base radius):
    
    Mathematical Formula:
        scale_factor = 0.5 + (clamped_severity - 1) * ((2.0 - 0.5) / (10 - 1))
                     = 0.5 + (clamped_severity - 1) * (1.5 / 9.0)
                     = 0.5 + (clamped_severity - 1) / 6.0
                     
        - Severity 1  -> 0.50x base radius
        - Severity 4  -> 1.00x base radius
        - Severity 7  -> 1.50x base radius
        - Severity 10 -> 2.00x base radius
    
    Args:
        radius_km (float): Base meteorological wind radius in kilometers.
        severity (int): Cyclone intensity scale from 1 (minor tropical depression) to 10 (super cyclonic storm).
        
    Returns:
        float: Scaled effective damage radius in kilometers.
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
    
    For each relief resource:
        1. Compute great-circle distance d from the cyclone eye (eye_lat, eye_lng) using Haversine formula.
        2. Compute effective damage radius r_eff via apply_severity(radius_km, severity).
        3. If d <= r_eff, classify resource as 'damaged'.
        4. Otherwise, classify resource as 'safe'.
        5. Compute total capacity loss across all damaged facilities.
    
    Args:
        eye_lat (float): Latitude of the cyclone eye center in decimal degrees.
        eye_lng (float): Longitude of the cyclone eye center in decimal degrees.
        radius_km (float): Base meteorological radius of destructive winds in km.
        severity (int): Cyclone severity level (1 to 10).
        resources (List[dict]): Array of resource objects in the simulated region.
        
    Returns:
        dict: Cyclone simulation summary containing:
            - eye (dict): { 'lat': float, 'lng': float }
            - radius_km (float): Scaled effective damage radius in km
            - severity (int): Input severity level
            - damaged (list[str]): List of facility IDs within destructive swath
            - safe (list[str]): List of operational facility IDs outside swath
            - affected_capacity (int): Aggregated throughput / capacity lost
            
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
