"""
Synthetic Data & Elevation Pipeline Generator
=============================================
Generates comprehensive synthetic relief resources (shelters, food banks, medical camps)
and digital elevation grids (DEM) for all supported disaster-prone regions.
"""

import os
import json
import random
import csv

# Set deterministic random seed for reproducible synthetic data
random.seed(42)

REGIONS = {
    "chennai": {
        "name": "Chennai, Tamil Nadu",
        "center_lat": 13.0827,
        "center_lng": 80.2707,
        "lat_range": (12.9200, 13.1800),
        "lng_range": (80.1200, 80.2900),
        "coast_lng": 80.2850,
        "zoom": 11.8,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Coastal metropolis vulnerable to Bay of Bengal cyclones and severe monsoon flooding."
    },
    "mumbai": {
        "name": "Mumbai, Maharashtra",
        "center_lat": 19.0760,
        "center_lng": 72.8777,
        "lat_range": (18.9000, 19.2500),
        "lng_range": (72.7800, 72.9800),
        "coast_lng": 72.8150,
        "zoom": 11.8,
        "disaster_risk": ["flood"],
        "description": "High-density coastal commercial hub with heavy monsoon inundation and tidal surges."
    },
    "bhubaneswar": {
        "name": "Bhubaneswar, Odisha",
        "center_lat": 20.2961,
        "center_lng": 85.8245,
        "lat_range": (20.2000, 20.4000),
        "lng_range": (85.7400, 85.9200),
        "coast_lng": 86.2000,
        "zoom": 11.8,
        "disaster_risk": ["cyclone", "flood"],
        "description": "Odisha state capital on eastern cyclone trajectory with severe tropical storm risk."
    },
    "kolkata": {
        "name": "Kolkata, West Bengal",
        "center_lat": 22.5726,
        "center_lng": 88.3639,
        "lat_range": (22.4500, 22.7000),
        "lng_range": (88.2800, 88.4600),
        "coast_lng": 88.3500,
        "zoom": 11.8,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Gangetic delta megacity with low elevation and extreme deltaic flood vulnerability."
    },
    "wellington": {
        "name": "Wellington, New Zealand",
        "center_lat": -41.2865,
        "center_lng": 174.7762,
        "lat_range": (-41.3400, -41.2400),
        "lng_range": (174.7200, 174.8400),
        "coast_lng": 174.7800,
        "zoom": 12.6,
        "disaster_risk": ["flood", "cyclone"],
        "description": "Harbor digital twin model with steep coastal ridges and harbor storm surge risk."
    },
}

