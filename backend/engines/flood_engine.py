"""
Flood Simulation Engine
=======================
Evaluates topographical inundation and calculates relief facility submergence
based on digital elevation model (DEM) grid data and flood water level.
"""

import os
import csv
from typing import List, Dict, Tuple, Any, Optional

# In-memory elevation grid cache: region -> { (lat_round, lng_round): elevation_m }
_ELEVATION_CACHE: Dict[str, Dict[Tuple[float, float], float]] = {}


def load_elevation(region: str, data_dir: Optional[str] = None) -> Dict[Tuple[float, float], float]:
    """
    Load regional elevation grid into an in-memory spatial hash table.
    
    Caches parsed grids in memory for sub-millisecond query performance.
    
    Args:
        region (str): Region key (e.g. 'chennai', 'mumbai').
        data_dir (str, optional): Base directory containing elevation CSV files.
        
    Returns:
        dict: Mapping of (round(lat, 3), round(lng, 3)) tuples to elevation in meters.
    """
    global _ELEVATION_CACHE
    if region in _ELEVATION_CACHE:
        return _ELEVATION_CACHE[region]
    
    if data_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(base_dir, "data")
        
    csv_path = os.path.join(data_dir, f"elevation_{region}.csv")
    lookup: Dict[Tuple[float, float], float] = {}
    
    if os.path.exists(csv_path):
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    lat = round(float(row["lat"]), 3)
                    lng = round(float(row["lng"]), 3)
                    elev = float(row["elevation_m"])
                    lookup[(lat, lng)] = elev
                except (ValueError, KeyError):
                    continue
                    
    _ELEVATION_CACHE[region] = lookup
    return lookup


def get_resource_elevation(resource: Dict[str, Any], elevation_lookup: Dict[Tuple[float, float], float]) -> float:
    """
    Retrieve the ground elevation in meters at a given relief facility coordinate.
    
    Uses exact spatial hash lookup if present, falls back to direct facility
    elevation attribute, or finds the closest available DEM grid node.
    
    Args:
        resource (dict): Facility record containing 'lat', 'lng', and optional 'elevation_m'.
        elevation_lookup (dict): In-memory elevation dictionary for the region.
        
    Returns:
        float: Estimated ground elevation in meters.
    """
    res_lat = float(resource["lat"])
    res_lng = float(resource["lng"])
    
    # 1. Direct key match (resolution: ~0.001 deg / 100m)
    key = (round(res_lat, 3), round(res_lng, 3))
    if key in elevation_lookup:
        return elevation_lookup[key]
    
    # 2. Key match at lower resolution
    key_coarse = (round(res_lat, 2), round(res_lng, 2))
    for (glat, glng), elev in elevation_lookup.items():
        if (round(glat, 2), round(glng, 2)) == key_coarse:
            return elev
            
    # 3. Fallback to resource pre-calculated elevation if present
    if "elevation_m" in resource and resource["elevation_m"] is not None:
        return float(resource["elevation_m"])
        
    # 4. Fallback: nearest DEM grid point
    if elevation_lookup:
        min_dist_sq = float("inf")
        nearest_elev = 5.0
        for (glat, glng), elev in elevation_lookup.items():
            dist_sq = (glat - res_lat) ** 2 + (glng - res_lng) ** 2
            if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                nearest_elev = elev
        return nearest_elev
        
    return 5.0


def simulate_flood(
    water_level_m: float,
    resources: List[Dict[str, Any]],
    elevation_lookup: Dict[Tuple[float, float], float],
) -> Dict[str, Any]:
    """
    Simulate flood water rise across a region and partition facilities into offline/online.
    
    Facilities with terrain elevation strictly below the flood water level
    are categorized as submerged/offline.
    
    Args:
        water_level_m (float): Flood inundation stage height in meters.
        resources (List[dict]): Array of resources to evaluate.
        elevation_lookup (dict): Regional elevation dictionary.
        
    Returns:
        dict: Inundation summary containing:
            - water_level_m (float): Evaluated water level
            - offline (list[str]): List of submerged resource IDs
            - online (list[str]): List of accessible, operational resource IDs
            - affected_capacity (int): Aggregated capacity lost across submerged facilities
    """
    offline: List[str] = []
    online: List[str] = []
    affected_capacity = 0
    
    for resource in resources:
        elevation = get_resource_elevation(resource, elevation_lookup)
        
        if elevation < water_level_m:
            offline.append(resource["id"])
            cap = (
                resource.get("capacity")
                or resource.get("daily_meals")
                or resource.get("beds")
                or 0
            )
            affected_capacity += int(cap)
        else:
            online.append(resource["id"])
            
    return {
        "water_level_m": round(water_level_m, 2),
        "offline": offline,
        "online": online,
        "affected_capacity": affected_capacity,
    }
