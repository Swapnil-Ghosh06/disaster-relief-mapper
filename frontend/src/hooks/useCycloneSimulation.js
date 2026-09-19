import { useState, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useCycloneSimulation
//
// Manages cyclone lifecycle:
//   - eyePosition  → placed by clicking the map
//   - currentRadius → expands from 0 → targetRadius during simulation
//   - rotation     → continuous spin for visual layer (requestAnimationFrame)
//   - severity     → 1–10, controls damage threshold
//   - offlineIds   → resources inside damage radius
//
// No backend required — pure frontend geometry (haversine distance).
// ─────────────────────────────────────────────────────────────────────────────

const EXPAND_INTERVAL_MS = 50;   // ms per radius expansion tick
const EXPAND_STEP_KM     = 0.4;  // km per tick at 1× speed

// ── Haversine distance (km) between two lat/lng points ──────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Compute offline IDs ──────────────────────────────────────────────────────
// Damage threshold: severity scales from 40% (sev 1) to 100% (sev 10) of radius
function computeOfflineIds(resources, eyePosition, radiusKm, severity) {
  if (!eyePosition || radiusKm <= 0) return [];
  const damageRadius = radiusKm * (0.30 + severity * 0.07); // 0.37–1.0 × radius
  return resources
    .filter((r) => haversineKm(eyePosition.lat, eyePosition.lng, r.lat, r.lng) <= damageRadius)
    .map((r) => r.id);
}

export function useCycloneSimulation({ resources = [], onOfflineChange }) {
  const [eyePosition,    setEyePosition]    = useState(null);  // { lat, lng }
  const [currentRadius,  setCurrentRadius]  = useState(0);     // km
  const [targetRadius,   setTargetRadius]   = useState(30);    // km
  const [severity,       setSeverity]       = useState(5);     // 1–10
  const [speed,          setSpeed]          = useState(1);     // multiplier
  const [isRunning,      setIsRunning]      = useState(false);
  const [rotation,       setRotation]       = useState(0);     // radians

  const intervalRef     = useRef(null);
  const rafRef          = useRef(null);
  const targetRef       = useRef(30);
  const resourcesRef    = useRef(resources);
  const eyeRef          = useRef(null);
  const speedRef        = useRef(1);

  useEffect(() => { targetRef.current   = targetRadius;  }, [targetRadius]);
  useEffect(() => { resourcesRef.current = resources;    }, [resources]);
  useEffect(() => { eyeRef.current      = eyePosition;   }, [eyePosition]);
  useEffect(() => { speedRef.current    = speed;         }, [speed]);

  const onOfflineChangeRef = useRef(onOfflineChange);
  useEffect(() => {
    onOfflineChangeRef.current = onOfflineChange;
  });

  const prevOfflineKeyRef = useRef('');

  // ── Notify parent of offline changes ──────────────────────────────────────
  useEffect(() => {
    const newOfflineIds = computeOfflineIds(resources, eyePosition, currentRadius, severity);
    const key = newOfflineIds.slice().sort().join(',');
    if (key !== prevOfflineKeyRef.current) {
      prevOfflineKeyRef.current = key;
      if (onOfflineChangeRef.current) {
        onOfflineChangeRef.current(newOfflineIds);
      }
    }
  }, [currentRadius, severity, eyePosition, resources]);

  // ── Rotation animation (always spins while eyePosition is set) ────────────
  useEffect(() => {
    if (!eyePosition) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setRotation((prev) => (prev + (dt * 0.0008)) % (Math.PI * 2)); // ~0.8 rad/s
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [eyePosition]);

  // ── Clear expansion interval ───────────────────────────────────────────────
  const clearExpand = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Start radius expansion ─────────────────────────────────────────────────
  const start = useCallback(() => {
    if (intervalRef.current) return;
    if (!eyeRef.current) {
      console.warn('[Cyclone] Place eye on map before simulating');
      return;
    }
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCurrentRadius((prev) => {
        const next = parseFloat((prev + EXPAND_STEP_KM * speedRef.current).toFixed(2));
        if (next >= targetRef.current) {
          clearExpand();
          setIsRunning(false);
          return targetRef.current;
        }
        return next;
      });
    }, EXPAND_INTERVAL_MS);
  }, [clearExpand]);

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    clearExpand();
    setIsRunning(false);
  }, [clearExpand]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearExpand();
    setIsRunning(false);
    setCurrentRadius(0);
    if (onOfflineChange) onOfflineChange([]);
  }, [clearExpand, onOfflineChange]);

  // ── Toggle ────────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (!eyeRef.current) return; // no eye placed
    if (isRunning) {
      stop();
    } else {
      if (currentRadius >= targetRadius) {
        setCurrentRadius(0);
        setTimeout(() => start(), 50);
      } else {
        start();
      }
    }
  }, [isRunning, currentRadius, targetRadius, start, stop]);

  // Cleanup
  useEffect(() => () => { clearExpand(); cancelAnimationFrame(rafRef.current); }, [clearExpand]);

  // ── Wind speed from severity (km/h) ───────────────────────────────────────
  const windSpeedKph = 80 + severity * 22; // sev 1 → 102 kph, sev 10 → 300 kph
  const category = windSpeedKph < 119 ? 'TS' :
    windSpeedKph < 154 ? 'Cat 1' :
    windSpeedKph < 178 ? 'Cat 2' :
    windSpeedKph < 209 ? 'Cat 3' :
    windSpeedKph < 252 ? 'Cat 4' : 'Cat 5';

  return {
    eyePosition,
    setEyePosition,
    currentRadius,
    setCurrentRadius,
    targetRadius,
    setTargetRadius,
    severity,
    setSeverity,
    speed,
    setSpeed,
    isRunning,
    rotation,
    toggle,
    start,
    stop,
    reset,
    hasEye: !!eyePosition,
    windSpeedKph,
    category,
    offlineIds: computeOfflineIds(resources, eyePosition, currentRadius, severity),
  };
}
