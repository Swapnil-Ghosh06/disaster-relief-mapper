// ─────────────────────────────────────────────
// Region Configurations
// 4 Indian cities with disaster vulnerability
// ─────────────────────────────────────────────

export const REGIONS = {
  wellington: {
    id:           'wellington',
    name:         'Wellington (Digital Twin Inspo)',
    center_lat:   -41.2865,
    center_lng:   174.7762,
    zoom:         12.6,
    pitch:        60,
    bearing:      22,
    disaster_risk: ['flood', 'cyclone'],
    description:  'Coastal harbor smart city with 3D mountain terrain (Screenshot 5 inspo)',
  },
  chennai: {
    id:           'chennai',
    name:         'Chennai, Tamil Nadu',
    center_lat:   13.0827,
    center_lng:   80.2707,
    zoom:         11.8,
    pitch:        58,
    bearing:      -15,
    disaster_risk: ['flood', 'cyclone'],
    description:  'Coastal city, high flood + cyclone risk',
  },
  mumbai: {
    id:           'mumbai',
    name:         'Mumbai, Maharashtra',
    center_lat:   19.0760,
    center_lng:   72.8777,
    zoom:         11.8,
    pitch:        58,
    bearing:      -15,
    disaster_risk: ['flood'],
    description:  'Financial capital, severe monsoon flooding',
  },
  bhubaneswar: {
    id:           'bhubaneswar',
    name:         'Bhubaneswar, Odisha',
    center_lat:   20.2961,
    center_lng:   85.8245,
    zoom:         11.8,
    pitch:        55,
    bearing:      0,
    disaster_risk: ['cyclone', 'flood'],
    description:  'Cyclone-prone coastal state capital',
  },
  kolkata: {
    id:           'kolkata',
    name:         'Kolkata, West Bengal',
    center_lat:   22.5726,
    center_lng:   88.3639,
    zoom:         11.8,
    pitch:        55,
    bearing:      0,
    disaster_risk: ['flood', 'cyclone'],
    description:  'Delta city, extreme flood vulnerability',
  },
};

export const REGION_LIST = Object.values(REGIONS);

export const DEFAULT_REGION = REGIONS.wellington;

export default REGIONS;

