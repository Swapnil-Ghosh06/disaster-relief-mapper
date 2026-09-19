import { useState, useRef, useCallback, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useFloodSimulation
//
// Manages the entire flood simulation lifecycle:
//   - waterLevel state (0–15m)
//   - Auto-animation (increments waterLevel over time when running)
//   - Computes offlineIds from resources + current waterLevel (frontend-only)
//   - No backend required — uses elevation_m stored on each resource
// ─────────────────────────────────────────────────────────────────────────────

const MAX_WATER_LEVEL  = 15;   // metres — absolute ceiling
const STEP_SIZE        = 0.15; // metres per tick
const BASE_INTERVAL_MS = 80;   // ms between ticks at speed 1x

export function useFloodSimulation({ resources = [], onOfflineChange }) {
  const [waterLevel,  setWaterLevel]  = useState(0);
  const [targetLevel, setTargetLevel] = useState(8);   // slider sets this as the goal
  const [speed,       setSpeed]       = useState(1);   // 0.5 / 1 / 2 / 3
  const [isRunning,   setIsRunning]   = useState(false);

  const intervalRef  = useRef(null);
  const waterRef     = useRef(0);     // ref so interval always sees latest value
  const targetRef    = useRef(8);
  const resourcesRef = useRef(resources);

  const onOfflineChangeRef = useRef(onOfflineChange);
  useEffect(() => {
    onOfflineChangeRef.current = onOfflineChange;
  });

  const prevOfflineKeyRef = useRef('');

  // Keep refs in sync
  useEffect(() => { waterRef.current  = waterLevel;  }, [waterLevel]);
  useEffect(() => { targetRef.current = targetLevel; }, [targetLevel]);
  useEffect(() => { resourcesRef.current = resources; }, [resources]);

  // ── Compute offline IDs from current water level ──────────────────────────
  const computeOffline = useCallback((level) => {
    return resourcesRef.current
      .filter((r) => (r.elevation_m ?? 999) < level)
      .map((r) => r.id);
  }, []);

  // ── Sync offline IDs whenever waterLevel or resources change (Debounced / Deduped) ──
  useEffect(() => {
    const newOfflineIds = computeOffline(waterLevel);
    const key = newOfflineIds.slice().sort().join(',');
    if (key !== prevOfflineKeyRef.current) {
      prevOfflineKeyRef.current = key;
      if (onOfflineChangeRef.current) {
        onOfflineChangeRef.current(newOfflineIds);
      }
    }
  }, [waterLevel, resources, computeOffline]);

  // ── Clear interval helper ─────────────────────────────────────────────────
  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Start animation ───────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (intervalRef.current) return; // already running
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setWaterLevel((prev) => {
        const next = parseFloat((prev + STEP_SIZE).toFixed(2));
        if (next >= targetRef.current || next >= MAX_WATER_LEVEL) {
          // Reached target — stop
          clearTick();
          setIsRunning(false);
          return Math.min(targetRef.current, MAX_WATER_LEVEL);
        }
        return next;
      });
    }, BASE_INTERVAL_MS / speed);
  }, [speed, clearTick]);

  // Re-start with new speed if speed changes while running
  const startRef = useRef(start);
  useEffect(() => { startRef.current = start; }, [start]);

  // ── Stop animation ────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    clearTick();
    setIsRunning(false);
  }, [clearTick]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    clearTick();
    setIsRunning(false);
    setWaterLevel(0);
    prevOfflineKeyRef.current = '';
    if (onOfflineChangeRef.current) onOfflineChangeRef.current([]);
  }, [clearTick]);

  // ── Toggle play / pause ───────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (isRunning) stop();
    else start();
  }, [isRunning, start, stop]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => clearTick(), [clearTick]);

  // ── Stats for UI ─────────────────────────────────────────────────────────
  const offlineIds = computeOffline(waterLevel);
  const submergedCount = offlineIds.length;
  const safeCount = resources.length - submergedCount;

  return {
    waterLevel,
    targetLevel,
    speed,
    isRunning,
    setWaterLevel,
    setTargetLevel,
    setSpeed,
    start,
    stop,
    reset,
    toggle,
    stats: {
      submerged: submergedCount,
      safe: safeCount,
      total: resources.length,
    },
  };
}

export default useFloodSimulation;
