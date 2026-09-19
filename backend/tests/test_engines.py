"""
Unit Tests for Simulation & Routing Engines
===========================================
Tests mathematical accuracy, edge conditions, monotonicity, and core business logic
in cyclone, flood, and emergency rerouting engines.
"""

import math
import pytest
from engines.cyclone_engine import haversine, apply_severity, simulate_cyclone
from engines.flood_engine import get_resource_elevation, simulate_flood
from engines.router import find_nearest_alternative, generate_all_routes


def test_haversine_same_point():
    """Haversine distance between identical coordinates must be exactly 0.0 km."""
    d = haversine(13.0827, 80.2707, 13.0827, 80.2707)
    assert math.isclose(d, 0.0, abs_tol=1e-6)


def test_haversine_known_distance():
    """Verify Haversine against known coordinate distances."""
    # Point 1: 13.0827, 80.2707 -> Point 2: 13.0900, 80.2700 (~0.81 km)
    d_short = haversine(13.0827, 80.2707, 13.0900, 80.2700)
    assert 0.75 <= d_short <= 0.90
    
    # Chennai (13.0827, 80.2707) -> Mumbai (19.0760, 72.8777) (~1030 km)
    d_long = haversine(13.0827, 80.2707, 19.0760, 72.8777)
    assert 1020 <= d_long <= 1045


def test_apply_severity_scaling():
    """Verify severity scaling: severity=1 gives <= radius, severity=10 gives >= 2x radius, middle values are monotonic."""
    base_radius = 10.0
    
    # Severity 1 gives <= radius (0.5x base = 5.0 km)
    sev1 = apply_severity(base_radius, 1)
    assert sev1 <= base_radius
    assert math.isclose(sev1, 5.0)
    
    # Severity 10 gives >= 2x radius (2.0x base = 20.0 km)
    sev10 = apply_severity(base_radius, 10)
    assert sev10 >= 2 * base_radius
    assert math.isclose(sev10, 20.0)
    
    # Monotonically increasing across all severity levels 1 to 10
    prev = apply_severity(base_radius, 1)
    for s in range(2, 11):
        curr = apply_severity(base_radius, s)
        assert curr > prev, f"Expected severity {s} radius ({curr}) to exceed severity {s-1} ({prev})"
        prev = curr


def test_simulate_cyclone():
    """Verify that a resource inside the radius is 'damaged', one outside is 'safe'."""
    resources = [
        {"id": "SH001", "type": "shelter", "lat": 13.08, "lng": 80.27, "capacity": 200},
        {"id": "SH002", "type": "shelter", "lat": 13.09, "lng": 80.28, "capacity": 150},
        {"id": "SH003", "type": "shelter", "lat": 13.50, "lng": 80.80, "capacity": 300},  # ~75 km away
    ]
    # Cyclone centered at SH001 with 10km radius and severity 4 (1.0x scale = 10km)
    res = simulate_cyclone(eye_lat=13.08, eye_lng=80.27, radius_km=10.0, severity=4, resources=resources)
    
    assert "SH001" in res["damaged"]
    assert "SH002" in res["damaged"]
    assert "SH003" in res["safe"]
    assert res["affected_capacity"] == 350


def test_simulate_flood():
    """Verify that a resource with elevation_m < water_level is 'offline', one above is 'online'."""
    elevation_lookup = {
        (13.000, 80.200): 2.5,
        (13.050, 80.250): 7.0,
    }
    resources = [
        {"id": "SH001", "type": "shelter", "lat": 13.000, "lng": 80.200, "elevation_m": 2.5, "capacity": 250},
        {"id": "SH002", "type": "shelter", "lat": 13.050, "lng": 80.250, "elevation_m": 7.0, "capacity": 300},
    ]
    
    # 1. Water level 1.0m (below both) -> all online
    res_low = simulate_flood(1.0, resources, elevation_lookup)
    assert res_low["offline"] == []
    assert len(res_low["online"]) == 2
    assert res_low["affected_capacity"] == 0
    
    # 2. Water level 5.0m (above SH001, below SH002) -> SH001 offline, SH002 online
    res_mid = simulate_flood(5.0, resources, elevation_lookup)
    assert res_mid["offline"] == ["SH001"]
    assert res_mid["online"] == ["SH002"]
    assert res_mid["affected_capacity"] == 250
    
    # 3. Water level 10.0m (above both) -> all offline
    res_high = simulate_flood(10.0, resources, elevation_lookup)
    assert set(res_high["offline"]) == {"SH001", "SH002"}
    assert res_high["online"] == []
    assert res_high["affected_capacity"] == 550


def test_find_nearest_alternative():
    """Given 3 shelters with one offline, returns the closer of the 2 remaining."""
    all_resources = [
        {"id": "SH001", "name": "Anna Nagar Shelter", "type": "shelter", "lat": 13.0850, "lng": 80.2100},
        {"id": "SH002", "name": "Kilpauk Shelter", "type": "shelter", "lat": 13.0900, "lng": 80.2300},  # ~2.2 km from SH001
        {"id": "SH003", "name": "Tambaram Shelter", "type": "shelter", "lat": 12.9250, "lng": 80.1000}, # ~21.5 km from SH001
        {"id": "FB001", "name": "Food Hub", "type": "food_bank", "lat": 13.0860, "lng": 80.2110},       # Closer but wrong type
    ]
    
    # When SH001 is offline, find alternative among SH002 and SH003 -> picks closer (SH002)
    route = find_nearest_alternative(all_resources[0], all_resources, offline_ids=["SH001"])
    assert route is not None
    assert route["from_id"] == "SH001"
    assert route["to_id"] == "SH002"
    assert route["to_name"] == "Kilpauk Shelter"
    assert route["resource_type"] == "shelter"
    assert 2.0 <= route["distance_km"] <= 2.5


def test_generate_all_routes_empty():
    """Empty offline_ids returns empty routes list."""
    routes = generate_all_routes([], [])
    assert routes == []
