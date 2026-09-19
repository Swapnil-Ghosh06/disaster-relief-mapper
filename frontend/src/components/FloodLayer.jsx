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
  wellington: {
    lat_min: -41.34, lat_max: -41.25,
    lng_min: 174.72, lng_max: 174.88,
    step: 0.0016,
    elevation: (lat, lng) => {
      // Wellington Harbour basin (center ~ -41.285, 174.80)
      const harborDist = Math.hypot(lat - (-41.285), lng - 174.80);
      if (harborDist < 0.04) return 0.2; // Sea level bay
      // Coastal foreshore (Lambton Quay, Thorndon, Oriental Bay)
      const coastDist = Math.hypot(lat - (-41.288), lng - 174.78);
      const base = coastDist * 180;
      return Math.max(0.4, base);
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
// useFloodLayer — Fluid Water Surface (Smooth Liquid Inundation)
// ─────────────────────────────────────────────────────────────────────────────
export function useFloodLayer({ region = 'wellington', waterLevel = 0, visible = true }) {
  const grid = useMemo(() => generateElevationGrid(region), [region]);

  return useMemo(() => {
    if (!visible || waterLevel <= 0) return null;

    // Filter to only areas submerged at current waterLevel
    const submergedCells = grid.filter((d) => d.elevation_m < waterLevel);
    if (!submergedCells.length) return null;

    return new GridCellLayer({
      id: `flood-water-mesh-${region}`,
      data: submergedCells,
      cellSize: 180,
      getPosition: (d) => [d.lng, d.lat],

      // Photorealistic Oceanic Water Tone (Deep sapphire to crystalline cyan)
      getFillColor: (d) => {
        const depth = waterLevel - d.elevation_m;
        // Deep water is rich navy/cerulean; shallow edge is glossy aquamarine
        const r = Math.max(8, Math.round(18 - depth * 1.2));
        const g = Math.min(185, Math.max(90, Math.round(115 + depth * 5)));
        const b = Math.min(245, Math.max(160, Math.round(180 + depth * 4)));
        const alpha = Math.min(210, Math.max(90, Math.round(110 + depth * 12)));

        return [r, g, b, alpha];
      },

      // Non-extruded flat liquid plane eliminates spiky Minecraft-style pillars
      extruded: false,
      pickable: false,

      material: {
        ambient: 0.8,
        diffuse: 0.9,
        shininess: 95,
        specularColor: [200, 235, 255],
      },

      updateTriggers: {
        getFillColor: [waterLevel],
        data: [waterLevel, region],
      },
    });
  }, [grid, waterLevel, visible, region]);
}

export default useFloodLayer;
