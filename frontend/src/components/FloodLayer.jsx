import { useMemo } from 'react';
import { GridCellLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// Regional Elevation Grids
// Realistic terrain model with coastal shelves, estuaries, river basins, and depressions
// ─────────────────────────────────────────────────────────────────────────────

const REGION_GRIDS = {
  chennai: {
    lat_min: 12.92, lat_max: 13.16,
    lng_min: 80.12, lng_max: 80.32,
    step: 0.0018, // High-res grid for smooth fluid pooling
    elevation: (lat, lng) => {
      // Coastline on East (~80.29 - 80.32), rising westward
      const coastDist = Math.max(0, (80.31 - lng) * 160);
      const base = coastDist * 0.06;

      // Adyar & Cooum River waterways + Estuary (low elevation sink)
      const isRiverCorridor = (lat > 13.00 && lat < 13.02 && lng > 80.23) || (lat > 13.065 && lat < 13.08 && lng > 80.24);
      const riverSink = isRiverCorridor ? -2.2 : 0;

      // Velachery & Pallikaranai Marshland (deep natural depression)
      const isMarsh = lat > 12.965 && lat < 13.00 && lng > 80.19 && lng < 80.235;
      const marshSink = isMarsh ? -2.8 : 0;

      // Marina coastal beachfront (sub-2m ground)
      const isBeach = lng > 80.275 && lat > 13.02 && lat < 13.08;
      const beachSink = isBeach ? -1.4 : 0;

      // Micro-terrain noise
      const terrainNoise = Math.sin(lat * 380) * 0.6 + Math.cos(lng * 340) * 0.5;

      return Math.max(0.3, base + riverSink + marshSink + beachSink + terrainNoise);
    },
  },
  mumbai: {
    lat_min: 18.96, lat_max: 19.20,
    lng_min: 72.80, lng_max: 72.96,
    step: 0.0018,
    elevation: (lat, lng) => {
      const distFromCoast = Math.min(
        Math.abs(lng - 72.80),
        Math.abs(72.96 - lng),
        Math.abs(lat - 18.96)
      ) * 180;
      const base = distFromCoast * 0.045;

      // Mithi river corridor & Dharavi/Kurla sink
      const mithiSink = lat > 19.03 && lat < 19.08 && lng > 72.84 && lng < 72.89 ? -2.5 : 0;
      const noise = Math.sin(lat * 320) * 0.5 + Math.cos(lng * 300) * 0.4;
      return Math.max(0.3, base + mithiSink + noise);
    },
  },
  bhubaneswar: {
    lat_min: 20.22, lat_max: 20.36,
    lng_min: 85.78, lng_max: 85.88,
    step: 0.002,
    elevation: (lat, lng) => {
      const base = 32 + Math.abs(lat - 20.29) * 35 + Math.abs(lng - 85.83) * 20;
      const noise = Math.sin(lat * 260) * 1.5 + Math.cos(lng * 240) * 1.2;
      return Math.max(28, base + noise);
    },
  },
  kolkata: {
    lat_min: 22.50, lat_max: 22.64,
    lng_min: 88.30, lng_max: 88.44,
    step: 0.0018,
    elevation: (lat, lng) => {
      const distHooghly = Math.abs(lng - 88.34) * 120;
      const base = 2.8 + distHooghly * 0.04;
      const noise = Math.sin(lat * 360) * 0.8 + Math.cos(lng * 320) * 0.6;
      return Math.max(0.4, base + noise);
    },
  },
};

function generateElevationGrid(region) {
  const config = REGION_GRIDS[region] || REGION_GRIDS.chennai;
  const { lat_min, lat_max, lng_min, lng_max, step, elevation } = config;

  const grid = [];
  for (let lat = lat_min; lat <= lat_max; lat += step) {
    for (let lng = lng_min; lng <= lng_max; lng += step) {
      grid.push({
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
        elevation_m: parseFloat(elevation(lat, lng).toFixed(2)),
      });
    }
  }
  return grid;
}

// ─────────────────────────────────────────────────────────────────────────────
// useFloodLayer — Photorealistic 3D Inundation Fluid Mesh
// ─────────────────────────────────────────────────────────────────────────────
export function useFloodLayer({ region = 'chennai', waterLevel = 0, visible = true }) {
  const grid = useMemo(() => generateElevationGrid(region), [region]);

  return useMemo(() => {
    if (!visible || waterLevel <= 0) return null;

    // Filter to only cells that are submerged at current waterLevel
    const submergedCells = grid.filter((d) => d.elevation_m < waterLevel);
    if (!submergedCells.length) return null;

    return new GridCellLayer({
      id: `flood-water-mesh-${region}`,
      data: submergedCells,
      cellSize: 195, // High resolution smooth continuous water plane
      getPosition: (d) => [d.lng, d.lat],

      // Photorealistic Oceanic / Storm Surge Water Shading (matches inspiration image)
      getFillColor: (d) => {
        const depth = waterLevel - d.elevation_m;
        // Deep water: rich oceanic navy; Shallow shore/street: translucent cyan
        const r = Math.max(12, Math.round(28 - depth * 1.5));
        const g = Math.min(160, Math.max(65, Math.round(110 + depth * 3)));
        const b = Math.min(240, Math.max(170, Math.round(180 + depth * 4)));
        const alpha = Math.min(235, Math.round(160 + depth * 12));

        return [r, g, b, alpha];
      },

      // Water surface height rises in real 3D
      getElevation: (d) => {
        const depth = waterLevel - d.elevation_m;
        return depth * 2.8;
      },

      extruded: true,
      elevationScale: 1,
      pickable: false,

      material: {
        ambient: 0.65,
        diffuse: 0.85,
        shininess: 90,
        specularColor: [180, 220, 255], // Water surface specular shimmer
      },

      updateTriggers: {
        getFillColor: [waterLevel],
        getElevation: [waterLevel],
        data: [waterLevel, region],
      },
    });
  }, [grid, waterLevel, visible, region]);
}

export default useFloodLayer;
