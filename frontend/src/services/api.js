// ─────────────────────────────────────────────
// API Service Layer
// All backend calls go through here — never
// call axios directly from components.
// ─────────────────────────────────────────────

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Mock data (used when backend is not yet running) ────────────────────────
const MOCK_RESOURCES = {
  chennai: [
    // Shelters
    { id: 'SH001', type: 'shelter', name: 'Anna Nagar Relief Shelter', lat: 13.0850, lng: 80.2101, elevation_m: 4.2, capacity: 250, status: 'online', region: 'chennai' },
    { id: 'SH002', type: 'shelter', name: 'Kilpauk Relief Center', lat: 13.0900, lng: 80.2300, elevation_m: 6.5, capacity: 180, status: 'online', region: 'chennai' },
    { id: 'SH003', type: 'shelter', name: 'Velachery Flood Camp', lat: 12.9815, lng: 80.2180, elevation_m: 1.8, capacity: 320, status: 'online', region: 'chennai' },
    { id: 'SH004', type: 'shelter', name: 'Tambaram Community Hall', lat: 12.9249, lng: 80.1000, elevation_m: 9.3, capacity: 150, status: 'online', region: 'chennai' },
    { id: 'SH005', type: 'shelter', name: 'Perambur Relief Hub', lat: 13.1180, lng: 80.2350, elevation_m: 5.7, capacity: 200, status: 'online', region: 'chennai' },
    { id: 'SH006', type: 'shelter', name: 'Adyar Evacuation Center', lat: 13.0050, lng: 80.2550, elevation_m: 2.1, capacity: 280, status: 'online', region: 'chennai' },
    { id: 'SH007', type: 'shelter', name: 'Mylapore Aid Station', lat: 13.0368, lng: 80.2676, elevation_m: 3.4, capacity: 175, status: 'online', region: 'chennai' },
    { id: 'SH008', type: 'shelter', name: 'Porur Emergency Shelter', lat: 13.0358, lng: 80.1572, elevation_m: 11.2, capacity: 220, status: 'online', region: 'chennai' },

    // Food Banks
    { id: 'FB001', type: 'food_bank', name: 'T Nagar Community Kitchen', lat: 13.0418, lng: 80.2341, elevation_m: 6.1, daily_meals: 500, status: 'online', region: 'chennai' },
    { id: 'FB002', type: 'food_bank', name: 'Besant Nagar Food Hub', lat: 12.9990, lng: 80.2680, elevation_m: 1.5, daily_meals: 350, status: 'online', region: 'chennai' },
    { id: 'FB003', type: 'food_bank', name: 'Egmore Relief Kitchen', lat: 13.0780, lng: 80.2590, elevation_m: 5.9, daily_meals: 600, status: 'online', region: 'chennai' },
    { id: 'FB004', type: 'food_bank', name: 'Chromepet Food Bank', lat: 12.9516, lng: 80.1462, elevation_m: 8.4, daily_meals: 400, status: 'online', region: 'chennai' },
    { id: 'FB005', type: 'food_bank', name: 'Nungambakkam Aid Center', lat: 13.0569, lng: 80.2425, elevation_m: 7.2, daily_meals: 450, status: 'online', region: 'chennai' },
    { id: 'FB006', type: 'food_bank', name: 'Sholinganallur Food Point', lat: 12.9010, lng: 80.2270, elevation_m: 2.3, daily_meals: 300, status: 'online', region: 'chennai' },

    // Medical Camps
    { id: 'MC001', type: 'medical_camp', name: 'Adyar Flood Medical Post', lat: 13.0012, lng: 80.2565, elevation_m: 2.8, beds: 50, speciality: 'general', status: 'online', region: 'chennai' },
    { id: 'MC002', type: 'medical_camp', name: 'Marina Coastal Clinic', lat: 13.0610, lng: 80.2816, elevation_m: 0.9, beds: 30, speciality: 'emergency', status: 'online', region: 'chennai' },
    { id: 'MC003', type: 'medical_camp', name: 'Tambaram Field Hospital', lat: 12.9270, lng: 80.1150, elevation_m: 10.1, beds: 75, speciality: 'trauma', status: 'online', region: 'chennai' },
    { id: 'MC004', type: 'medical_camp', name: 'Anna Nagar Medical Camp', lat: 13.0880, lng: 80.2150, elevation_m: 5.3, beds: 40, speciality: 'general', status: 'online', region: 'chennai' },
    { id: 'MC005', type: 'medical_camp', name: 'Velachery Health Post', lat: 12.9780, lng: 80.2200, elevation_m: 1.6, beds: 25, speciality: 'general', status: 'online', region: 'chennai' },
  ],
  mumbai: [
    { id: 'SH101', type: 'shelter', name: 'Dharavi Relief Camp', lat: 19.0400, lng: 72.8560, elevation_m: 5.1, capacity: 400, status: 'online', region: 'mumbai' },
    { id: 'SH102', type: 'shelter', name: 'Kurla Flood Center', lat: 19.0728, lng: 72.8826, elevation_m: 3.8, capacity: 250, status: 'online', region: 'mumbai' },
    { id: 'FB101', type: 'food_bank', name: 'Bandra Community Kitchen', lat: 19.0596, lng: 72.8295, elevation_m: 6.7, daily_meals: 600, status: 'online', region: 'mumbai' },
    { id: 'MC101', type: 'medical_camp', name: 'Andheri Medical Post', lat: 19.1136, lng: 72.8697, elevation_m: 4.2, beds: 60, speciality: 'general', status: 'online', region: 'mumbai' },
  ],
  bhubaneswar: [
    { id: 'SH201', type: 'shelter', name: 'Bhubaneswar Relief Hub', lat: 20.2961, lng: 85.8245, elevation_m: 38.0, capacity: 300, status: 'online', region: 'bhubaneswar' },
    { id: 'FB201', type: 'food_bank', name: 'Odisha Community Kitchen', lat: 20.3100, lng: 85.8100, elevation_m: 35.0, daily_meals: 450, status: 'online', region: 'bhubaneswar' },
    { id: 'MC201', type: 'medical_camp', name: 'Bhubaneswar Field Hospital', lat: 20.2800, lng: 85.8350, elevation_m: 40.0, beds: 80, speciality: 'trauma', status: 'online', region: 'bhubaneswar' },
  ],
  kolkata: [
    { id: 'SH301', type: 'shelter', name: 'Salt Lake Relief Camp', lat: 22.5849, lng: 88.4000, elevation_m: 3.5, capacity: 350, status: 'online', region: 'kolkata' },
    { id: 'FB301', type: 'food_bank', name: 'Howrah Community Kitchen', lat: 22.5958, lng: 88.3142, elevation_m: 4.1, daily_meals: 500, status: 'online', region: 'kolkata' },
    { id: 'MC301', type: 'medical_camp', name: 'Park Street Medical Post', lat: 22.5531, lng: 88.3507, elevation_m: 5.2, beds: 45, speciality: 'general', status: 'online', region: 'kolkata' },
  ],
};

