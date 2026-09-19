"""
Unit Tests for Simulation & Routing Engines
===========================================
Tests mathematical accuracy, edge conditions, and core business logic
in cyclone, flood, and rerouting engines.
"""

import math
import pytest
from engines.cyclone_engine import haversine, apply_severity, simulate_cyclone
from engines.flood_engine import get_resource_elevation, simulate_flood
from engines.router import find_nearest_alternative, generate_all_routes


def test_haversine_same_point():
    """Distance between identical coordinates must be exactly 0 km."""
    d = haversine(13.0827, 80.2707, 13.0827, 80.2707)
    assert math.isclose(d, 0.0, abs_tol=1e-6)


def test_haversine_known_distance():
    """Verify Haversine against known coordinate distance (Chennai to Mumbai ~1030 km)."""
    # Chennai (13.0827, 80.2707) -> Mumbai (19.0760, 72.8777)
    d = haversine(13.0827, 80.2707, 19.0760, 72.8777)
    assert 1020 <= d <= 1045


def test_apply_severity_scaling():
    """Verify severity scaling limits and multipliers."""
    base_radius = 10.0
    # Severity 1 -> 10 * (0.5 + 0.1) = 6.0
    assert math.isclose(apply_severity(base_radius, 1), 6.0)
    # Severity 5 -> 10 * (0.5 + 0.5) = 10.0
    assert math.isclose(apply_severity(base_radius, 5), 10.0)
    # Severity 10 -> 10 * (0.5 + 1.0) = 15.0
    assert math.isclose(apply_severity(base_radius, 10), 15.0)


def test_simulate_cyclone():
    """Verify cyclone damage tagging and capacity calculations."""
    resources = [
        {"id": "SH001", "type": "shelter", "lat": 13.08, "lng": 80.27, "capacity": 200},
        {"id": "SH002", "type": "shelter", "lat": 13.09, "lng": 80.28, "capacity": 150},
        {"id": "SH003", "type": "shelter", "lat": 13.50, "lng": 80.80, "capacity": 300},  # Far away
    ]
    # Cyclone centered near SH001 & SH002 with 10km radius
    res = simulate_cyclone(eye_lat=13.08, eye_lng=80.27, radius_km=10.0, severity=5, resources=resources)
    
    assert "SH001" in res["damaged"]
    assert "SH002" in res["damaged"]
    assert "SH003" in res["safe"]
    assert res["affected_capacity"] == 350


def test_simulate_flood():
    """Verify flood submergence threshold logic."""
    elevation_lookup = {
        (13.000, 80.200): 2.5,
        (13.050, 80.250): 7.0,
    }
    resources = [
        {"id": "SH001", "type": "shelter", "lat": 13.000, "lng": 80.200, "elevation_m": 2.5, "capacity": 250},
        {"id": "SH002", "type": "shelter", "lat": 13.050, "lng": 80.250, "elevation_m": 7.0, "capacity": 300},
    ]
    
    # 1. Water level below all -> all online
    res_low = simulate_flood(1.0, resources, elevation_lookup)
    assert res_low["offline"] == []
    assert len(res_low["online"]) == 2
    assert res_low["affected_capacity"] == 0
    
    # 2. Water level 5.0m -> SH001 submerged
    res_mid = simulate_flood(5.0, resources, elevation_lookup)
    assert res_mid["offline"] == ["SH001"]
    assert res_mid["online"] == ["SH002"]
    assert res_mid["affected_capacity"] == 250
    
    # 3. Water level 10.0m -> all submerged
    res_high = simulate_flood(10.0, resources, elevation_lookup)
    assert set(res_high["offline"]) == {"SH001", "SH002"}
    assert res_high["affected_capacity"] == 550


def test_find_nearest_alternative():
    """Verify routing matches identical facility type and picks closest distance."""
    all_resources = [
        {"id": "SH001", "name": "Shelter 1", "type": "shelter", "lat": 13.00, "lng": 80.20},
        {"id": "SH002", "name": "Shelter 2", "type": "shelter", "lat": 13.02, "lng": 80.21},
        {"id": "SH003", "name": "Shelter 3", "type": "shelter", "lat": 13.10, "lng": 80.30},
        {"id": "FB001", "name": "Food Bank 1", "type": "food_bank", "lat": 13.01, "lng": 80.20},
    ]
    
    # SH001 offline -> nearest online shelter is SH002
    route = find_nearest_alternative(all_resources[0], all_resources, offline_ids=["SH001"])
    assert route is not None
    assert route["from_id"] == "SH001"
    assert route["to_id"] == "SH002"
    assert route["resource_type"] == "shelter"
    assert route["distance_km"] > 0
    
    # When SH002 is also offline, should pick SH003
    route2 = find_nearest_alternative(all_resources[0], all_resources, offline_ids=["SH001", "SH002"])
    assert route2 is not None
    assert route2["to_id"] == "SH003"


def test_generate_all_routes_empty():
    """Empty offline IDs list should return empty routes."""
    routes = generate_all_routes([], [])
    assert routes == []
