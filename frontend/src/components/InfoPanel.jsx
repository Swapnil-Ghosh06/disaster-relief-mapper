import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../constants/colors';

/**
 * InfoPanel — Right sidebar.
 * Phase 5 Emergency Operations Center:
 * - Live incident statistics with capacity loss calculation
 * - Active emergency reroute corridors with click-to-locate
 * - Interactive resource directory with instant search and status filtering
 * - SITREP situation report exporter trigger
 */
function InfoPanel({
  isOpen = true,
  onClose,
  stats,
  routes = [],
  resources = [],
  offlineIds = [],
  disasterType,
  severity,
  region,
  onSelectResource,
  onOpenReport,
}) {
  const { total = 0, offline = 0, affectedCapacity = 0, activeReroutes = 0 } = stats || {};
  const online = total - offline;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'directory'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtered resources for directory tab
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const isOff = offlineIds.includes(r.id);
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'online') return !isOff;
      if (statusFilter === 'offline') return isOff;
      if (statusFilter === 'shelter') return r.type === 'shelter';
      if (statusFilter === 'food_bank') return r.type === 'food_bank';
      if (statusFilter === 'medical_camp') return r.type === 'medical_camp';
      return true;
    });
  }, [resources, offlineIds, searchQuery, statusFilter]);

  if (!isOpen) return null;

  return (
    <motion.aside
      className="sidebar sidebar-right digital-twin-drawer"
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>📊 LIVE DISPATCH</h1>
            <div className="subtitle">{region?.toUpperCase() ?? 'NO REGION'} SECTOR</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="ops-btn primary"
              style={{ padding: '4px 8px', fontSize: 10 }}
              onClick={onOpenReport}
            >
              SITREP
            </button>
            {onClose && (
              <button
                className="drawer-close-btn"
                onClick={onClose}
                title="Close Drawer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab switch */}
        <div className="panel-tab-group">
          <button
            className={`panel-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview ({activeReroutes} Arcs)
          </button>
          <button
            className={`panel-tab ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            Directory ({resources.length})
          </button>
        </div>
      </div>

      <div className="sidebar-body">
        {activeTab === 'overview' ? (
          <>
            {/* ── Stats Grid ── */}
            <div className="section-label">Resource Status</div>
            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-value info">{total}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-item">
                <div className="stat-value success">{online}</div>
                <div className="stat-label">Online</div>
              </div>
              <div className="stat-item">
                <div className="stat-value danger">{offline}</div>
                <div className="stat-label">Offline</div>
              </div>
              <div className="stat-item">
                <div className="stat-value warning">{activeReroutes}</div>
                <div className="stat-label">Reroutes</div>
              </div>
            </div>

            {/* Affected capacity card */}
            {affectedCapacity > 0 && (
              <div className="card" style={{ borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(254,242,242,0.8)' }}>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', marginBottom: 4 }}>
                  ⚠️ ESTIMATED AFFECTED CAPACITY
                </div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--red)',
                  lineHeight: 1.1,
                }}>
                  {affectedCapacity.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  meals / trauma beds / evacuees displaced
                </div>
              </div>
            )}

            {/* ── Active Reroutes ── */}
            <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Relief Corridors</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Click card to locate</span>
            </div>
            <AnimatePresence>
              {routes.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 6, border: '1px dashed var(--border)' }}>
                  No active reroutes · All systems nominal
                </div>
              ) : (
                routes.map((route, i) => (
                  <motion.div
                    key={route.from_id}
                    className="card reroute-card"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ padding: '10px 12px', cursor: 'pointer' }}
                    onClick={() => {
                      const dest = resources.find((r) => r.id === route.to_id);
                      if (dest && onSelectResource) onSelectResource(dest);
                    }}
                    title="Click to view destination facility on map"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        ✕ {route.from_id} COMPROMISED
                      </span>
                      <span style={{ fontSize: 9, background: '#e2f5ea', color: '#16a34a', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>
                        ~{route.est_minutes} min
                      </span>
                    </div>

                    <div style={{ fontSize: 11, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {route.from_name}
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 2px' }}>
                      ↘ Rerouted traffic to:
                    </div>

                    <div style={{ fontSize: 11, fontFamily: 'var(--font-heading)', color: '#16a34a', fontWeight: 700 }}>
                      ✓ {route.to_name}
                    </div>

                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                      Corridor: {route.distance_km} km · {route.resource_type}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* ── Legend ── */}
            <div className="section-label">Resource Legend</div>
            <div className="card">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: COLORS.shelter }} />
                <span>Emergency Shelter</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: COLORS.foodBank }} />
                <span>Food & Nutrition Bank</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: COLORS.medical }} />
                <span>Medical / Field Hospital</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#bfb9ad' }} />
                <span>Inundated / Offline Hub (✕)</span>
              </div>
            </div>
          </>
        ) : (
          /* Directory Tab */
          <div className="directory-tab">
            <input
              type="text"
              className="directory-search"
              placeholder="Search facility name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="directory-filters">
              {[
                { id: 'all', label: 'All' },
                { id: 'offline', label: 'Offline' },
                { id: 'online', label: 'Online' },
                { id: 'shelter', label: 'Shelter' },
                { id: 'food_bank', label: 'Food' },
                { id: 'medical_camp', label: 'Medical' },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`dir-filter-btn ${statusFilter === f.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="directory-list">
              {filteredResources.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No facilities match your filter
                </div>
              ) : (
                filteredResources.map((r) => {
                  const isOff = offlineIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`directory-item ${isOff ? 'offline' : ''}`}
                      onClick={() => onSelectResource && onSelectResource(r)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isOff ? 'var(--red)' : 'var(--text-muted)' }}>
                          {r.id}
                        </span>
                        <span className={`status-pill ${isOff ? 'offline' : 'online'}`}>
                          {isOff ? '✕ OFFLINE' : '● ONLINE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: 2 }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                        {r.type.replace('_', ' ')} · Elev {r.elevation_m}m · {r.capacity ? `${r.capacity} cap` : r.daily_meals ? `${r.daily_meals} meals` : `${r.beds} beds`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export default InfoPanel;
