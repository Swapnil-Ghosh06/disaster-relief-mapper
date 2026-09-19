// ─────────────────────────────────────────────
// Design Token: Color Palette
// Emergency Operations Dashboard Aesthetic
// ─────────────────────────────────────────────

export const COLORS = {
  // ── Background / Surface (charcoal) ──
  bg:         '#0d0d0d',
  surface:    '#161616',
  surfaceAlt: '#1e1e1e',
  border:     '#2a2a2a',

  // ── Warm cream accent ──
  cream:      '#e8e3d6',
  creamDim:   'rgba(232,227,214,0.08)',

  // ── Text ──
  textPrimary: '#f0ede8',
  textMuted:   '#6b6b6b',
  textAccent:  '#a0a0a0',

  // ── Resource Types ──
  shelter:   '#22c55e',
  foodBank:  '#3b82f6',
  medical:   '#ef4444',

  // ── Resource Type RGB arrays (for deck.gl) ──
  shelterRGB:  [34, 197, 94],
  foodBankRGB: [59, 130, 246],
  medicalRGB:  [239, 68, 68],
  offlineRGB:  [60, 60, 60],    // dark grey = offline/damaged

  // ── Disaster ──
  flood:    '#1e40af',
  cyclone:  '#f97316',
  alertRed: '#ef4444',

  // ── UI Accents ──
  online:   '#22c55e',
  warning:  '#d4a84b',    // warm gold from palette
  danger:   '#ef4444',
  info:     '#3b82f6',
  amber:    '#d4a84b',

  // ── Flood water (RGBA for deck.gl) ──
  floodWaterRGBA:  [30, 100, 255, 180],
  dryCellRGBA:     [30, 30, 30, 0],

  // ── Route arcs ──
  arcSource: [239, 68, 68],    // red  = offline source
  arcTarget: [34, 197, 94],   // green = available destination
};

// Resource type → color mapping
export const RESOURCE_COLOR = {
  shelter:      COLORS.shelterRGB,
  food_bank:    COLORS.foodBankRGB,
  medical_camp: COLORS.medicalRGB,
};

export default COLORS;
