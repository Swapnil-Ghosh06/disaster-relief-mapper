# 📊 Disaster Relief Data Dictionary

This directory contains synthetic and digital elevation model (DEM) datasets used by the Disaster Relief Resource Mapper backend.

---

## 1. Files Overview

| File | Type | Description |
|------|------|-------------|
| `resources.json` | JSON | Registry of all relief facilities (shelters, food banks, medical camps) |
| `elevation_chennai.csv` | CSV | 400m spatial resolution DEM grid for Chennai, Tamil Nadu |
| `elevation_mumbai.csv` | CSV | 400m spatial resolution DEM grid for Mumbai, Maharashtra |
| `elevation_bhubaneswar.csv` | CSV | 400m spatial resolution DEM grid for Bhubaneswar, Odisha |
| `elevation_kolkata.csv` | CSV | 400m spatial resolution DEM grid for Kolkata, West Bengal |
| `elevation_wellington.csv` | CSV | 400m spatial resolution DEM grid for Wellington Digital Twin |
| `generate_data.py` | Python | Reproducible script to regenerate all JSON and CSV datasets |

---

## 2. Resource Schema (`resources.json`)

Each object represents a relief asset with the following attributes:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique alphanumeric identifier | `"SH001"`, `"FB001"`, `"MC001"` |
| `type` | `string` | Facility category (`shelter`, `food_bank`, `medical_camp`) | `"shelter"` |
| `name` | `string` | Facility name | `"Anna Nagar Regional Evacuation Shelter"` |
| `lat` | `float` | Latitude coordinate (WGS84 decimal degrees) | `13.0850` |
| `lng` | `float` | Longitude coordinate (WGS84 decimal degrees) | `80.2101` |
| `elevation_m` | `float` | Elevation above mean sea level in meters | `4.2` |
| `capacity` | `int` (optional) | Max shelter occupancy (shelters only) | `250` |
| `daily_meals` | `int` (optional) | Max meal capacity per day (food banks only) | `500` |
| `beds` | `int` (optional) | Total inpatient beds (medical camps only) | `50` |
| `speciality` | `string` (optional) | Specialization (`general`, `emergency`, `trauma`, `pediatric`) | `"general"` |
| `status` | `string` | Operational state (`online`, `offline`, `damaged`) | `"online"` |
| `contact` | `string` | Emergency phone number | `"+91-44-23456789"` |
| `address` | `string` | Address or locality string | `"Anna Nagar Sector, Chennai, Tamil Nadu"` |
| `region` | `string` | Region identifier | `"chennai"` |

---

## 3. Elevation Grid Schema (`elevation_*.csv`)

CSV files contain spatial elevation points capturing regional topography:

```csv
lat,lng,elevation_m
12.9200,80.1200,9.6
12.9200,80.1240,9.4
12.9200,80.1280,9.2
...
```

- **Resolution:** ~0.004° step (~400m grid cell spacing)
- **Topographical Modeling:**
  - **Chennai & Mumbai:** Coastal gradient where elevation drops towards sea coastlines ($0.5\text{m} - 3.0\text{m}$ along shorelines, rising to $15\text{m} - 25\text{m}$ inland).
  - **Bhubaneswar:** Elevated plateau terrain ($25\text{m} - 55\text{m}$).
  - **Kolkata:** Low-lying Gangetic delta plain ($1.5\text{m} - 9.0\text{m}$).
  - **Wellington:** Harbor basin ($1.0\text{m} - 3.5\text{m}$) surrounded by steep hills ($30\text{m} - 190\text{m}$).

---

## 4. Regenerating Datasets

To regenerate all datasets from scratch:

```bash
python generate_data.py
```
