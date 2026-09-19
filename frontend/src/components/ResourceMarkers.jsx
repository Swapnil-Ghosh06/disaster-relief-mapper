import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useState, useCallback } from 'react';
import { RESOURCE_COLOR, COLORS } from '../constants/colors';

// ─────────────────────────────────────────────
// Resource Marker sizes & opacity
// ─────────────────────────────────────────────
const RADIUS_ONLINE  = 120;   // metres
const RADIUS_OFFLINE = 100;
const OPACITY_ONLINE  = 220;  // 0–255
const OPACITY_OFFLINE = 140;

/**
 * Returns the deck.gl colour array for a resource given its status.
 */
function getMarkerColor(resource, offlineIds) {
  if (offlineIds.includes(resource.id)) {
    return [...COLORS.offlineRGB, OPACITY_OFFLINE];
  }
  const base = RESOURCE_COLOR[resource.type] || [180, 180, 180];
  return [...base, OPACITY_ONLINE];
}

/**
 * useResourceMarkers — hook that builds deck.gl layers for all resources.
 *
 * @param {Object} params
 * @param {Array}  params.resources  - Full resource list
 * @param {Array}  params.offlineIds - IDs of currently offline resources
 * @param {Object} params.layerVisibility - { shelters, foodBanks, medicalCamps }
 * @param {Function} params.onMarkerClick - Called with resource object on click
 *
 * @returns {Array} deck.gl layer instances
 */
export function useResourceMarkers({
  resources = [],
  offlineIds = [],
  layerVisibility = { shelters: true, foodBanks: true, medicalCamps: true },
  onMarkerClick,
}) {
  // Filter by visibility toggles
  const visible = resources.filter((r) => {
    if (r.type === 'shelter'      && !layerVisibility.shelters)    return false;
    if (r.type === 'food_bank'    && !layerVisibility.foodBanks)   return false;
    if (r.type === 'medical_camp' && !layerVisibility.medicalCamps) return false;
    return true;
  });

  const markerLayer = new ScatterplotLayer({
    id: 'resource-markers',
    data: visible,
    getPosition:  (r) => [r.lng, r.lat],
    getRadius:    (r) => (offlineIds.includes(r.id) ? RADIUS_OFFLINE : RADIUS_ONLINE),
    getFillColor: (r) => getMarkerColor(r, offlineIds),
    getLineColor: (r) => {
      if (offlineIds.includes(r.id)) return [239, 68, 68, 200];
      const base = RESOURCE_COLOR[r.type] || [180, 180, 180];
      return [...base, 255];
    },
    lineWidthMinPixels: 2,
    stroked: true,
    filled:  true,
    radiusMinPixels: 6,
    radiusMaxPixels: 20,
    pickable: true,
    onClick: (info) => {
      if (info.object && onMarkerClick) onMarkerClick(info.object);
    },
    updateTriggers: {
      getFillColor: [offlineIds],
      getLineColor: [offlineIds],
      getRadius:    [offlineIds],
    },
  });

  // Offline ❌ icon layer (text overlay on offline markers)
  const offlineTextLayer = new TextLayer({
    id: 'offline-icons',
    data: visible.filter((r) => offlineIds.includes(r.id)),
    getPosition:  (r) => [r.lng, r.lat],
    getText:      () => '✕',
    getSize:      14,
    getColor:     [239, 68, 68, 255],
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    pickable: false,
  });

  return [markerLayer, offlineTextLayer];
}

// ─────────────────────────────────────────────────────────────────────────────
// ResourcePopup — shown when user clicks a marker
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABEL = {
  shelter:      'Shelter',
  food_bank:    'Food Bank',
  medical_camp: 'Medical Camp',
};

const TYPE_ICON = {
  shelter:      '🏠',
  food_bank:    '🍱',
  medical_camp: '🏥',
};

function capacityLabel(resource) {
  if (resource.capacity)    return { label: 'Capacity',    value: `${resource.capacity} people` };
  if (resource.daily_meals) return { label: 'Daily Meals', value: `${resource.daily_meals} meals/day` };
  if (resource.beds)        return { label: 'Beds',        value: `${resource.beds} beds` };
  return null;
}

/**
 * ResourcePopup — floating info card shown on marker click.
 *
 * @param {Object} resource  - The clicked resource object
 * @param {boolean} offline  - Whether the resource is currently offline
 * @param {Function} onClose - Closes the popup
 */
export function ResourcePopup({ resource, offline, onClose }) {
  if (!resource) return null;

  const cap = capacityLabel(resource);
  const statusColor = offline
    ? 'var(--red)'
    : resource.status === 'damaged'
    ? 'var(--amber)'
    : 'var(--green)';

  const statusText = offline ? 'OFFLINE' : resource.status?.toUpperCase() ?? 'ONLINE';

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        right: 300,
        zIndex: 20,
        animation: 'fadeSlideIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="map-popup">
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, paddingRight: 16 }}>
          <span style={{ fontSize: 20 }}>{TYPE_ICON[resource.type] ?? '📍'}</span>
          <div>
            <h3>{resource.name}</h3>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {TYPE_LABEL[resource.type]}
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="popup-row">
          <span>Status</span>
          <span className="popup-val" style={{ color: statusColor, fontWeight: 700 }}>
            {statusText}
          </span>
        </div>

        {cap && (
          <div className="popup-row">
            <span>{cap.label}</span>
            <span className="popup-val">{cap.value}</span>
          </div>
        )}

        {resource.elevation_m !== undefined && (
          <div className="popup-row">
            <span>Elevation</span>
            <span className="popup-val">{resource.elevation_m.toFixed(1)} m</span>
          </div>
        )}

        <div className="popup-row">
          <span>ID</span>
          <span className="popup-val">{resource.id}</span>
        </div>

        {resource.address && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            📍 {resource.address}
          </div>
        )}
      </div>
    </div>
  );
}
