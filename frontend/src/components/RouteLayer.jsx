import { useMemo } from 'react';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';

// ─────────────────────────────────────────────────────────────────────────────
// RouteLayer — deck.gl ArcLayer for alternative emergency relief paths
// Visualizes high-arc connections from offline nodes (red) to active hubs (green)
// ─────────────────────────────────────────────────────────────────────────────

export function useRouteLayer({ routes = [], visible = true, onRouteClick = null }) {
  return useMemo(() => {
    if (!visible || !routes || routes.length === 0) return [];

    // 1. Arc layer for dynamic 3D parabolas
    const arcLayer = new ArcLayer({
      id: 'relief-routes-arc',
      data: routes,
      pickable: true,
      greatCircle: true,
      getSourcePosition: (d) => [d.from_lng, d.from_lat, 5],
      getTargetPosition: (d) => [d.to_lng, d.to_lat, 5],
      getSourceColor: [220, 38, 38, 220],     // Red (offline source)
      getTargetColor: [22, 163, 74, 240],    // Green (online destination)
      getWidth: 3.5,
      getHeight: 0.35,
      tilt: 8,
      onClick: (info) => {
        if (info.object && onRouteClick) {
          onRouteClick(info.object);
        }
      },
      updateTriggers: {
        getSourcePosition: routes,
        getTargetPosition: routes,
      },
    });

    // 2. Halo glow arc layer (wider, lower opacity underneath for glowing neon look)
    const glowArcLayer = new ArcLayer({
      id: 'relief-routes-glow',
      data: routes,
      pickable: false,
      greatCircle: true,
      getSourcePosition: (d) => [d.from_lng, d.from_lat, 5],
      getTargetPosition: (d) => [d.to_lng, d.to_lat, 5],
      getSourceColor: [239, 68, 68, 80],
      getTargetColor: [34, 197, 94, 90],
      getWidth: 7,
      getHeight: 0.35,
      tilt: 8,
      updateTriggers: {
        getSourcePosition: routes,
        getTargetPosition: routes,
      },
    });

    // 3. Destination target rings to highlight safe receiver nodes
    const destinationRings = new ScatterplotLayer({
      id: 'relief-routes-dest-rings',
      data: routes,
      pickable: false,
      getPosition: (d) => [d.to_lng, d.to_lat, 10],
      getRadius: 160,
      radiusUnits: 'meters',
      stroked: true,
      filled: false,
      getLineColor: [22, 163, 74, 200],
      lineWidthMinPixels: 2,
      updateTriggers: {
        getPosition: routes,
      },
    });

    return [glowArcLayer, arcLayer, destinationRings];
  }, [routes, visible, onRouteClick]);
}

export default useRouteLayer;
