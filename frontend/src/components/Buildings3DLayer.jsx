import { useMemo } from 'react';
import { PolygonLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// Buildings3DLayer — Photorealistic 3D Urban Skyscrapers & Houses
//
// Models dense urban skylines and residential communities matching real coastal
// geography (inspired by Miami / Chennai / Mumbai coastal floodscapes).
// ─────────────────────────────────────────────────────────────────────────────

// Helper to generate rectangular building footprint polygon
function makeBuildingFootprint(centerLat, centerLng, widthMeters = 30, lengthMeters = 40, rotationDeg = 0) {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const latScale = 1 / 111000;
  const lngScale = 1 / (111000 * Math.cos((centerLat * Math.PI) / 180));

  const halfW = (widthMeters / 2) * lngScale;
  const halfL = (lengthMeters / 2) * latScale;

  const corners = [
    [-halfW, -halfL],
    [halfW, -halfL],
    [halfW, halfL],
    [-halfW, halfL],
  ];

  return corners.map(([x, y]) => {
    const rotX = x * cos - y * sin;
    const rotY = x * sin + y * cos;
    return [centerLng + rotX, centerLat + rotY];
  });
}

// Generates dense realistic 3D building clusters
export function generateRegionBuildings(region = 'chennai') {
  const buildings = [];

  let seed = 42891;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Coastal / Urban Sectors
  let sectors = [];

  if (region === 'chennai') {
    sectors = [
      // Downtown Coastal Skyscrapers (Marina & Santhome Waterfront)
      { name: 'Marina Waterfront High-Rises', lat: 13.0610, lng: 80.2816, baseElev: 1.2, count: 50, radiusM: 700, class: 'skyscraper' },
      { name: 'Adyar Bay Towers', lat: 13.0080, lng: 80.2600, baseElev: 2.1, count: 45, radiusM: 650, class: 'skyscraper' },
      // Mid-Rise Commercial & Civic
      { name: 'T. Nagar Commercial Hub', lat: 13.0418, lng: 80.2341, baseElev: 6.2, count: 55, radiusM: 800, class: 'midrise' },
      { name: 'Mylapore Cultural & Civic Quarter', lat: 13.0368, lng: 80.2676, baseElev: 3.4, count: 40, radiusM: 600, class: 'midrise' },
      { name: 'Anna Nagar Financial Corridor', lat: 13.0850, lng: 80.2101, baseElev: 4.5, count: 48, radiusM: 750, class: 'midrise' },
      // Dense Residential Lowlands (High flood vulnerability)
      { name: 'Velachery Residential Suburb', lat: 12.9815, lng: 80.2180, baseElev: 1.8, count: 65, radiusM: 950, class: 'houses' },
      { name: 'Besant Nagar Coastal Villas', lat: 12.9990, lng: 80.2680, baseElev: 1.6, count: 45, radiusM: 650, class: 'houses' },
      { name: 'Porur Heights Neighborhood', lat: 13.0358, lng: 80.1572, baseElev: 11.2, count: 40, radiusM: 800, class: 'houses' },
    ];
  } else if (region === 'mumbai') {
    sectors = [
      { name: 'Bandra-Kurla Complex (BKC) Towers', lat: 19.0650, lng: 72.8650, baseElev: 5.5, count: 60, radiusM: 800, class: 'skyscraper' },
      { name: 'Worli Coastal Skyscraper Corridor', lat: 19.0160, lng: 72.8180, baseElev: 4.2, count: 55, radiusM: 750, class: 'skyscraper' },
      { name: 'Dharavi Lowland Enclave', lat: 19.0400, lng: 72.8560, baseElev: 4.8, count: 70, radiusM: 900, class: 'houses' },
      { name: 'Kurla Mithi River Suburb', lat: 19.0728, lng: 72.8826, baseElev: 3.4, count: 65, radiusM: 850, class: 'houses' },
      { name: 'Andheri Commercial Axis', lat: 19.1136, lng: 72.8697, baseElev: 5.8, count: 50, radiusM: 750, class: 'midrise' },
    ];
  } else if (region === 'bhubaneswar') {
    sectors = [
      { name: 'Infocity Tech Towers', lat: 20.3550, lng: 85.8180, baseElev: 38.0, count: 45, radiusM: 800, class: 'skyscraper' },
      { name: 'Janpath Commercial Corridor', lat: 20.2961, lng: 85.8245, baseElev: 36.0, count: 55, radiusM: 850, class: 'midrise' },
      { name: 'Old Town Residential Quarter', lat: 20.2450, lng: 85.8320, baseElev: 32.0, count: 60, radiusM: 900, class: 'houses' },
    ];
  } else {
    // Kolkata
    sectors = [
      { name: 'Salt Lake Sector V Tech Skyline', lat: 22.5849, lng: 88.4250, baseElev: 3.5, count: 60, radiusM: 850, class: 'skyscraper' },
      { name: 'Park Street Financial Corridor', lat: 22.5531, lng: 88.3507, baseElev: 5.2, count: 50, radiusM: 750, class: 'midrise' },
      { name: 'Howrah Waterfront Settlements', lat: 22.5958, lng: 88.3142, baseElev: 3.9, count: 65, radiusM: 900, class: 'houses' },
    ];
  }

  sectors.forEach((sec) => {
    // Lay buildings along regular streets and avenues
    const gridCols = Math.ceil(Math.sqrt(sec.count * 1.3));
    const gridRows = Math.ceil(sec.count / gridCols);
    const spacingM = sec.class === 'skyscraper' ? 65 : sec.class === 'midrise' ? 50 : 38;

    let index = 0;
    for (let r = -gridRows / 2; r < gridRows / 2 && index < sec.count; r++) {
      for (let c = -gridCols / 2; c < gridCols / 2 && index < sec.count; c++) {
        index++;

        // Add street jitter
        const offsetX = c * spacingM + (rand() * 12 - 6);
        const offsetY = r * spacingM + (rand() * 12 - 6);

        const latScale = 1 / 111000;
        const lngScale = 1 / (111000 * Math.cos((sec.lat * Math.PI) / 180));

        const bLat = sec.lat + offsetY * latScale;
        const bLng = sec.lng + offsetX * lngScale;

        // Realistic dimensions based on building class
        let widthM, lengthM, heightM, colorTheme;

        if (sec.class === 'skyscraper') {
          widthM = 32 + rand() * 26;
          lengthM = 36 + rand() * 32;
          heightM = 55 + rand() * 85; // 55m to 140m skyscraper!
          colorTheme = rand() > 0.4 ? 'glass-tower' : 'steel-tower';
        } else if (sec.class === 'midrise') {
          widthM = 26 + rand() * 22;
          lengthM = 30 + rand() * 24;
          heightM = 22 + rand() * 38; // 22m to 60m
          colorTheme = rand() > 0.5 ? 'concrete-midrise' : 'modern-commercial';
        } else {
          // Residential houses
          widthM = 16 + rand() * 14;
          lengthM = 20 + rand() * 16;
          heightM = 8 + rand() * 12; // 8m to 20m (1-4 stories)
          colorTheme = rand() > 0.4 ? 'residential-warm' : 'residential-terracotta';
        }

        const rot = (Math.floor(rand() * 4) * 45) + (rand() * 10 - 5);
        const elev = Math.max(0.4, Number((sec.baseElev + (rand() * 1.8 - 0.9)).toFixed(1)));

        buildings.push({
          id: `BLD-${region.toUpperCase()}-${buildings.length + 1}`,
          name: `${sec.name} · Unit ${index}`,
          type: sec.class,
          theme: colorTheme,
          polygon: makeBuildingFootprint(bLat, bLng, widthM, lengthM, rot),
          center: [bLng, bLat],
          elevation_m: elev,
          height_m: Math.round(heightM),
          floors: Math.max(1, Math.round(heightM / 3.4)),
        });
      }
    }
  });

  return buildings;
}

// Distance helper (km)
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// useBuildings3DLayer Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useBuildings3DLayer({
  region = 'chennai',
  waterLevel = 0,
  disasterType = 'flood',
  cycloneEye = null,
  cycloneRadius = 0,
  visible = true,
  onHoverBuilding = null,
  onClickBuilding = null,
}) {
  const buildingsData = useMemo(() => generateRegionBuildings(region), [region]);

  return useMemo(() => {
    if (!visible || !buildingsData.length) return null;

    return new PolygonLayer({
      id: `buildings-3d-${region}`,
      data: buildingsData,
      pickable: true,
      stroked: true,
      filled: true,
      wireframe: true,
      extruded: true,
      getPolygon: (d) => d.polygon,
      getElevation: (d) => d.height_m,
      elevationScale: 1.15,
      getLineWidth: 1.2,
      lineWidthMinPixels: 1,

      // ── Shading & Inundation Physics (Matches real flood aerial view) ──
      getFillColor: (d) => {
        // 1. Flood Inundation Physics
        if (disasterType === 'flood' && waterLevel > 0) {
          const submergedDepth = waterLevel - d.elevation_m;
          if (submergedDepth > 0) {
            // Completely underwater (roof is covered by flood water)
            if (submergedDepth >= d.height_m) {
              return [18, 55, 120, 160]; // Deep water refraction blue
            }
            // Partially submerged (water rising around base and lower floors)
            return [234, 88, 12, 230]; // Critical flood alert orange
          }
        }

        // 2. Cyclone Wind Damage Physics
        if (disasterType === 'cyclone' && cycloneEye && cycloneRadius > 0) {
          const [bLng, bLat] = d.center;
          const dist = distanceKm(cycloneEye.lat, cycloneEye.lng, bLat, bLng);
          if (dist <= cycloneRadius) {
            if (dist <= cycloneRadius * 0.35) {
              return [220, 38, 38, 240]; // Catastrophic eyewall damage
            }
            return [249, 115, 22, 220]; // Gale-force wind impact
          }
        }

        // 3. Normal Photorealistic Architectural Shading
        switch (d.theme) {
          case 'glass-tower':
            return [225, 235, 245, 250]; // Bright reflective glass
          case 'steel-tower':
            return [205, 215, 225, 250]; // Steel/slate corporate facade
          case 'concrete-midrise':
            return [230, 226, 218, 250]; // Modern civic concrete
          case 'modern-commercial':
            return [240, 238, 232, 250]; // Cream commercial stone
          case 'residential-terracotta':
            return [225, 175, 155, 250]; // Terracotta/clay roof
          default:
            return [238, 234, 224, 250]; // Warm residential plaster
        }
      },

      getLineColor: (d) => {
        if (disasterType === 'flood' && waterLevel > d.elevation_m) {
          return [56, 189, 248, 255]; // Luminous water-line highlight
        }
        if (disasterType === 'cyclone' && cycloneEye && cycloneRadius > 0) {
          const [bLng, bLat] = d.center;
          const dist = distanceKm(cycloneEye.lat, cycloneEye.lng, bLat, bLng);
          if (dist <= cycloneRadius) return [239, 68, 68, 255];
        }
        return [140, 145, 155, 180]; // Architectural edge highlight
      },

      material: {
        ambient: 0.5,
        diffuse: 0.75,
        shininess: 45,
        specularColor: [100, 110, 125],
      },

      updateTriggers: {
        getFillColor: [waterLevel, disasterType, cycloneEye, cycloneRadius],
        getLineColor: [waterLevel, disasterType, cycloneEye, cycloneRadius],
        getElevation: [buildingsData],
      },

      onHover: (info) => {
        if (onHoverBuilding) onHoverBuilding(info);
      },
      onClick: (info) => {
        if (onClickBuilding && info.object) onClickBuilding(info.object);
      },
    });
  }, [
    buildingsData,
    visible,
    region,
    waterLevel,
    disasterType,
    cycloneEye,
    cycloneRadius,
    onHoverBuilding,
    onClickBuilding,
  ]);
}

export default useBuildings3DLayer;
