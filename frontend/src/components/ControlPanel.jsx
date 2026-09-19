import { motion } from 'framer-motion';
import * as Slider from '@radix-ui/react-slider';
import { REGION_LIST } from '../constants/regions';

// ─────────────────────────────────────────────────────────────────────────────
// ControlPanel — Left sidebar
// Phase 2: Real flood controls
// Phase 3: Real cyclone controls
// ─────────────────────────────────────────────────────────────────────────────

const SPEEDS = [
  { label: '0.5×', value: 0.5 },
  { label: '1×',   value: 1   },
  { label: '2×',   value: 2   },
  { label: '3×',   value: 3   },
];

const WIND_CAT_COLOR = {
  'TS':    '#b45309',
  'Cat 1': '#d97706',
  'Cat 2': '#ea580c',
  'Cat 3': '#dc2626',
  'Cat 4': '#b91c1c',
  'Cat 5': '#7f1d1d',
};

function ControlPanel({
  region, onRegionChange,
  disasterType, onDisasterTypeChange,
  // Flood
  waterLevel, targetLevel, onTargetLevelChange,
  // Cyclone
  cycloneRadius, targetRadius, onTargetRadiusChange,
  cycloneSeverity, onSeverityChange,
  cycloneEye,
  windSpeedKph, category,
  // Shared
  speed, onSpeedChange,
  isRunning, onToggleSimulation, onReset,
  // Layers
  layerVisibility, onLayerToggle,
}) {
  const isFlood   = disasterType === 'flood';
  const isCyclone = disasterType === 'cyclone';

  const simulateBtnLabel = isRunning
    ? '⏸ Pause'
    : (isFlood   && waterLevel  > 0) ? '▶ Resume'
    : (isCyclone && cycloneRadius > 0) ? '▶ Resume'
    : '▶ Simulate';

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ── Header ── */}
      <div className="sidebar-header">
        <h1>🛰 RELIEF OPS</h1>
        <div className="subtitle">Disaster Simulation Console</div>
      </div>

      <div className="sidebar-body">

        {/* ── Region ── */}
        <div className="section-label">Region</div>
        <select className="select" value={region} onChange={(e) => onRegionChange(e.target.value)}>
          {REGION_LIST.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* ── Disaster Type ── */}
        <div className="section-label">Disaster Type</div>
        <div className="toggle-group">
          <div className={`toggle-option ${isFlood ? 'active' : ''}`} onClick={() => onDisasterTypeChange('flood')}>
            🌊 Flood
          </div>
          <div className={`toggle-option ${isCyclone ? 'active' : ''}`} onClick={() => onDisasterTypeChange('cyclone')}>
            🌀 Cyclone
          </div>
        </div>

        {/* ════════════ FLOOD PARAMETERS ════════════ */}
        {isFlood && (
          <>
            <div className="section-label">Flood Parameters</div>

            <div className="slider-block">
              <div className="slider-header">
                <span className="slider-label">Max Water Level</span>
                <span className="slider-value">{targetLevel.toFixed(1)} m</span>
              </div>
              <Slider.Root className="slider-root" min={0} max={15} step={0.5}
                value={[targetLevel]} onValueChange={([v]) => onTargetLevelChange(v)}>
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range slider-range-flood" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb" aria-label="Water Level" />
              </Slider.Root>
              <div className="slider-marks"><span>0 m</span><span>7.5 m</span><span>15 m</span></div>
            </div>

            {waterLevel > 0 && (
              <div className="water-level-display">
                <span className="wl-icon">🌊</span>
                <span className="wl-label">Current</span>
                <span className="wl-value">{waterLevel.toFixed(2)} m</span>
                <div className="wl-bar-track">
                  <div className="wl-bar-fill" style={{ width: `${Math.min(100, (waterLevel / 15) * 100)}%` }} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════════ CYCLONE PARAMETERS ════════════ */}
        {isCyclone && (
          <>
            <div className="section-label">Cyclone Parameters</div>

            {/* Eye placement status */}
            <div className={`eye-status ${cycloneEye ? 'eye-placed' : 'eye-unset'}`}>
              {cycloneEye ? (
                <>
                  <span className="eye-icon">🌀</span>
                  <div>
                    <div className="eye-label">Eye Placed</div>
                    <div className="eye-coords">
                      {cycloneEye.lat.toFixed(3)}°N, {cycloneEye.lng.toFixed(3)}°E
                    </div>
                  </div>
                  <div className="eye-hint">Click map to move</div>
                </>
              ) : (
                <>
                  <span className="eye-icon">👆</span>
                  <div className="eye-label">Click map to place eye</div>
                </>
              )}
            </div>

            {/* Radius slider */}
            <div className="slider-block">
              <div className="slider-header">
                <span className="slider-label">Storm Radius</span>
                <span className="slider-value">{targetRadius} km</span>
              </div>
              <Slider.Root className="slider-root" min={5} max={80} step={5}
                value={[targetRadius]} onValueChange={([v]) => onTargetRadiusChange(v)}>
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range slider-range-cyclone" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb slider-thumb-cyclone" aria-label="Storm Radius" />
              </Slider.Root>
              <div className="slider-marks"><span>5 km</span><span>40 km</span><span>80 km</span></div>
            </div>

            {/* Severity slider */}
            <div className="slider-block">
              <div className="slider-header">
                <span className="slider-label">Severity</span>
                <span className="slider-value" style={{ color: WIND_CAT_COLOR[category] }}>
                  {category}
                </span>
              </div>
              <Slider.Root className="slider-root" min={1} max={10} step={1}
                value={[cycloneSeverity]} onValueChange={([v]) => onSeverityChange(v)}>
                <Slider.Track className="slider-track">
                  <Slider.Range className="slider-range slider-range-cyclone" />
                </Slider.Track>
                <Slider.Thumb className="slider-thumb slider-thumb-cyclone" aria-label="Severity" />
              </Slider.Root>
              <div className="slider-marks"><span>Dep.</span><span>Cat 3</span><span>Cat 5</span></div>
            </div>

            {/* Live metrics */}
            {cycloneRadius > 0 && (
              <div className="cyclone-metrics">
                <div className="cm-item">
                  <div className="cm-label">Radius</div>
                  <div className="cm-value">{cycloneRadius.toFixed(1)} km</div>
                </div>
                <div className="cm-divider" />
                <div className="cm-item">
                  <div className="cm-label">Winds</div>
                  <div className="cm-value" style={{ color: WIND_CAT_COLOR[category] }}>
                    {windSpeedKph} kph
                  </div>
                </div>
                <div className="cm-divider" />
                <div className="cm-item">
                  <div className="cm-label">Category</div>
                  <div className="cm-value" style={{ color: WIND_CAT_COLOR[category], fontWeight: 800 }}>
                    {category}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Simulation Speed (shared) ── */}
        <div className="section-label">Sim Speed</div>
        <div className="speed-group" style={{ marginBottom: 14 }}>
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              className={`speed-btn ${speed === s.value ? 'active' : ''}`}
              onClick={() => onSpeedChange(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="section-label">Controls</div>
        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={onToggleSimulation}
            disabled={isCyclone && !cycloneEye}
          >
            {simulateBtnLabel}
          </button>
          <button className="btn btn-secondary" onClick={onReset}>↺ Reset</button>
        </div>
        {isCyclone && !cycloneEye && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: -4, marginBottom: 8 }}>
            Place eye on map first
          </div>
        )}

        {/* ── Layer Toggles ── */}
        <div className="section-label">Map Layers</div>
        <div className="layer-toggles">
          <LayerToggle label="Shelters"      icon="🏠" color="#16a34a" active={layerVisibility?.shelters}     onClick={() => onLayerToggle('shelters')} />
          <LayerToggle label="Food Banks"    icon="🍱" color="#2563eb" active={layerVisibility?.foodBanks}    onClick={() => onLayerToggle('foodBanks')} />
          <LayerToggle label="Medical Camps" icon="🏥" color="#dc2626" active={layerVisibility?.medicalCamps} onClick={() => onLayerToggle('medicalCamps')} />
          {isFlood && (
            <LayerToggle label="Flood Water"   icon="🌊" color="#2563eb" active={layerVisibility?.floodWater}   onClick={() => onLayerToggle('floodWater')} />
          )}
          {isCyclone && (
            <LayerToggle label="Cyclone Field" icon="🌀" color="#ea580c" active={layerVisibility?.cycloneField} onClick={() => onLayerToggle('cycloneField')} />
          )}
          <LayerToggle label="Reroute Arcs"  icon="↗"  color="#059669" active={layerVisibility?.reroutes}      onClick={() => onLayerToggle('reroutes')} />
          <LayerToggle label="3D Buildings"  icon="🏢" color="#475569" active={layerVisibility?.buildings3D}   onClick={() => onLayerToggle('buildings3D')} />
        </div>

      </div>
    </motion.aside>
  );
}

function LayerToggle({ label, icon, color, active, onClick }) {
  return (
    <button
      className={`layer-toggle-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      style={active ? { borderColor: color, color: color } : {}}
    >
      <span className="lt-icon">{icon}</span>
      <span className="lt-label">{label}</span>
      <span className="lt-dot" style={{ background: active ? color : 'transparent', border: `2px solid ${active ? color : '#bfb9ad'}` }} />
    </button>
  );
}

export default ControlPanel;

