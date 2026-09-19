"""
Integration Tests for FastAPI Endpoints
=======================================
Tests all REST endpoints, status codes, query filtering, validation error codes,
and JSON payload structures against SCHEMA.md specification.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify GET / returns 200 and health check status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data


def test_get_regions():
    """Verify GET /regions returns 200, response contains all 5 region IDs."""
    response = client.get("/regions")
    assert response.status_code == 200
    data = response.json()
    assert "regions" in data
    region_ids = [r["id"] for r in data["regions"]]
    for expected in ["chennai", "mumbai", "bhubaneswar", "kolkata", "wellington"]:
        assert expected in region_ids, f"Expected {expected} in {region_ids}"


def test_get_resources_default():
    """Verify GET /resources?region=chennai returns 200 and total > 0."""
    response = client.get("/resources?region=chennai")
    assert response.status_code == 200
    data = response.json()
    assert data["region"] == "chennai"
    assert data["total"] > 0
    assert len(data["resources"]) == data["total"]
    
    first = data["resources"][0]
    assert "id" in first
    assert "type" in first
    assert "name" in first
    assert "lat" in first
    assert "lng" in first
    assert "elevation_m" in first
    assert first["status"] == "online"


def test_get_resources_invalid_region():
    """Verify GET /resources?region=atlantis returns 400."""
    response = client.get("/resources?region=atlantis")
    assert response.status_code == 400
    assert "Unsupported region" in response.json()["detail"] or "Invalid region" in response.json()["detail"]


def test_get_elevation():
    """Verify GET /elevation?region=mumbai returns 200 with bbox and grid list."""
    response = client.get("/elevation?region=mumbai")
    assert response.status_code == 200
    data = response.json()
    assert data["region"] == "mumbai"
    assert "bbox" in data
    assert data["bbox"] is not None
    assert "min_lat" in data["bbox"]
    assert "grid" in data
    assert len(data["grid"]) > 0
    first_pt = data["grid"][0]
    assert "lat" in first_pt
    assert "lng" in first_pt
    assert "elevation_m" in first_pt


def test_flood_simulate():
    """Verify POST /flood/simulate with valid payload returns 200, 'offline' and 'online' are lists."""
    payload = {
        "region": "chennai",
        "water_level_m": 4.0,
        "resource_ids": []
    }
    response = client.post("/flood/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "water_level_m" in data
    assert "offline" in data
    assert "online" in data
    assert "affected_capacity" in data
    assert isinstance(data["offline"], list)
    assert isinstance(data["online"], list)


def test_flood_simulate_invalid_params():
    """Verify water_level_m=999 returns 400."""
    payload = {
        "region": "chennai",
        "water_level_m": 999.0,
    }
    response = client.post("/flood/simulate", json=payload)
    assert response.status_code == 400


def test_cyclone_simulate():
    """Verify POST /cyclone/simulate with valid payload returns 200, 'damaged' and 'safe' are lists."""
    payload = {
        "region": "chennai",
        "eye_lat": 13.0827,
        "eye_lng": 80.2707,
        "radius_km": 10.0,
        "severity": 6
    }
    response = client.post("/cyclone/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == 6
    assert "damaged" in data
    assert "safe" in data
    assert isinstance(data["damaged"], list)
    assert isinstance(data["safe"], list)
    assert "affected_capacity" in data
    assert data["eye"]["lat"] == 13.0827


def test_cyclone_simulate_invalid_severity():
    """Verify severity=99 returns 400."""
    payload = {
        "region": "chennai",
        "eye_lat": 13.0827,
        "eye_lng": 80.2707,
        "radius_km": 10.0,
        "severity": 99
    }
    response = client.post("/cyclone/simulate", json=payload)
    assert response.status_code == 400


def test_reroute_endpoint():
    """Verify POST /reroute with one offline_id returns 200 and at least one route."""
    res_resp = client.get("/resources?region=chennai")
    resources = res_resp.json()["resources"]
    assert len(resources) >= 2
    first_id = resources[0]["id"]
    
    payload = {
        "region": "chennai",
        "offline_ids": [first_id]
    }
    response = client.post("/reroute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data
    assert isinstance(data["routes"], list)
    assert len(data["routes"]) >= 1
    route = data["routes"][0]
    assert route["from_id"] == first_id
    assert route["to_id"] != first_id
    assert route["distance_km"] >= 0


def test_reroute_empty():
    """Verify POST /reroute with empty offline_ids returns 200 with empty routes list."""
    payload = {
        "region": "chennai",
        "offline_ids": []
    }
    response = client.post("/reroute", json=payload)
    assert response.status_code == 200
    assert response.json() == {"routes": []}
