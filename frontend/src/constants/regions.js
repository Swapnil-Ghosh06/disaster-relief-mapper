// ─────────────────────────────────────────────
// Region Configurations
// 4 Indian cities with disaster vulnerability
// ─────────────────────────────────────────────

export const REGIONS = {
  chennai: {
    id:           'chennai',
    name:         'Chennai, Tamil Nadu',
    center_lat:   13.0827,
    center_lng:   80.2707,
    zoom:         11,
    pitch:        45,
    bearing:      0,
    disaster_risk: ['flood', 'cyclone'],
    description:  'Coastal city, high flood + cyclone risk',
  },
  mumbai: {
    id:           'mumbai',
    name:         'Mumbai, Maharashtra',
    center_lat:   19.0760,
    center_lng:   72.8777,
    zoom:         11,
    pitch:        45,
    bearing:      0,
    disaster_risk: ['flood'],
    description:  'Financial capital, severe monsoon flooding',
  },
  bhubaneswar: {
    id:           'bhubaneswar',
    name:         'Bhubaneswar, Odisha',
    center_lat:   20.2961,
    center_lng:   85.8245,
    zoom:         11,
    pitch:        45,
    bearing:      0,
    disaster_risk: ['cyclone', 'flood'],
    description:  'Cyclone-prone coastal state capital',
  },
  kolkata: {
    id:           'kolkata',
    name:         'Kolkata, West Bengal',
    center_lat:   22.5726,
    center_lng:   88.3639,
    zoom:         11,
    pitch:        45,
    bearing:      0,
    disaster_risk: ['flood', 'cyclone'],
    description:  'Delta city, extreme flood vulnerability',
  },
};

export const REGION_LIST = Object.values(REGIONS);

export const DEFAULT_REGION = REGIONS.chennai;

export default REGIONS;
