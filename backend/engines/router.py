"""
Rerouting Engine
================
Identifies nearest operational backup facilities of identical category
when relief resources are compromised or submerged during disaster events.
"""

from typing import List, Dict, Any, Optional
from engines.cyclone_engine import haversine


def find_nearest_alternative(
    offline_resource: Dict[str, Any],
    all_resources: List[Dict[str, Any]],
    offline_ids: List[str],
) -> Optional[Dict[str, Any]]:
    """
    Locate the closest operational relief facility matching the resource type.
    
    Filters the global resource pool to only include functional facilities
    of the exact same category (shelter -> shelter, food_bank -> food_bank,
    medical_camp -> medical_camp). Sorts by geodesic distance using Haversine formula.
    
    Args:
        offline_resource (dict): The non-operational resource requiring backup.
        all_resources (List[dict]): Complete resource pool for the active region.
        offline_ids (List[str]): List of all currently incapacitated facility IDs.
        
    Returns:
        Optional[dict]: Routing recommendation dictionary or None if no alternatives exist.
    """
    resource_type = offline_resource.get("type")
    res_lat = float(offline_resource["lat"])
    res_lng = float(offline_resource["lng"])
    
    # Candidates must share same type, must NOT be offline, and must not be the same facility
    offline_id_set = set(offline_ids)
    candidates = [
        r for r in all_resources
        if r.get("type") == resource_type
        and r["id"] not in offline_id_set
        and r["id"] != offline_resource["id"]
    ]
    
    if not candidates:
        return None
        
    # Sort candidates by Haversine distance
    candidates_with_dist = [
        (c, haversine(res_lat, res_lng, float(c["lat"]), float(c["lng"])))
        for c in candidates
    ]
    candidates_with_dist.sort(key=lambda item: item[1])
    
    nearest, distance_km = candidates_with_dist[0]
    
    return {
        "from_id": offline_resource["id"],
        "from_name": offline_resource.get("name", "Unknown Facility"),
        "from_lat": float(offline_resource["lat"]),
        "from_lng": float(offline_resource["lng"]),
        "to_id": nearest["id"],
        "to_name": nearest.get("name", "Alternative Hub"),
        "to_lat": float(nearest["lat"]),
        "to_lng": float(nearest["lng"]),
        "distance_km": round(distance_km, 2),
        "resource_type": resource_type,
    }


def generate_all_routes(
    offline_ids: List[str],
    all_resources: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Generate optimal backup routes for all compromised relief facilities.
    
    Args:
        offline_ids (List[str]): List of offline or damaged facility IDs.
        all_resources (List[dict]): Complete catalog of regional resources.
        
    Returns:
        List[dict]: Array of route objects linking each offline resource to its nearest alternative.
    """
    offline_id_set = set(offline_ids)
    offline_resources = [r for r in all_resources if r["id"] in offline_id_set]
    
    routes: List[Dict[str, Any]] = []
    for resource in offline_resources:
        route = find_nearest_alternative(resource, all_resources, offline_ids)
        if route:
            routes.append(route)
            
    return routes
