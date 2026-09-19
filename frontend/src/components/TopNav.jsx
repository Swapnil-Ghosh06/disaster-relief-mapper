import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TopNav — Wellington Smart City Digital Twin Header (Matching Screenshot 5)
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'transport', label: 'Transport', icon: '🚆' },
  { id: 'summary',   label: 'Summary',   icon: '📊' },
  { id: 'fleet',     label: 'Fleet Evac',icon: '🚗' },
  { id: 'rescue',    label: 'Rescue',    icon: '🚴' },
  { id: 'shelters',  label: 'Shelters',  icon: '🏢' },
  { id: 'corridors', label: 'Corridors', icon: '🛣️' },
  { id: 'marine',    label: 'Marine',    icon: '⚓' },
  { id: 'air',       label: 'Air Lift',  icon: '✈️' },
];

export const PRESET_SCENARIOS = [
  {
    id: 'wellington-surge',
    title: 'Wellington Harbor 8m Surge (Digital Twin)',
    region: 'wellington',
    disasterType: 'flood',
    targetLevel: 8.0,
    speed: 2,
    description: 'Harbor storm surge inundating Lambton Quay & waterfront transit',
  },
  {
    id: 'chennai-flood-2015',
    title: 'Chennai 2015 Historic Flood',
    region: 'chennai',
    disasterType: 'flood',
    targetLevel: 6.8,
    speed: 2,
    description: 'Catastrophic urban inundation across Adyar & Velachery basins',
  },
  {
    id: 'cyclone-vardah',
    title: 'Cyclone Vardah (Cat 4)',
    region: 'chennai',
    disasterType: 'cyclone',
    eye: { lat: 13.06, lng: 80.28 },
    targetRadius: 42,
    severity: 7,
    speed: 2,
    description: 'Severe cyclonic storm landfall along Marina coastal corridor',
  },
  {
    id: 'mumbai-monsoon',
    title: 'Mumbai Mithi River Surge',
    region: 'mumbai',
    disasterType: 'flood',
    targetLevel: 5.5,
    speed: 2,
    description: 'Critical flooding in Kurla & Dharavi low-elevation sectors',
  },
  {
    id: 'cyclone-fani',
    title: 'Cyclone Fani (Super Cyclone)',
    region: 'bhubaneswar',
    disasterType: 'cyclone',
    eye: { lat: 20.29, lng: 85.82 },
    targetRadius: 65,
    severity: 9,
    speed: 3,
    description: 'Extremely severe cyclone impacting Odisha relief infrastructure',
  },
];

export function TopNav({
  activeCategory = 'transport',
  onSelectCategory,
  onSelectScenario,
  onOpenReport,
  onOpenShortcuts,
  onToggle3D,
  is3D = true,
  onToggleSim,
  isRunning = false,
  offlineCount = 0,
  onToggleDispatch,
  isDispatchOpen = false,
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="digital-twin-header">
      {/* Left: Category tabs matching Screenshot 5 */}
      <div className="header-left-nav">
        <div className="active-category-pill">
          {activeCategory === 'transport' ? 'Transport' : activeCategory.toUpperCase()}
        </div>

        <div className="category-icons-group">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-icon-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory?.(cat.id)}
              title={cat.label}
            >
              <span className="cat-emoji">{cat.icon}</span>
              <span className="cat-text">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Brand & Mission title matching Screenshot 5 */}
      <div className="header-center-branding">
        <div className="twin-title">Tō Tātou Pōneke · Disaster Relief Digital Twin</div>
        <div className="twin-subtitle">SMART CITY RESILIENCE TECHNOLOGIES</div>
      </div>

      {/* Right: Quick circular action tools matching Screenshot 5 */}
      <div className="header-right-tools">
        {/* Scenario dropdown */}
        <select
          className="twin-scenario-select"
          defaultValue=""
          onChange={(e) => {
            const scenario = PRESET_SCENARIOS.find((s) => s.id === e.target.value);
            if (scenario) onSelectScenario(scenario);
            e.target.value = '';
          }}
        >
          <option value="" disabled>⚡ Scenarios…</option>
          {PRESET_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        {/* Action icons with labels below */}
        <button
          className={`twin-tool-btn ${is3D ? 'active' : ''}`}
          onClick={onToggle3D}
          title="Toggle 3D Terrain Relief"
        >
          <span className="tool-icon">🌐</span>
          <span className="tool-label">Earth</span>
        </button>

        <button
          className={`twin-tool-btn ${isRunning ? 'active' : ''}`}
          onClick={onToggleSim}
          title={isRunning ? 'Pause Simulation' : 'Run Simulation'}
        >
          <span className="tool-icon">{isRunning ? '⏸' : '⏱️'}</span>
          <span className="tool-label">Time</span>
        </button>

        <button
          className={`twin-tool-btn ${isDispatchOpen ? 'active' : ''}`}
          onClick={onToggleDispatch}
          title="Toggle Live Dispatch Drawer"
        >
          <span className="tool-icon">📋</span>
          <span className="tool-label">Dispatch</span>
        </button>

        <button
          className="twin-tool-btn"
          onClick={onOpenReport}
          title="Open Situation Report"
        >
          <span className="tool-icon">📄</span>
          <span className="tool-label">SITREP</span>
        </button>

        <button
          className="twin-tool-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
        >
          <span className="tool-icon">⌨️</span>
          <span className="tool-label">Keys</span>
        </button>

        <div className="header-clock">
          <span className="clock-dot" style={{ background: offlineCount > 0 ? '#ef4444' : '#10b981' }} />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
