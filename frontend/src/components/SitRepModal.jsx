import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// SitRepModal — Situation Report (SITREP) Generator & Exporter
// ─────────────────────────────────────────────────────────────────────────────

export function SitRepModal({
  isOpen,
  onClose,
  region,
  disasterType,
  severity,
  resources = [],
  offlineIds = [],
  routes = [],
  waterLevel = 0,
  cyclone = {},
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const total = resources.length;
  const offlineCount = offlineIds.length;
  const onlineCount = total - offlineCount;
  const offlineResources = resources.filter((r) => offlineIds.includes(r.id));
  const totalImpactedCapacity = offlineResources.reduce(
    (sum, r) => sum + (r.capacity || r.daily_meals || r.beds || 0),
    0
  );

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const generateReportText = () => {
    return `
================================================================================
          NATIONAL EMERGENCY DISASTER RELIEF OPERATION SITUATION REPORT (SITREP)
================================================================================
TIMESTAMP: ${timestamp}
REGION:    ${region.toUpperCase()}
DISASTER:  ${disasterType.toUpperCase()} (Severity Rating: ${severity}/10)
${disasterType === 'flood' ? `WATER LEVEL: ${waterLevel.toFixed(2)} m (ASL)` : `CYCLONE RADIUS: ${cyclone.currentRadius?.toFixed(1) || 0} km · Category ${cyclone.category || 'N/A'}`}

1. CASUALTY & CAPACITY SUMMARY
--------------------------------------------------------------------------------
- Total Registered Relief Facilities: ${total}
- Fully Operational Facilities:      ${onlineCount} (${((onlineCount / (total || 1)) * 100).toFixed(0)}%)
- Compromised / Inundated Facilities: ${offlineCount} (${((offlineCount / (total || 1)) * 100).toFixed(0)}%)
- Total Disrupted Capacity:          ${totalImpactedCapacity.toLocaleString()} (persons / meals / trauma beds)

2. COMPROMISED FACILITIES BREAKDOWN
--------------------------------------------------------------------------------
${
  offlineResources.length === 0
    ? 'All relief facilities currently online and operational.'
    : offlineResources
        .map(
          (r, i) =>
            `${i + 1}. [${r.id}] ${r.name.padEnd(32)} | Type: ${r.type.padEnd(12)} | Lat/Lng: (${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}) | Elev: ${r.elevation_m}m`
        )
        .join('\n')
}

3. EMERGENCY REROUTING CORRIDORS
--------------------------------------------------------------------------------
${
  routes.length === 0
    ? 'No active evacuation reroutes needed.'
    : routes
        .map(
          (rt, i) =>
            `${i + 1}. [${rt.from_id}] ${rt.from_name}  -->  [${rt.to_id}] ${rt.to_name}\n   Distance: ${rt.distance_km} km | Est. Transit: ~${rt.est_minutes} min | Priority: HIGH`
        )
        .join('\n\n')
}

4. COMMAND RECOMMENDATIONS
--------------------------------------------------------------------------------
- Deploy heavy amphibious transport units along critical reroute corridors.
- Expedite food ration resupply to active hubs absorbing redirected evacuees.
- Establish mobile backup triage posts near inundated shelter perimeters.
================================================================================
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div
          className="sitrep-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sitrep-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                  OPERATIONAL SITUATION REPORT (SITREP)
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  INCIDENT REF: DR-MAPPER-{region.toUpperCase()}-{new Date().getFullYear()}
                </div>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="sitrep-body">
            {/* High level metrics banner */}
            <div className="sitrep-banner-grid">
              <div className="sitrep-metric-card">
                <div className="sm-label">AFFECTED SECTOR</div>
                <div className="sm-val">{region.toUpperCase()}</div>
                <div className="sm-sub">{disasterType.toUpperCase()} ALERT</div>
              </div>
              <div className="sitrep-metric-card danger">
                <div className="sm-label">OFFLINE HUBS</div>
                <div className="sm-val danger">{offlineCount} / {total}</div>
                <div className="sm-sub">{((offlineCount / (total || 1)) * 100).toFixed(0)}% compromised</div>
              </div>
              <div className="sitrep-metric-card warning">
                <div className="sm-label">CAPACITY LOSS</div>
                <div className="sm-val warning">{totalImpactedCapacity.toLocaleString()}</div>
                <div className="sm-sub">meals / beds / evacuees</div>
              </div>
              <div className="sitrep-metric-card success">
                <div className="sm-label">REROUTE ARCS</div>
                <div className="sm-val success">{routes.length}</div>
                <div className="sm-sub">active relief corridors</div>
              </div>
            </div>

            {/* Formatted plaintext preview terminal */}
            <div className="section-label" style={{ marginTop: 16 }}>Official Dispatch Plaintext</div>
            <pre className="sitrep-terminal">
              {generateReportText()}
            </pre>
          </div>

          {/* Footer actions */}
          <div className="sitrep-footer">
            <button className="ops-btn secondary" onClick={handlePrint}>
              🖨 Print SITREP
            </button>
            <button className="ops-btn primary" onClick={handleCopy}>
              {copied ? '✓ Copied to Clipboard!' : '📄 Copy Dispatch Text'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SitRepModal;
