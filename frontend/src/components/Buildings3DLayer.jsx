import { useMemo } from 'react';
import { PolygonLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// Buildings3DLayer — 3D Extruded Urban Buildings & Houses
//
// Features:
// - Extruded 3D structures with elevation and physical height
// - Inundation physics: buildings submerge as waterLevel rises above ground elev
// - Cyclone physics: buildings within storm radius take wind/structural damage
// - Interactive hover tooltips & inspection
// ─────────────────────────────────────────────────────────────────────────────

// Helper to generate a small rectangular building footprint polygon
function makeBuildingPolygon(centerLat, centerLng, widthMeters = 35, lengthMeters = 45, rotationDeg = 0) {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Approximate degrees per meter at ~13-20 deg lat
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

// Generate realistic synthetic buildings for each region
export function generateRegionBuildings(region = 'chennai') {
  const buildings = [];

  // Seeded pseudo-random generator
  let seed = 12345;
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  if (region === 'chennai') {
    // Clusters around Marina, Adyar, Velachery, T. Nagar, Anna Nagar, Mylapore, Porur
    const clusters = [
      { name: 'Velachery Lowlands', centerLat: 12.9815, centerLng: 80.2180, baseElev: 1.8, count: 48, radiusM: 900, type: 'residential' },
      { name: 'Adyar River Basin', centerLat: 13.0050, centerLng: 80.2550, baseElev: 2.2, count: 42, radiusM: 800, type: 'residential' },
      { name: 'Marina Beachfront', centerLat: 13.0610, centerLng: 80.2816, baseElev: 1.1, count: 36, radiusM: 700, type: 'commercial' },
      { name: 'T. Nagar Central', centerLat: 13.0418, centerLng: 80.2341, baseElev: 6.2, count: 50, radiusM: 1000, type: 'commercial' },
      { name: 'Anna Nagar West', centerLat: 13.0850, centerLng: 80.2101, baseElev: 4.5, count: 45, radiusM: 900, type: 'residential' },
      { name: 'Mylapore Civic', centerLat: 13.0368, centerLng: 80.2676, baseElev: 3.5, count: 38, radiusM: 750, type: 'civic' },
      { name: 'Porur Heights', centerLat: 13.0358, centerLng: 80.1572, baseElev: 11.2, count: 35, radiusM: 900, type: 'commercial' },
    ];

    clusters.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const angle = pseudoRand() * Math.PI * 2;
        const dist = Math.sqrt(pseudoRand()) * c.radiusM;
        const latScale = 1 / 111000;
        const lngScale = 1 / (111000 * Math.cos((c.centerLat * Math.PI) / 180));

        const bLat = c.centerLat + Math.sin(angle) * dist * latScale;
        const bLng = c.centerLng + Math.cos(angle) * dist * lngScale;

        // Heights
        let heightM;
        let widthM = 20 + pseudoRand() * 25;
        let lengthM = 25 + pseudoRand() * 30;

        if (c.type === 'residential') {
          heightM = 8 + pseudoRand() * 16; // 2-6 floors
        } else if (c.type === 'commercial') {
          heightM = 22 + pseudoRand() * 45; // 7-20 floors
        } else {
          heightM = 14 + pseudoRand() * 20; // 4-8 floors
        }

        const rot = pseudoRand() * 90;
        const elev = Math.max(0.5, Number((c.baseElev + (pseudoRand() * 1.6 - 0.8)).toFixed(1)));

        buildings.push({
          id: `BLD-${region.toUpperCase()}-${buildings.length + 1}`,
          name: `${c.name} Sector #${i + 1}`,
          type: c.type,
          polygon: makeBuildingPolygon(bLat, bLng, widthM, lengthM, rot),
          center: [bLng, bLat],
          elevation_m: elev,
          height_m: Math.round(heightM),
          floors: Math.max(1, Math.round(heightM / 3.2)),
        });
      }
    });
  } else if (region === 'mumbai') {
    const clusters = [
      { name: 'Dharavi Sector', centerLat: 19.0400, centerLng: 72.8560, baseElev: 4.8, count: 60, radiusM: 900, type: 'residential' },
      { name: 'Kurla Mithi Basin', centerLat: 19.0728, centerLng: 72.8826, baseElev: 3.5, count: 55, radiusM: 800, type: 'residential' },
      { name: 'Bandra Coastal', centerLat: 19.0596, centerLng: 72.8295, baseElev: 6.5, count: 45, radiusM: 900, type: 'commercial' },
      { name: 'Andheri Hub', centerLat: 19.1136, centerLng: 72.8697, baseElev: 4.2, count: 50, radiusM: 850, type: 'commercial' },
    ];

    clusters.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const angle = pseudoRand() * Math.PI * 2;
        const dist = Math.sqrt(pseudoRand()) * c.radiusM;
        const latScale = 1 / 111000;
        const lngScale = 1 / (111000 * Math.cos((c.centerLat * Math.PI) / 180));

        const bLat = c.centerLat + Math.sin(angle) * dist * latScale;
        const bLng = c.centerLng + Math.cos(angle) * dist * lngScale;

        const heightM = c.type === 'commercial' ? 30 + pseudoRand() * 50 : 12 + pseudoRand() * 24;
        const elev = Math.max(0.8, Number((c.baseElev + (pseudoRand() * 1.5 - 0.75)).toFixed(1)));

        buildings.push({
          id: `BLD-${region.toUpperCase()}-${buildings.length + 1}`,
          name: `${c.name} Unit #${i + 1}`,
          type: c.type,
          polygon: makeBuildingPolygon(bLat, bLng, 25 + pseudoRand() * 20, 30 + pseudoRand() * 25, pseudoRand() * 90),
          center: [bLng, bLat],
          elevation_m: elev,
          height_m: Math.round(heightM),
          floors: Math.max(1, Math.round(heightM / 3.2)),
        });
      }
    });
  } else {
    // Generic generator for Bhubaneswar, Kolkata, etc.
    const centerLat = region === 'bhubaneswar' ? 20.2961 : 22.5726;
    const centerLng = region === 'bhubaneswar' ? 85.8245 : 88.3639;
    const baseElev = region === 'bhubaneswar' ? 35.0 : 3.8;

    for (let i = 0; i < 120; i++) {
      const angle = pseudoRand() * Math.PI * 2;
      const dist = Math.sqrt(pseudoRand()) * 2200;
      const latScale = 1 / 111000;
      const lngScale = 1 / (111000 * Math.cos((centerLat * Math.PI) / 180));

      const bLat = centerLat + Math.sin(angle) * dist * latScale;
      const bLng = centerLng + Math.cos(angle) * dist * lngScale;

      const heightM = 10 + pseudoRand() * 32;
      const elev = Math.max(1.0, Number((baseElev + (pseudoRand() * 2 - 1)).toFixed(1)));

      buildings.push({
        id: `BLD-${region.toUpperCase()}-${i + 1}`,
        name: `${region.toUpperCase()} Urban Block #${i + 1}`,
        type: i % 3 === 0 ? 'commercial' : 'residential',
        polygon: makeBuildingPolygon(bLat, bLng, 25 + pseudoRand() * 20, 30 + pseudoRand() * 20, pseudoRand() * 90),
        center: [bLng, bLat],
        elevation_m: elev,
        height_m: Math.round(heightM),
        floors: Math.max(1, Math.round(heightM / 3.2)),
      });
    }
  }

  return buildings;
}

