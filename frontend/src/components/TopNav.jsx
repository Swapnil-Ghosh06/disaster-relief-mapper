import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TopNav — Emergency Operations Command Header
// ─────────────────────────────────────────────────────────────────────────────

export const PRESET_SCENARIOS = [
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
  onSelectScenario,
  onOpenReport,
  onOpenShortcuts,
  offlineCount = 0,
  disasterType = 'flood',
  isRunning = false,
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
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="ops-topnav">
      {/* Brand & Mission title */}
      <div className="ops-brand">
        <div className="ops-status-beacon" style={{ background: offlineCount > 0 ? '#dc2626' : '#16a34a' }} />
        <div>
          <div className="ops-title">DISASTER RELIEF MAPPER</div>
          <div className="ops-subtitle">EMERGENCY OPERATIONS COMMAND CENTER</div>
        </div>
      </div>

      {/* Center: Live Situational Alert & Presets */}
      <div className="ops-center-controls">
        <div className="scenario-selector-wrap">
          <span className="scenario-label">⚡ SCENARIOS:</span>
          <select
            className="scenario-select"
            defaultValue=""
            onChange={(e) => {
              const scenario = PRESET_SCENARIOS.find((s) => s.id === e.target.value);
              if (scenario) onSelectScenario(scenario);
              e.target.value = '';
            }}
          >
            <option value="" disabled>Load Emergency Scenario Preset…</option>
            {PRESET_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Live status badge */}
        <div className={`ops-alert-badge ${offlineCount > 0 ? 'critical' : 'nominal'}`}>
          <span className="badge-dot" />
          {offlineCount > 0
            ? `LEVEL 3 DISASTER: ${offlineCount} FACILITIES COMPROMISED`
            : 'SYSTEM NOMINAL · ALL NODES ACTIVE'}
        </div>
      </div>

      {/* Right actions & clock */}
      <div className="ops-right-tools">
        <button
          className="ops-btn secondary"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (Press ?)"
        >
          ⌨ Shortcuts
        </button>
        <button
          className="ops-btn primary"
          onClick={onOpenReport}
          title="Export Situation Report"
        >
          📋 SITREP Report
        </button>
        <div className="ops-clock">{timeStr}</div>
      </div>
    </header>
  );
}

export default TopNav;
