import { useState, useCallback, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { REGIONS } from '../constants/regions';
import { MAP_STYLES } from '../constants/mapStyles';

// ─────────────────────────────────────────────────────────────────────────────
// Photorealistic 3D Sun & Ambient Lighting
// Replicates the aerial sunlight angle and specular water gloss from satellite photos
// ─────────────────────────────────────────────────────────────────────────────
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.4,
});

const sunLight = new DirectionalLight({
  color: [255, 250, 240],
  intensity: 2.2,
  direction: [-1.4, -2.8, -2.0],
  _shadow: true,
});

const lightingEffect = new LightingEffect({ ambientLight, sunLight });

/**
 * MapView — 3D Interactive Disaster Relief Map
 *
 * Features:
 * - MapLibre GL integration with mapLib={maplibregl}
 * - Real 3D camera view with pitch (up to 65°) & bearing rotation
 * - 3D/2D perspective toggle
 * - Togglable base map styles
 * - Interactive building hover HUD
 */
function MapView({
  region = 'chennai',
  layers = [],
  onMapClick,
  hoveredBuilding = null,
  children,
}) {
  const regionConfig = REGIONS[region] || REGIONS.chennai;

  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [is3DMode, setIs3DMode] = useState(true);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const orbitRafRef = useRef(null);

  const [viewState, setViewState] = useState({
    latitude:  regionConfig.center_lat,
    longitude: regionConfig.center_lng,
    zoom:      regionConfig.zoom,
    pitch:     55,
    bearing:   -20,
  });

  // Sync view when region changes
  const [prevRegion, setPrevRegion] = useState(region);
  if (region !== prevRegion) {
    setPrevRegion(region);
    setViewState({
      latitude:  regionConfig.center_lat,
      longitude: regionConfig.center_lng,
      zoom:      regionConfig.zoom,
      pitch:     is3DMode ? 55 : 0,
      bearing:   is3DMode ? -20 : 0,
    });
  }

  // 3D Orbit camera animation
  useEffect(() => {
    if (!isOrbiting) {
      if (orbitRafRef.current) cancelAnimationFrame(orbitRafRef.current);
      return;
    }

    let lastTime = performance.now();
    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setViewState((vs) => ({
        ...vs,
        bearing: (vs.bearing + dt * 14) % 360,
      }));
      orbitRafRef.current = requestAnimationFrame(loop);
    };

    orbitRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (orbitRafRef.current) cancelAnimationFrame(orbitRafRef.current);
    };
  }, [isOrbiting]);

  const handleToggle3D = useCallback(() => {
    setIs3DMode((prev) => {
      const next = !prev;
      setViewState((vs) => ({
        ...vs,
        pitch: next ? 55 : 0,
        bearing: next ? -20 : 0,
      }));
      return next;
    });
  }, []);

  const handleZoom = useCallback((delta) => {
    setViewState((vs) => ({
      ...vs,
      zoom: Math.min(18, Math.max(3, vs.zoom + delta)),
    }));
  }, []);

  const handleResetCompass = useCallback(() => {
    setViewState((vs) => ({
      ...vs,
      bearing: 0,
      pitch: is3DMode ? 55 : 0,
    }));
  }, [is3DMode]);

  const handleMapClick = useCallback(
    (info) => {
      if (!onMapClick) return;
      if (info.coordinate) {
        const [lng, lat] = info.coordinate;
        onMapClick({ lat, lng });
      }
    },
    [onMapClick]
  );

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs)}
        controller={{
          dragPan:   true,
          dragRotate: true,
          scrollZoom: true,
          touchZoom:  true,
          keyboard:   true,
          doubleClickZoom: true,
        }}
        layers={layers}
        effects={[lightingEffect]}
        onClick={handleMapClick}
        getCursor={({ isDragging }) => (isDragging ? 'grabbing' : 'grab')}
      >
        <Map
          mapLib={maplibregl}
          reuseMaps
          {...viewState}
          mapStyle={MAP_STYLES[activeStyleIndex].style}
          attributionControl={false}
        />

        {children}
      </DeckGL>

      {/* Floating 3D Camera Controls Bar — Top Right of Map */}
      <div className="map-floating-controls">
        <button
          className={`map-tool-btn ${is3DMode ? 'active' : ''}`}
          onClick={handleToggle3D}
          title={is3DMode ? 'Switch to Top-down 2D' : 'Switch to 3D Isometric View'}
        >
          {is3DMode ? '3D VIEW' : '2D FLAT'}
        </button>

        <button
          className={`map-tool-btn ${isOrbiting ? 'active' : ''}`}
          onClick={() => setIsOrbiting((prev) => !prev)}
          title="Orbit Camera Around Sector"
        >
          {isOrbiting ? '⏹ STOP ORBIT' : '↻ ORBIT'}
        </button>

        <button className="map-tool-btn" onClick={() => handleZoom(1)} title="Zoom In">
          +
        </button>
        <button className="map-tool-btn" onClick={() => handleZoom(-1)} title="Zoom Out">
          −
        </button>
        <button className="map-tool-btn" onClick={handleResetCompass} title="Reset North">
          🧭
        </button>

        {/* Map Style Selector */}
        <select
          className="map-style-select"
          value={activeStyleIndex}
          onChange={(e) => setActiveStyleIndex(Number(e.target.value))}
        >
          {MAP_STYLES.map((s, idx) => (
            <option key={s.id} value={idx}>
              🗺️ {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hovered Building Inspection HUD */}
      {hoveredBuilding && (
        <div className="building-hover-hud">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              🏢 {hoveredBuilding.name}
            </span>
            <span style={{ fontSize: 9, background: '#ede8dc', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', fontWeight: 700 }}>
              {hoveredBuilding.type}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Physical Height: {hoveredBuilding.height_m}m ({hoveredBuilding.floors} floors) · Ground Elev: {hoveredBuilding.elevation_m}m
          </div>
        </div>
      )}

      {/* Coordinates HUD — bottom center */}
      <CoordHUD viewState={viewState} is3D={is3DMode} />
    </div>
  );
}

/**
 * CoordHUD — Shows lat/lng/zoom/pitch in a small bottom-center overlay.
 */
function CoordHUD({ viewState, is3D }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(245, 242, 235, 0.94)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(191, 185, 173, 0.6)',
      borderRadius: 6,
      padding: '4px 14px',
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      color: '#555550',
      pointerEvents: 'none',
      zIndex: 5,
      display: 'flex',
      gap: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      <span>LAT {viewState.latitude?.toFixed(4)}</span>
      <span>LNG {viewState.longitude?.toFixed(4)}</span>
      <span>ZOOM {viewState.zoom?.toFixed(1)}</span>
      <span>PITCH {Math.round(viewState.pitch ?? 0)}°</span>
      <span>BEARING {Math.round(viewState.bearing ?? 0)}°</span>
      <span style={{ color: '#16a34a', fontWeight: 700 }}>{is3D ? '● 3D VIEW' : '○ 2D FLAT'}</span>
    </div>
  );
}

export default MapView;