// Distance helper
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
      elevationScale: 1.2,
      getLineWidth: 1,
      lineWidthMinPixels: 1,

      // ── Dynamic Color Logic with Inundation & Cyclone Physics ──
      getFillColor: (d) => {
        // 1. Flood Inundation Physics
        if (disasterType === 'flood' && waterLevel > 0) {
          const submergedDepth = waterLevel - d.elevation_m;
          if (submergedDepth > 0) {
            // Completely underwater
            if (submergedDepth >= d.height_m) {
              return [30, 90, 230, 190]; // Deep water blue
            }
            // Partially flooded ground floor
            return [234, 88, 12, 220]; // Flooding alert orange
          }
        }

        // 2. Cyclone Wind Damage Physics
        if (disasterType === 'cyclone' && cycloneEye && cycloneRadius > 0) {
          const [bLng, bLat] = d.center;
          const dist = distanceKm(cycloneEye.lat, cycloneEye.lng, bLat, bLng);
          if (dist <= cycloneRadius) {
            if (dist <= cycloneRadius * 0.35) {
              return [220, 38, 38, 230]; // Core damage red
            }
            return [249, 115, 22, 210]; // High wind amber
          }
        }

        // 3. Normal dry state: Architectural warm tones
        if (d.type === 'commercial') {
          return [218, 222, 228, 235]; // Modern steel/glass tone
        }
        if (d.type === 'civic') {
          return [230, 220, 205, 235]; // Warm stone tone
        }
        return [226, 220, 210, 230]; // Residential brick/cream
      },

      getLineColor: (d) => {
        if (disasterType === 'flood' && waterLevel > d.elevation_m) {
          return [59, 130, 246, 255];
        }
        if (disasterType === 'cyclone' && cycloneEye && cycloneRadius > 0) {
          const [bLng, bLat] = d.center;
          const dist = distanceKm(cycloneEye.lat, cycloneEye.lng, bLat, bLng);
          if (dist <= cycloneRadius) return [239, 68, 68, 255];
        }
        return [160, 150, 138, 200];
      },

      material: {
        ambient: 0.45,
        diffuse: 0.65,
        shininess: 32,
        specularColor: [60, 64, 67],
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