FACILITY_NAMES = {
    "chennai": {
        "shelters": [
            "Anna Nagar Regional Evacuation Shelter", "Kilpauk Community Relief Center",
            "Velachery Flood Evac Station", "Tambaram Multi-Purpose Hall",
            "Perambur High School Relief Base", "Adyar Disaster Shelter Hub",
            "Mylapore Cultural Center Safe Zone", "Porur Disaster Evacuation Shelter",
            "Guindy Industrial Aid Depot", "Tondiarpet Public Safe Haven",
            "Nungambakkam Community Haven", "Royapettah Relief Post"
        ],
        "food_banks": [
            "T Nagar Community Central Kitchen", "Besant Nagar Coastal Food Hub",
            "Egmore Relief Ration Store", "Chromepet Central Distribution Kitchen",
            "Sholinganallur Food Dispatch Point", "Triplicane Community Pantry",
            "Saidapet Food Supply Depot", "Koyambedu Emergency Grain Store"
        ],
        "medical_camps": [
            "Adyar Coastal Trauma Medical Post", "Marina Beach Emergency Clinic",
            "Tambaram Base Field Hospital", "Anna Nagar Health & Triage Camp",
            "Velachery First Aid Outpost", "Royapettah Rapid Response Unit",
            "Kilpauk Emergency Medical Shelter"
        ]
    },
    "mumbai": {
        "shelters": [
            "Dharavi Community Relief Camp", "Kurla West Flood Shelter Base",
            "Bandra Reclamation Safe Depot", "Andheri Sports Complex Evac Center",
            "Dadar Central Relief Station", "Sion Municipal High School Shelter",
            "Goregaon Disaster Response Center", "Chembur Public Relief Camp",
            "Colaba Coastal Evacuation Point", "Malad Community Safe Post"
        ],
        "food_banks": [
            "Bandra Central Community Kitchen", "Dadar Relief Distribution Depot",
            "Kurla Food Relief Storehouse", "Andheri Community Ration Hub",
            "Sion Relief Supply Station", "Worli Community Food Bank"
        ],
        "medical_camps": [
            "Andheri Central Medical Post", "Sion Trauma & Flood Clinic",
            "KEM Hospital Emergency Field Post", "Bandra Coastal Triage Center",
            "Kurla Medical Response Camp"
        ]
    },
    "bhubaneswar": {
        "shelters": [
            "Kalinga Stadium Cyclone Refuge", "Saheed Nagar Community Evacuation Base",
            "Chandrasekharpur Disaster Shelter", "Nayapalli High School Relief Center",
            "Baramunda Bus Terminal Refuge", "Patia Community Safe Haven",
            "Old Town Heritage Relief Station", "Khandagiri Relief Center"
        ],
        "food_banks": [
            "Odisha State Central Relief Kitchen", "Saheed Nagar Grain & Ration Depot",
            "Patia Emergency Food Supply", "Baramunda Community Food Hub",
            "Nayapalli Relief Meal Center"
        ],
        "medical_camps": [
            "AIIMS Bhubaneswar Trauma Field Post", "Capital Hospital Emergency Clinic",
            "KIMS Disaster Medicine Camp", "Patia Rapid Triage Post"
        ]
    },
    "kolkata": {
        "shelters": [
            "Salt Lake Stadium Evacuation Center", "Howrah Railway Relief Shelter",
            "Ballygunge Cultural Safe Zone", "New Town Community Disaster Depot",
            "Alipore Municipal Refuge", "Dum Dum Relief Complex",
            "Tollygunge Community Safe Base", "Behala Emergency Shelter"
        ],
        "food_banks": [
            "Howrah Community Central Kitchen", "Park Circus Relief Distribution",
            "Salt Lake Grain Distribution Hub", "Sealdah Emergency Food Base",
            "Behala Community Meal Post"
        ],
        "medical_camps": [
            "Park Street Emergency Medical Post", "SSKM Hospital Triage Station",
            "Salt Lake Rapid Medical Unit", "Howrah Field Trauma Clinic"
        ]
    },
    "wellington": {
        "shelters": [
            "Westpac Stadium Regional Evac Center", "Te Papa Waterfront Safe Zone",
            "Thorndon Community Transit Depot", "Mount Victoria Emergency Base",
            "Karori Recreation Center", "Miramar Peninsula Relief Hub",
            "Johnsonville Community Safe Hub", "Newtown Public Relief Station"
        ],
        "food_banks": [
            "Queens Wharf Supply Kitchen", "Lambton Quay Relief Storehouse",
            "Newtown Community Aid Hub", "Kilbirnie Emergency Food Depot",
            "Thorndon Food Distribution Post"
        ],
        "medical_camps": [
            "Wellington Regional Hospital Trauma Post", "Oriental Bay Coastal Triage Post",
            "Interislander Ferry Port Medical Unit", "Miramar Medical Emergency Base"
        ]
    }
}


def calculate_elevation(lat: float, lng: float, region_id: str) -> float:
    """Calculate realistic synthetic elevation based on geography and coastlines."""
    reg = REGIONS[region_id]
    
    if region_id == "chennai":
        # Coast is to the east (lng ~ 80.285)
        dist_from_coast = max(0.0, reg["coast_lng"] - lng)
        base = 0.8 + dist_from_coast * 55.0 + random.uniform(-0.5, 0.8)
        return round(max(0.5, min(22.0, base)), 1)
        
    elif region_id == "mumbai":
        # Coast is to the west (lng ~ 72.815)
        dist_from_coast = max(0.0, lng - reg["coast_lng"])
        base = 1.2 + dist_from_coast * 40.0 + random.uniform(-0.6, 1.0)
        return round(max(0.8, min(28.0, base)), 1)
        
    elif region_id == "bhubaneswar":
        # Inland elevated plateau
        base = 32.0 + (lat - 20.20) * 45.0 + random.uniform(-3.0, 4.0)
        return round(max(20.0, min(65.0, base)), 1)
        
    elif region_id == "kolkata":
        # Gangetic delta, low flat terrain
        base = 2.5 + (lat - 22.45) * 8.0 + random.uniform(-0.5, 1.2)
        return round(max(1.0, min(12.0, base)), 1)
        
    elif region_id == "wellington":
        # Harbor coastal basin surrounded by hills
        harbor_lat, harbor_lng = -41.285, 174.780
        dist_sq = (lat - harbor_lat) ** 2 + (lng - harbor_lng) ** 2
        if dist_sq < 0.0003:
            base = 1.5 + random.uniform(0.2, 1.8)
        else:
            base = 4.0 + dist_sq * 3500.0 + random.uniform(-2.0, 10.0)
        return round(max(1.0, min(190.0, base)), 1)
        
    return round(random.uniform(2.0, 15.0), 1)


