import { useMemo } from 'react';
import { GridCellLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic elevation grids per region
// Format: { lat_min, lat_max, lng_min, lng_max, step }
// Elevation formula models real coastal geography
// ─────────────────────────────────────────────────────────────────────────────

const REGION_GRIDS = {
  chennai: {
    lat_min: 12.90, lat_max: 13.20,
    lng_min: 80.10, lng_max: 80.34,
    step: 0.003,
    // Chennai: coast on east (high lng), rises westward
    elevation: (lat, lng) => {
      const coast_dist = (80.34 - lng) * 180; // metres approx
      const base = coast_dist * 0.055;
      // Marina beach area & Adyar estuary — very low
      const adyar_sink = lat > 13.00 && lat < 13.02 && lng > 80.25 ? -1.5 : 0;
      // Velachery / Pallikaranai marsh — low-lying even inland
      const marsh = lat > 12.97 && lat < 12.99 && lng > 80.20 && lng < 80.24 ? -2 : 0;
      // Noise for realism
      const noise = Math.sin(lat * 312) * 0.8 + Math.cos(lng * 289) * 0.6;
      return Math.max(0.2, base + adyar_sink + marsh + noise);
    },
  },
  mumbai: {
    lat_min: 18.90, lat_max: 19.25,
    lng_min: 72.78, lng_max: 72.99,
    step: 0.003,
    // Mumbai: peninsula surrounded by water on three sides, rises in centre
    elevation: (lat, lng) => {
      const dist_from_coast = Math.min(
        Math.abs(lng - 72.78),
        Math.abs(72.99 - lng),
        Math.abs(lat - 18.90)
      ) * 200;
      const base = dist_from_coast * 0.035;
      const dharavi = lat > 19.03 && lat < 19.06 && lng > 72.85 && lng < 72.88 ? -1 : 0;
      const noise = Math.sin(lat * 287) * 0.7 + Math.cos(lng * 301) * 0.5;
      return Math.max(0.3, base + dharavi + noise);
    },
  },
  bhubaneswar: {
    lat_min: 20.20, lat_max: 20.38,
    lng_min: 85.76, lng_max: 85.90,
    step: 0.003,
    // Bhubaneswar: elevated plateau city ~30-45m, less flood-prone
    elevation: (lat, lng) => {
      const base = 32 + Math.abs(lat - 20.30) * 40 + Math.abs(lng - 82.83) * 20;
      const noise = Math.sin(lat * 213) * 2 + Math.cos(lng * 198) * 1.5;
      return Math.max(28, base + noise);
    },
  },
  kolkata: {
    lat_min: 22.47, lat_max: 22.70,
    lng_min: 88.27, lng_max: 88.45,
    step: 0.003,
    // Kolkata: Ganges delta, extremely flat, 3-12m
    elevation: (lat, lng) => {
      const dist_hooghly = Math.abs(lng - 88.33) * 120;
      const base = 3 + dist_hooghly * 0.04;
      const noise = Math.sin(lat * 334) * 1.2 + Math.cos(lng * 312) * 0.9;
      return Math.max(0.5, base + noise);
    },
  },
};

/**
 * generateElevationGrid — creates a synthetic elevation grid for a region.
 * Returns an array of { lat, lng, elevation_m } objects.
 */
function generateElevationGrid(region) {
  const config = REGION_GRIDS[region] || REGION_GRIDS.chennai;
  const { lat_min, lat_max, lng_min, lng_max, step, elevation } = config;

  const grid = [];
  for (let lat = lat_min; lat <= lat_max; lat += step) {
    for (let lng = lng_min; lng <= lng_max; lng += step) {
      grid.push({
        lat:         parseFloat(lat.toFixed(5)),
        lng:         parseFloat(lng.toFixed(5)),
        elevation_m: parseFloat(elevation(lat, lng).toFixed(2)),
      });
    }
  }
  return grid;
}

// ─────────────────────────────────────────────────────────────────────────────
// useFloodLayer — returns the deck.gl GridCellLayer for flood visualization
//
// @param {string}  region      - active region ID
// @param {number}  waterLevel  - current water level in metres
// @param {boolean} visible     - whether the layer is shown
// ─────────────────────────────────────────────────────────────────────────────

export function useFloodLayer({ region = 'chennai', waterLevel = 0, visible = true }) {
  // Memoize grid — only regenerate on region change (expensive)
  const grid = useMemo(() => generateElevationGrid(region), [region]);

  const layer = useMemo(() => {
    if (!visible || waterLevel <= 0) return null;

    return new GridCellLayer({
      id: 'flood-water-layer',
      data: grid,
      cellSize: 320,               // ~320 metres per cell
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: (d) => {
        if (d.elevation_m >= waterLevel) return [0, 0, 0, 0]; // dry → transparent

        const depth  = waterLevel - d.elevation_m;            // metres underwater
        const alpha  = Math.min(210, Math.round(90 + depth * 22));
        // Shallow → cyan-blue;  Deep → deep indigo
        const r = Math.max(10,  Math.round(30  - depth * 2));
        const g = Math.max(50,  Math.round(140 - depth * 10));
        const b = Math.min(255, Math.round(220 + depth * 4));
        return [r, g, b, alpha];
      },
      getElevation: (d) => {
        if (d.elevation_m >= waterLevel) return 0;
        // Extrude water column height for 3D effect
        return (waterLevel - d.elevation_m) * 2.5;
      },
      extruded:       true,
      elevationScale: 1,
      pickable:       false,
      material: {
        ambient:  0.6,
        diffuse:  0.8,
        shininess: 60,
        specularColor: [100, 150, 255],
      },
      updateTriggers: {
        getFillColor: [waterLevel],
        getElevation: [waterLevel],
      },
      transitions: {
        getFillColor: 80,
        getElevation: 80,
      },
    });
  }, [grid, waterLevel, visible]);

  return layer;
}