const MOCK_REGIONS = [
  { id: 'chennai',     name: 'Chennai, Tamil Nadu',    center_lat: 13.0827, center_lng: 80.2707, zoom: 11, disaster_risk: ['flood', 'cyclone'] },
  { id: 'mumbai',      name: 'Mumbai, Maharashtra',    center_lat: 19.0760, center_lng: 72.8777, zoom: 11, disaster_risk: ['flood'] },
  { id: 'bhubaneswar', name: 'Bhubaneswar, Odisha',   center_lat: 20.2961, center_lng: 85.8245, zoom: 11, disaster_risk: ['cyclone', 'flood'] },
  { id: 'kolkata',     name: 'Kolkata, West Bengal',   center_lat: 22.5726, center_lng: 88.3639, zoom: 11, disaster_risk: ['flood', 'cyclone'] },
];

// ── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all resources for a given region.
 * Falls back to mock data if backend is unreachable.
 */
export async function fetchResources(region = 'chennai') {
  try {
    const res = await api.get('/resources', { params: { region } });
    return res.data.resources || [];
  } catch {
    console.warn('[API] Backend unreachable — using mock resource data');
    return MOCK_RESOURCES[region] || MOCK_RESOURCES.chennai;
  }
}

/**
 * Fetch elevation grid for a given region.
 */
export async function fetchElevation(region = 'chennai') {
  try {
    const res = await api.get('/elevation', { params: { region } });
    return res.data.grid || [];
  } catch {
    console.warn('[API] Backend unreachable — elevation data unavailable');
    return [];
  }
}

/**
 * Fetch available region configs.
 */
export async function fetchRegions() {
  try {
    const res = await api.get('/regions');
    return res.data.regions || [];
  } catch {
    console.warn('[API] Backend unreachable — using mock region data');
    return MOCK_REGIONS;
  }
}

/**
 * Run flood simulation for a region at a given water level.
 * @returns {{ offline: string[], online: string[], affected_capacity: number }}
 */
export async function simulateFlood({ region, water_level_m, resource_ids = [] }) {
  const res = await api.post('/flood/simulate', { region, water_level_m, resource_ids });
  return res.data;
}

/**
 * Run cyclone simulation.
 * @returns {{ damaged: string[], safe: string[], affected_capacity: number }}
 */
export async function simulateCyclone({ region, eye_lat, eye_lng, radius_km, severity }) {
  const res = await api.post('/cyclone/simulate', { region, eye_lat, eye_lng, radius_km, severity });
  return res.data;
}

/**
 * Get rerouting for a list of offline resource IDs.
 * @returns {{ routes: Route[] }}
 */
export async function fetchReroutes({ offline_ids, region }) {
  const res = await api.post('/reroute', { offline_ids, region });
  return res.data.routes || [];
}