def generate_resources():
    """Generate comprehensive realistic synthetic relief resources across all regions."""
    all_resources = []
    
    id_prefixes = {
        "chennai": ("SH", "FB", "MC", 1),
        "mumbai": ("SH", "FB", "MC", 101),
        "bhubaneswar": ("SH", "FB", "MC", 201),
        "kolkata": ("SH", "FB", "MC", 301),
        "wellington": ("WN", "WF", "WM", 1),
    }
    
    for region_id, reg_cfg in REGIONS.items():
        sh_pre, fb_pre, mc_pre, start_idx = id_prefixes[region_id]
        names = FACILITY_NAMES[region_id]
        
        # 1. Shelters
        for idx, name in enumerate(names["shelters"]):
            rid = f"{sh_pre}{start_idx + idx:03d}" if region_id != "wellington" else f"{sh_pre}{idx + 1:03d}"
            lat = round(random.uniform(*reg_cfg["lat_range"]), 4)
            lng = round(random.uniform(*reg_cfg["lng_range"]), 4)
            elev = calculate_elevation(lat, lng, region_id)
            capacity = random.choice([150, 200, 250, 300, 350, 400, 500, 750, 1000])
            
            all_resources.append({
                "id": rid,
                "type": "shelter",
                "name": name,
                "lat": lat,
                "lng": lng,
                "elevation_m": elev,
                "capacity": capacity,
                "current_occupancy": 0,
                "status": "online",
                "contact": f"+91-44-{random.randint(20000000, 99999999)}" if region_id != "wellington" else f"+64-4-{random.randint(2000000, 9999999)}",
                "address": f"{name.split(' ')[0]} Sector, {reg_cfg['name']}",
                "region": region_id,
            })
            
        # 2. Food Banks
        for idx, name in enumerate(names["food_banks"]):
            rid = f"{fb_pre}{start_idx + idx:03d}" if region_id != "wellington" else f"{fb_pre}{idx + 1:03d}"
            lat = round(random.uniform(*reg_cfg["lat_range"]), 4)
            lng = round(random.uniform(*reg_cfg["lng_range"]), 4)
            elev = calculate_elevation(lat, lng, region_id)
            daily_meals = random.choice([300, 450, 500, 600, 800, 1200, 1800, 2500])
            
            all_resources.append({
                "id": rid,
                "type": "food_bank",
                "name": name,
                "lat": lat,
                "lng": lng,
                "elevation_m": elev,
                "daily_meals": daily_meals,
                "status": "online",
                "contact": f"+91-44-{random.randint(20000000, 99999999)}" if region_id != "wellington" else f"+64-4-{random.randint(2000000, 9999999)}",
                "address": f"{name.split(' ')[0]} Hub, {reg_cfg['name']}",
                "region": region_id,
            })
            
        # 3. Medical Camps
        specialities = ["general", "emergency", "trauma", "pediatric"]
        for idx, name in enumerate(names["medical_camps"]):
            rid = f"{mc_pre}{start_idx + idx:03d}" if region_id != "wellington" else f"{mc_pre}{idx + 1:03d}"
            lat = round(random.uniform(*reg_cfg["lat_range"]), 4)
            lng = round(random.uniform(*reg_cfg["lng_range"]), 4)
            elev = calculate_elevation(lat, lng, region_id)
            beds = random.choice([25, 30, 40, 50, 60, 75, 100, 150])
            
            all_resources.append({
                "id": rid,
                "type": "medical_camp",
                "name": name,
                "lat": lat,
                "lng": lng,
                "elevation_m": elev,
                "beds": beds,
                "speciality": specialities[idx % len(specialities)],
                "status": "online",
                "contact": f"+91-44-{random.randint(20000000, 99999999)}" if region_id != "wellington" else f"+64-4-{random.randint(2000000, 9999999)}",
                "address": f"{name.split(' ')[0]} Medical Ward, {reg_cfg['name']}",
                "region": region_id,
            })
            
    return all_resources


def float_range(start: float, stop: float, step: float):
    """Generate floating-point numbers from start to stop with step increment."""
    current = start
    while current <= stop + 1e-9:
        yield current
        current += step


def generate_elevation_grids(data_dir: str):
    """Generate dense DEM elevation grids (CSV format) for each region."""
    step = 0.004  # ~400m spatial sampling resolution
    
    for region_id, reg_cfg in REGIONS.items():
        csv_filename = os.path.join(data_dir, f"elevation_{region_id}.csv")
        
        rows = []
        for lat in float_range(reg_cfg["lat_range"][0], reg_cfg["lat_range"][1], step):
            for lng in float_range(reg_cfg["lng_range"][0], reg_cfg["lng_range"][1], step):
                elev = calculate_elevation(lat, lng, region_id)
                rows.append({
                    "lat": round(lat, 4),
                    "lng": round(lng, 4),
                    "elevation_m": elev
                })
                
        with open(csv_filename, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["lat", "lng", "elevation_m"])
            writer.writeheader()
            writer.writerows(rows)
            
        print(f"Generated {len(rows)} DEM points for {region_id} -> {csv_filename}")


def main():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Generate resources.json
    resources = generate_resources()
    json_path = os.path.join(data_dir, "resources.json")
    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(resources, f, indent=2)
    print(f"Successfully generated {len(resources)} resources -> {json_path}")
    
    # 2. Generate elevation CSVs
    generate_elevation_grids(data_dir)
    print("All synthetic datasets generated successfully.")


if __name__ == "__main__":
    main()
