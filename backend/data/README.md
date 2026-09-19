# 📊 Disaster Relief Data Dictionary

This directory contains synthetic and digital elevation model (DEM) datasets used by the Disaster Relief Resource Mapper backend.

---

## 1. Files Overview

| File | Type | Description |
|------|------|-------------|
| `resources.json` | JSON | Registry of all relief facilities (shelters, food banks, medical camps) across 5 regions |
| `elevation_chennai.csv` | CSV | ~300m spatial resolution DEM grid for Chennai, Tamil Nadu |
| `elevation_mumbai.csv` | CSV | ~300m spatial resolution DEM grid for Mumbai, Maharashtra |
| `elevation_bhubaneswar.csv` | CSV | ~300m spatial resolution DEM grid for Bhubaneswar, Odisha |
| `elevation_kolkata.csv` | CSV | ~300m spatial resolution DEM grid for Kolkata, West Bengal |
| `elevation_wellington.csv` | CSV | ~300m spatial resolution DEM grid for Wellington Digital Twin |
| `generate_data.py` | Python | Reproducible script to regenerate all JSON and CSV datasets |

---

## 2. Resource Schema (`resources.json`)

Relief resources are categorized into three core functional facility types:

### A. Shelter Object (`type: "shelter"`)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier prefixed with `SH` (or `WN` for Wellington) | `"SH001"` |
| `type` | `string` | Facility type constant | `"shelter"` |
| `name` | `string` | Human-readable shelter name | `"Anna Nagar Regional Evacuation Shelter"` |
| `lat` | `float` | Latitude coordinate (WGS84 decimal degrees) | `13.0850` |
| `lng` | `float` | Longitude coordinate (WGS84 decimal degrees) | `80.2101` |
| `elevation_m` | `float` | Elevation in meters above sea level | `4.2` |
| `capacity` | `int` | Maximum accommodation headcount | `250` |
| `current_occupancy` | `int` | Current headcount sheltered | `0` |
| `status` | `string` | Operational state (`online`, `offline`, `damaged`) | `"online"` |
| `contact` | `string` | Emergency phone number | `"+91-44-23456789"` |
| `address` | `string` | Street / locality address | `"Anna Nagar Sector, Chennai, Tamil Nadu"` |
| `region` | `string` | Region identifier | `"chennai"` |

### B. Food Bank Object (`type: "food_bank"`)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier prefixed with `FB` (or `WF` for Wellington) | `"FB001"` |
| `type` | `string` | Facility type constant | `"food_bank"` |
| `name` | `string` | Facility name | `"T Nagar Community Central Kitchen"` |
| `lat` | `float` | Latitude coordinate (WGS84 decimal degrees) | `13.0418` |
| `lng` | `float` | Longitude coordinate (WGS84 decimal degrees) | `80.2341` |
| `elevation_m` | `float` | Ground elevation in meters | `6.1` |
| `daily_meals` | `int` | Maximum meal prep and delivery throughput per day | `500` |
| `status` | `string` | Operational state (`online`, `offline`, `damaged`) | `"online"` |
| `contact` | `string` | Dispatch phone number | `"+91-44-23456790"` |
| `address` | `string` | Distribution address | `"T Nagar Hub, Chennai, Tamil Nadu"` |
| `region` | `string` | Region identifier | `"chennai"` |

### C. Medical Camp Object (`type: "medical_camp"`)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | `string` | Unique identifier prefixed with `MC` (or `WM` for Wellington) | `"MC001"` |
| `type` | `string` | Facility type constant | `"medical_camp"` |
| `name` | `string` | Field clinic or hospital outpost name | `"Adyar Coastal Trauma Medical Post"` |
| `lat` | `float` | Latitude coordinate (WGS84 decimal degrees) | `13.0012` |
| `lng` | `float` | Longitude coordinate (WGS84 decimal degrees) | `80.2565` |
| `elevation_m` | `float` | Elevation in meters above sea level | `2.8` |
| `beds` | `int` | Available triage and inpatient beds | `50` |
| `speciality` | `string` | Specialization (`general`, `emergency`, `trauma`, `pediatric`) | `"trauma"` |
| `status` | `string` | Operational state (`online`, `offline`, `damaged`) | `"online"` |
| `contact` | `string` | Emergency medical dispatch phone | `"+91-44-23456791"` |
| `address` | `string` | Medical ward address | `"Adyar Medical Ward, Chennai, Tamil Nadu"` |
| `region` | `string` | Region identifier | `"chennai"` |

---

## 3. Elevation Grid Schema (`elevation_*.csv`)

CSV files contain spatial elevation points capturing regional topography:

```csv
lat,lng,elevation_m
12.9200,80.1200,9.6
12.9200,80.1230,9.4
12.9200,80.1260,9.2
...
```

- **Grid Resolution:** $\sim 0.003^\circ$ step ($\approx 300\text{m}$ grid node spacing)
- **Topographical Modeling:**
  - **Chennai & Mumbai:** Coastal gradient where elevation drops towards sea shorelines ($0.5\text{m} - 3.0\text{m}$ along coast, rising to $15\text{m} - 25\text{m}$ inland).
  - **Bhubaneswar:** Elevated inland plateau terrain ($25\text{m} - 55\text{m}$).
  - **Kolkata:** Low-lying Gangetic delta plain ($1.5\text{m} - 9.0\text{m}$).
  - **Wellington:** Coastal harbor basin ($1.0\text{m} - 3.5\text{m}$) surrounded by steep hills ($30\text{m} - 190\text{m}$).

---

## 4. Regenerating Datasets

To regenerate all datasets from scratch:

```bash
python data/generate_data.py
```
