import { useState, useEffect, useCallback } from 'react';
import TopNav from './components/TopNav';
import MapView from './components/MapView';
import SmartCityStatsCard from './components/SmartCityStatsCard';
import VerticalTimeScrubber from './components/VerticalTimeScrubber';
import InfoPanel from './components/InfoPanel';
import SitRepModal from './components/SitRepModal';
import ShortcutsModal from './components/ShortcutsModal';
import { useResourceMarkers, ResourcePopup } from './components/ResourceMarkers';
import { useFloodLayer } from './components/FloodLayer';
import { useCycloneLayer } from './components/CycloneLayer';
import { useRouteLayer } from './components/RouteLayer';
import { useFloodSimulation } from './hooks/useFloodSimulation';
import { useCycloneSimulation } from './hooks/useCycloneSimulation';
import { useRerouting } from './hooks/useRerouting';
import { fetchResources } from './services/api';
import './index.css';

// ─────────────────────────────────────────────────────────────────────────────
// App — Disaster Relief Digital Twin (Emergency Operations Center)
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  // ── Region & disaster ──────────────────────────────────────────────────
  const [region,          setRegion]          = useState('wellington');
  const [disasterType,    setDisasterType]    = useState('flood');
  const [activeCategory,  setActiveCategory]  = useState('transport');
  const [isDispatchOpen,  setIsDispatchOpen]  = useState(false);
  const [is3DMode,        setIs3DMode]        = useState(true);

  // ── Layer visibility ───────────────────────────────────────────────────
  const [layerVisibility, setLayerVisibility] = useState({
    shelters:     true,
    foodBanks:    true,
    medicalCamps: true,
    floodWater:   true,
    cycloneField: true,
    reroutes:     true,
  });

  // ── Data ───────────────────────────────────────────────────────────────
  const [resources,  setResources]  = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);

  // ── UI Modals & Popups ─────────────────────────────────────────────────
  const [selectedResource,  setSelectedResource]  = useState(null);
  const [hoveredBuilding,   setHoveredBuilding]   = useState(null);
  const [offlineIds,        setOfflineIds]         = useState([]);
  const [isSitRepOpen,      setIsSitRepOpen]       = useState(false);
  const [isShortcutsOpen,   setIsShortcutsOpen]    = useState(false);

  // ── Flood Simulation ───────────────────────────────────────────────────
  const flood = useFloodSimulation({
    resources,
    onOfflineChange: (ids) => {
      if (disasterType === 'flood') setOfflineIds(ids);
    },
  });

  // ── Cyclone Simulation ─────────────────────────────────────────────────
  const cyclone = useCycloneSimulation({
    resources,
    onOfflineChange: (ids) => {
      if (disasterType === 'cyclone') setOfflineIds(ids);
    },
  });

  // ── Rerouting Engine (Phase 4) ─────────────────────────────────────────
  const { routes } = useRerouting({
    resources,
    offlineIds,
    region,
  });

  // ── Load resources on region change ───────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setOfflineIds([]);
    setSelectedResource(null);
    flood.reset();
    cyclone.reset();

    fetchResources(region)
      .then(setResources)
      .catch(console.error)
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  // ── Reset on disaster type switch ──────────────────────────────────────
  useEffect(() => {
    flood.reset();
    cyclone.reset();
    setOfflineIds([]);
  }, [disasterType]); // eslint-disable-line

  // ── Map click handler ──────────────────────────────────────────────────
  const handleMapClick = useCallback(
    ({ lat, lng }) => {
      if (disasterType === 'cyclone') {
        cyclone.setEyePosition({ lat, lng });
      }
    },
    [disasterType, cyclone]
  );

  // ── Unified simulate toggle ────────────────────────────────────────────
  const handleToggleSimulation = useCallback(() => {
    if (disasterType === 'flood')   flood.toggle();
    if (disasterType === 'cyclone') cyclone.toggle();
  }, [disasterType, flood, cyclone]);

  // ── Unified reset ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    flood.reset();
    cyclone.reset();
    setOfflineIds([]);
    setSelectedResource(null);
  }, [flood, cyclone]);

  // ── 1-Click Scenario Preset Runner ─────────────────────────────────────
  const handleSelectScenario = useCallback(
    (scenario) => {
      handleReset();
      setRegion(scenario.region);
      setDisasterType(scenario.disasterType);

      setTimeout(() => {
        if (scenario.disasterType === 'flood') {
          flood.setTargetLevel(scenario.targetLevel || 6);
          flood.setSpeed(scenario.speed || 2);
          setTimeout(() => flood.start(), 300);
        } else if (scenario.disasterType === 'cyclone') {
          if (scenario.eye) cyclone.setEyePosition(scenario.eye);
          if (scenario.targetRadius) cyclone.setTargetRadius(scenario.targetRadius);
          if (scenario.severity) cyclone.setSeverity(scenario.severity);
          if (scenario.speed) cyclone.setSpeed(scenario.speed);
          setTimeout(() => cyclone.start(), 300);
        }
      }, 400);
    },
    [handleReset, flood, cyclone]
  );

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleSimulation();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        setDisasterType('flood');
      } else if (e.key === 'c' || e.key === 'C') {
        setDisasterType('cyclone');
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const speedMap = { '1': 0.5, '2': 1, '3': 2, '4': 3 };
        const s = speedMap[e.key];
        if (disasterType === 'flood') flood.setSpeed(s);
        else cyclone.setSpeed(s);
      } else if (e.key === 's' || e.key === 'S') {
        setIsSitRepOpen((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSitRepOpen(false);
        setIsShortcutsOpen(false);
        setSelectedResource(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSimulation, handleReset, disasterType, flood, cyclone]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    total:   resources.length,
    offline: offlineIds.length,
    affectedCapacity: resources
      .filter((r) => offlineIds.includes(r.id))
      .reduce((sum, r) => sum + (r.capacity || r.daily_meals || r.beds || 0), 0),
    activeReroutes: routes.length,
  };

  const isActive = offlineIds.length > 0 || flood.waterLevel > 0 || cyclone.currentRadius > 0;
  const severity = disasterType === 'flood'
    ? Math.round((flood.waterLevel / 15) * 10)
    : cyclone.severity;

  // ── Build deck.gl layers ───────────────────────────────────────────────
  const markerLayers = useResourceMarkers({
    resources,
    offlineIds,
    layerVisibility,
    onMarkerClick: setSelectedResource,
  });

  const floodLayer = useFloodLayer({
    region,
    waterLevel: disasterType === 'flood' ? flood.waterLevel : 0,
    visible:    disasterType === 'flood' && layerVisibility.floodWater,
  });

  const cycloneLayers = useCycloneLayer({
    eyePosition:   cyclone.eyePosition,
    currentRadius: disasterType === 'cyclone' ? cyclone.currentRadius : 0,
    severity:      cyclone.severity,
    rotation:      cyclone.rotation,
    visible:       disasterType === 'cyclone' && layerVisibility.cycloneField,
  });

  const routeLayers = useRouteLayer({
    routes,
    visible: layerVisibility.reroutes,
    onRouteClick: (rt) => {
      const dest = resources.find((r) => r.id === rt.to_id);
      if (dest) setSelectedResource(dest);
    },
  });

  const deckLayers = [
    floodLayer,
    ...cycloneLayers,
    ...routeLayers,
    ...markerLayers,
  ].filter(Boolean);

  const isRunning = disasterType === 'flood' ? flood.isRunning : cyclone.isRunning;

  return (
    <div className="digital-twin-app-root">
      {/* ── Fullscreen Photorealistic 3D Map Viewport ─────────────────── */}
      <div className="fullscreen-map-viewport">
        {isLoading && (
          <div className="loading-overlay">
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 11, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                LOADING 3D DIGITAL TWIN {region.toUpperCase()}…
              </div>
            </div>
          </div>
        )}

        <MapView
          region={region}
          layers={deckLayers}
          onMapClick={handleMapClick}
          hoveredBuilding={hoveredBuilding}
        />

        {selectedResource && (
          <ResourcePopup
            resource={selectedResource}
            offline={offlineIds.includes(selectedResource.id)}
            onClose={() => setSelectedResource(null)}
          />
        )}

        {/* Cyclone eye placement hint */}
        {disasterType === 'cyclone' && !cyclone.eyePosition && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            background: 'rgba(10, 22, 35, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(234, 88, 12, 0.5)',
            borderRadius: 8, padding: '10px 20px',
            fontSize: 11, color: '#fb923c',
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            🌀 Click map to place cyclone eye
          </div>
        )}
      </div>

      {/* ── Floating Top Navigation (Screenshot 5 Header) ─────────────── */}
      <TopNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          if (['summary', 'shelters', 'fleet', 'corridors', 'marine'].includes(cat)) {
            setIsDispatchOpen(true);
          }
        }}
        onSelectScenario={handleSelectScenario}
        onOpenReport={() => setIsSitRepOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onToggle3D={() => setIs3DMode((v) => !v)}
        is3D={is3DMode}
        onToggleSim={handleToggleSimulation}
        isRunning={isRunning}
        offlineCount={offlineIds.length}
        onToggleDispatch={() => setIsDispatchOpen((v) => !v)}
        isDispatchOpen={isDispatchOpen}
      />

      {/* ── Floating Left Statistics HUD Card (Screenshot 5 Left Card) ── */}
      <SmartCityStatsCard
        region={region}
        onRegionChange={setRegion}
        disasterType={disasterType}
        onDisasterTypeChange={setDisasterType}
        waterLevel={flood.waterLevel}
        targetLevel={flood.targetLevel}
        onTargetLevelChange={flood.setTargetLevel}
        cycloneRadius={cyclone.currentRadius}
        targetRadius={cyclone.targetRadius}
        onTargetRadiusChange={cyclone.setTargetRadius}
        isRunning={isRunning}
        onToggleSimulation={handleToggleSimulation}
        onReset={handleReset}
        stats={stats}
        offlineCount={offlineIds.length}
      />

      {/* ── Floating Right Vertical Scrubber (Screenshot 5 Right Slider) ─ */}
      <VerticalTimeScrubber
        value={disasterType === 'flood' ? flood.waterLevel : cyclone.currentRadius}
        max={disasterType === 'flood' ? 15 : 80}
        min={0}
        step={0.5}
        unit={disasterType === 'flood' ? 'm' : 'km'}
        label={disasterType === 'flood' ? 'SURGE' : 'RADIUS'}
        onChange={(v) => {
          if (disasterType === 'flood') flood.setTargetLevel(v);
          else cyclone.setTargetRadius(v);
        }}
      />

      {/* ── Sliding Dispatch Drawer ───────────────────────────────────── */}
      <InfoPanel
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        stats={stats}
        routes={routes}
        resources={resources}
        offlineIds={offlineIds}
        disasterType={isActive ? disasterType : null}
        severity={severity}
        region={region}
        onSelectResource={setSelectedResource}
        onOpenReport={() => setIsSitRepOpen(true)}
      />

      {/* ── Situation Report Modal ────────────────────────────────────── */}
      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
        region={region}
        disasterType={disasterType}
        severity={severity}
        resources={resources}
        offlineIds={offlineIds}
        routes={routes}
        waterLevel={flood.waterLevel}
        cyclone={cyclone}
      />

      {/* ── Shortcuts Modal ───────────────────────────────────────────── */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SimHUD — shared map overlay for flood & cyclone live status
// ─────────────────────────────────────────────────────────────────────────────
function SimHUD({ icon, label, color, valueLine, progress, targetLabel, countValue, countLabel, isRunning }) {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(245,242,235,0.94)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${color}44`,
      borderRadius: 10, padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 20,
      zIndex: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
      pointerEvents: 'none', minWidth: 340,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: isRunning ? color : '#bfb9ad',
        boxShadow: isRunning ? `0 0 0 3px ${color}33` : 'none' }} />

      <div>
        <div style={{ fontSize: 10, color: '#888880', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {valueLine}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#888880', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          <span>0</span><span>{targetLabel}</span>
        </div>
        <div style={{ height: 4, background: '#d6d0c4', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, progress * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 100, transition: 'width 80ms ease' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: countValue > 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}>
          {countValue}
        </div>
        <div style={{ fontSize: 9, color: '#888880', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {countLabel}
        </div>
      </div>
    </div>
  );
}

export default App;
