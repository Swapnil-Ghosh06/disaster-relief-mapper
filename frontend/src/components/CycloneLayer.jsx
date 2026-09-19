import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { PathLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// Coordinate helpers
// ─────────────────────────────────────────────────────────────────────────────

const DEG_PER_KM_LAT = 1 / 111.32;
function degPerKmLng(lat) { return 1 / (111.32 * Math.cos((lat * Math.PI) / 180)); }

/**
 * Offset a point by (dLat, dLng) in km.
 */
function offsetPoint(lat, lng, dLatKm, dLngKm) {
  return [
    lng + dLngKm * degPerKmLng(lat),
    lat + dLatKm * DEG_PER_KM_LAT,
  ];
}

/**
 * Generate a spiral arm path around a center point.
 * @param {object} center  - { lat, lng }
 * @param {number} maxR    - max radius in km
 * @param {number} startAngle - starting angle in radians
 * @param {number} turns   - how many full rotations
 * @param {number} n       - number of path vertices
 */
function spiralArm(center, maxR, startAngle, turns = 1.5, n = 80) {
  const path = [];
  for (let i = 0; i < n; i++) {
    const t     = i / (n - 1);
    const r     = maxR * t;
    const angle = startAngle + t * turns * 2 * Math.PI;
    const dLat  = r * Math.cos(angle);
    const dLng  = r * Math.sin(angle);
    path.push(offsetPoint(center.lat, center.lng, dLat, dLng));
  }
  return path;
}

// ─────────────────────────────────────────────────────────────────────────────
// useCycloneLayer — returns deck.gl layer array for cyclone visualization
//
// Layers (bottom → top):
//   1. Outer storm surge fill  — large diffuse circle
//   2. Rain band rings          — 3 concentric rings at 75%, 55%, 35% radius
//   3. Spiral arms (PathLayer) — 4 rotating spiral bands
//   4. Eyewall fill             — intense inner circle
//   5. Eye                      — small white calm center
// ─────────────────────────────────────────────────────────────────────────────

export function useCycloneLayer({ eyePosition, currentRadius, severity, rotation, visible }) {
  const layers = useMemo(() => {
    if (!visible || !eyePosition || currentRadius <= 0) return [];

    const { lat, lng } = eyePosition;
    const radiusM = currentRadius * 1000; // km → metres

    // ── Severity color intensity ──────────────────────────────────────────
    // sev 1 → amber; sev 10 → deep red
    const r = Math.round(180 + severity * 7.5);
    const g = Math.round(140 - severity * 13);
    const b = 30;

    // ── 1. Storm surge outer fill ─────────────────────────────────────────
    const surgeLayer = new ScatterplotLayer({
      id: 'cyclone-surge',
      data: [{ position: [lng, lat] }],
      getPosition: (d) => d.position,
      getRadius:   radiusM * 1.15,
      getFillColor: [r, g, b, 28],
      stroked: false,
      filled:  true,
      pickable: false,
    });

    // ── 2. Concentric rain band rings ─────────────────────────────────────
    const BANDS = [
      { frac: 1.00, alpha: 35, lineW: 1 },
      { frac: 0.75, alpha: 55, lineW: 2 },
      { frac: 0.50, alpha: 80, lineW: 2 },
      { frac: 0.30, alpha: 110, lineW: 3 },
    ];

    const bandLayers = BANDS.map(({ frac, alpha, lineW }, i) =>
      new ScatterplotLayer({
        id: `cyclone-band-${i}`,
        data: [{ position: [lng, lat] }],
        getPosition: (d) => d.position,
        getRadius:   radiusM * frac,
        getFillColor: [r, g, b, 0],
        getLineColor: [r, g, b, alpha],
        lineWidthMinPixels: lineW,
        stroked: true,
        filled:  false,
        pickable: false,
      })
    );

    // ── 3. Spiral arms (PathLayer, 4 arms, rotate with `rotation`) ────────
    const ARM_OFFSETS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const spiralLayers = ARM_OFFSETS.map((offset, i) => {
      const path = spiralArm(eyePosition, currentRadius * 0.95, rotation + offset, 1.5, 90);
      return new PathLayer({
        id: `cyclone-spiral-${i}`,
        data: [{ path }],
        getPath:       (d) => d.path,
        getColor:      [r, g, b, 150],
        getWidth:      i === 0 ? 2500 : 1800,  // metres
        widthMinPixels: i === 0 ? 2 : 1.5,
        capRounded:    true,
        jointRounded:  true,
        pickable:      false,
      });
    });

    // ── 4. Eyewall (dense inner ring) ─────────────────────────────────────
    const eyewallRadius = radiusM * 0.10;
    const eyewallLayer = new ScatterplotLayer({
      id: 'cyclone-eyewall',
      data: [{ position: [lng, lat] }],
      getPosition: (d) => d.position,
      getRadius:   eyewallRadius,
      getFillColor: [r, g, b, 180],
      getLineColor: [r, g, b, 255],
      lineWidthMinPixels: 3,
      stroked: true,
      filled:  true,
      pickable: false,
    });

    // ── 5. Eye (calm centre — white circle) ───────────────────────────────
    const eyeRadius = Math.max(2000, radiusM * 0.05);
    const eyeLayer = new ScatterplotLayer({
      id: 'cyclone-eye',
      data: [{ position: [lng, lat] }],
      getPosition: (d) => d.position,
      getRadius:   eyeRadius,
      getFillColor: [255, 252, 245, 220],
      getLineColor: [200, 180, 100, 255],
      lineWidthMinPixels: 2,
      stroked: true,
      filled:  true,
      pickable: false,
    });

    return [surgeLayer, ...bandLayers, ...spiralLayers, eyewallLayer, eyeLayer];
  }, [eyePosition, currentRadius, severity, rotation, visible]);

  return layers;
}
