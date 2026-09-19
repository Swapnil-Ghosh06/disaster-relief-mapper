"""
Emergency Rerouting Engine
==========================
Computes optimal nearest-neighbor backup routing to operational facilities of identical
category when relief facilities are incapacitated during disaster incidents.
"""

from typing import List, Dict, Any, Optional, Set, Union
from engines.cyclone_engine import haversine


def find_nearest_alternative(
    offline_resource: Dict[str, Any],
    all_resources: List[Dict[str, Any]],
    offline_ids: Union[List[str], Set[str]],
) -> Optional[Dict[str, Any]]:
    """
    Locate the closest operational relief facility matching the resource type.
    
    Category-Preserving Nearest-Neighbor Optimization:
        Given an incapacitated facility f_off of category T = type(f_off), identify:
            f* = argmin_{f in C} [ haversine(coord(f_off), coord(f)) ]
        where candidate set C is defined as:
            C = { f in all_resources | type(f) == T and id(f) not in offline_ids and id(f) != id(f_off) }
            
    Args:
        offline_resource (dict): The incapacitated facility record requiring dynamic rerouting.
        all_resources (List[dict]): Global catalog of relief resources in the active region.
        offline_ids (Union[List[str], Set[str]]): Collection of all currently incapacitated facility IDs.
        
    Returns:
        Optional[dict]: Shortest-path route recommendation dictionary, or None if no alternatives exist.
            Structure: {
                "from_id": str,
                "from_name": str,
                "from_lat": float,
                "from_lng": float,
                "to_id": str,
                "to_name": str,
                "to_lat": float,
                "to_lng": float,
                "distance_km": float,
                "resource_type": str
            }
            
    Example:
        >>> off = {"id": "SH001", "name": "Anna Nagar", "type": "shelter", "lat": 13.085, "lng": 80.210}
        >>> all_r = [off, {"id": "SH002", "name": "Kilpauk", "type": "shelter", "lat": 13.090, "lng": 80.230}]
        >>> find_nearest_alternative(off, all_r, ["SH001"])
        {'from_id': 'SH001', 'from_name': 'Anna Nagar', 'from_lat': 13.085, 'from_lng': 80.21, 'to_id': 'SH002', 'to_name': 'Kilpauk', 'to_lat': 13.09, 'to_lng': 80.23, 'distance_km': 2.24, 'resource_type': 'shelter'}
    """
    resource_type = offline_resource.get("type")
    res_lat = float(offline_resource["lat"])
    res_lng = float(offline_resource["lng"])
    
    # Candidates must share same type, must NOT be offline, and must not be the same facility
    offline_id_set = set(offline_ids) if not isinstance(offline_ids, set) else offline_ids
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
    
    Iterates through all provided offline IDs, locates each facility record in the
    regional catalog, and computes its closest operational peer using find_nearest_alternative.
    Facilities without available peers are safely omitted.
    
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
        route = find_nearest_alternative(resource, all_resources, offline_id_set)
        if route:
            routes.append(route)
            
    return routes
