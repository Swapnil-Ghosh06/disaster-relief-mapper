import React, { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { REGION_LIST } from '../constants/regions';

/**
 * SmartCityStatsCard — Floating Digital Twin HUD
 * Faithfully replicates the left statistics card from the Wellington Smart City UI (Screenshot 5)
 */
export function SmartCityStatsCard({
  region,
  onRegionChange,
  disasterType,
  onDisasterTypeChange,
  // Flood
  waterLevel = 0,
  targetLevel = 8,
  onTargetLevelChange,
  // Cyclone
  cycloneRadius = 0,
  targetRadius = 45,
  onTargetRadiusChange,
  // Shared simulation state
  isRunning = false,
  onToggleSimulation,
  onReset,
  // Stats
  stats = {},
  offlineCount = 0,
}) {
  const [timelineMode, setTimelineMode] = useState('month');
  const isFlood = disasterType === 'flood';

  // Dynamic calculations reflecting the disaster severity
  const severityRatio = isFlood ? Math.min(1, waterLevel / (targetLevel || 15)) : Math.min(1, cycloneRadius / (targetRadius || 80));
  
  // High-fidelity statistics inspired by Screenshot 5
  const busTrips = Math.max(0, Math.round(124753 * (1 - severityRatio * 0.94)));
  const busImpact = `-${Math.round(severityRatio * 94)}%`;

  const railTrips = Math.max(0, Math.round(30088 * (1 - severityRatio * 0.97)));
  const railImpact = `-${Math.round(severityRatio * 97)}%`;

  const ferryTrips = Math.max(0, Math.round(1200 * (1 - severityRatio * 1.0)));
  const ferryImpact = severityRatio > 0.3 ? '-100%' : `-${Math.round(severityRatio * 100)}%`;

  const shelterCapacity = Math.max(0, Math.round(96547 - (stats.affectedCapacity || 0)));
  const shelterImpact = `-${Math.round(severityRatio * 18)}%`;

  const displacedCount = Math.round(3750 + severityRatio * 9554433);
  const displacedImpact = `-${Math.round(severityRatio * 81)}%`;

  return (
    <div className="smart-city-stats-card">
      {/* ── Card Header Banner ── */}
      <div className="stats-card-header">
        <span className="stats-header-title">TRANSPORT STATISTICS</span>
      </div>

      {/* ── Timeline / Scrubber Header ── */}
      <div className="timeline-section">
        <div className="timeline-header-row">
          <div className="timeline-label-group">
            <span className="timeline-sub">SELECT A DATE / TIMELINE</span>
            <div className="timeline-current-date">
              {isFlood
                ? `Surge Level ${waterLevel.toFixed(1)}m`
                : `Radius ${cycloneRadius.toFixed(0)}km`}
            </div>
          </div>

          <div className="timeline-mode-toggle">
            <button
              className={`mode-btn ${timelineMode === 'year' ? 'active' : ''}`}
              onClick={() => setTimelineMode('year')}
            >
              YEAR
            </button>
            <button
              className={`mode-btn ${timelineMode === 'month' ? 'active' : ''}`}
              onClick={() => setTimelineMode('month')}
            >
              MONTH
            </button>
          </div>
        </div>

        {/* Scrubber slider */}
        <div className="timeline-slider-wrap">
          <div className="timeline-slider-endpoints">
            <span>January</span>
            <span>December</span>
          </div>

          <Slider.Root
            className="timeline-slider-root"
            min={0}
            max={isFlood ? 15 : 100}
            step={0.5}
            value={[isFlood ? targetLevel : targetRadius]}
            onValueChange={([v]) => (isFlood ? onTargetLevelChange?.(v) : onTargetRadiusChange?.(v))}
          >
            <Slider.Track className="timeline-slider-track">
              <Slider.Range className="timeline-slider-range" />
            </Slider.Track>
            <Slider.Thumb className="timeline-slider-thumb" aria-label="Timeline Scrubber" />
          </Slider.Root>
        </div>
      </div>

      {/* ── Large Metric Stat Rows (Matching Screenshot 5) ── */}
      <div className="stats-metrics-list">
        {/* Row 1: Bus Trips / Evacuation Transit */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">Bus Trips</span>
            <span className="metric-value">{busTrips.toLocaleString()}</span>
          </div>
          <div className="metric-badge-wrap">
            <span className="growth-label">annual growth</span>
            <span className="growth-badge critical">{busImpact}</span>
          </div>
        </div>

        {/* Row 2: Rail Trips / Relief Corridors */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">Rail Trips</span>
            <span className="metric-value">{railTrips.toLocaleString()}</span>
          </div>
          <div className="metric-badge-wrap">
            <span className="growth-label">annual growth</span>
            <span className="growth-badge critical">{railImpact}</span>
          </div>
        </div>

        {/* Row 3: Ferry Trips / Marine Units */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">Ferry Trips</span>
            <span className="metric-value">{ferryTrips.toLocaleString()}</span>
          </div>
          <div className="metric-badge-wrap">
            <span className="growth-label">annual growth</span>
            <span className="growth-badge critical">{ferryImpact}</span>
          </div>
        </div>

        {/* Row 4: Bike Trips / Shelters */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">Bike Trips</span>
            <span className="metric-value">{shelterCapacity.toLocaleString()}</span>
          </div>
          <div className="metric-badge-wrap">
            <span className="growth-label">annual growth</span>
            <span className="growth-badge warning">{shelterImpact}</span>
          </div>
        </div>

        {/* Row 5: Car Trips / Displaced */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">Car Trips</span>
            <span className="metric-value">{displacedCount.toLocaleString()}</span>
          </div>
          <div className="metric-badge-wrap">
            <span className="growth-label">annual growth</span>
            <span className="growth-badge critical">{displacedImpact}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Controls & Region Selector ── */}
      <div className="stats-card-controls">
        <div className="control-row">
          <select
            className="hud-region-select"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            {REGION_LIST.map((r) => (
              <option key={r.id} value={r.id}>
                📍 {r.name}
              </option>
            ))}
          </select>

          <div className="hud-disaster-pill">
            <button
              className={`pill-btn ${isFlood ? 'active' : ''}`}
              onClick={() => onDisasterTypeChange('flood')}
            >
              🌊 Flood
            </button>
            <button
              className={`pill-btn ${!isFlood ? 'active' : ''}`}
              onClick={() => onDisasterTypeChange('cyclone')}
            >
              🌀 Cyclone
            </button>
          </div>
        </div>

        <div className="control-actions">
          <button
            className={`hud-sim-btn ${isRunning ? 'running' : ''}`}
            onClick={onToggleSimulation}
          >
            {isRunning ? '⏸ PAUSE' : '▶ SIMULATE'}
          </button>
          <button className="hud-reset-btn" onClick={onReset} title="Reset Simulation">
            ↺ RESET
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmartCityStatsCard;
