import { useState, useEffect, useCallback } from 'react';
import { fetchReroutes } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance helper (km)
// ─────────────────────────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side Nearest-Neighbor Rerouting Algorithm
// Used as seamless fallback when backend /reroute is unavailable.
// ─────────────────────────────────────────────────────────────────────────────
export function computeClientReroutes(resources = [], offlineIds = []) {
  if (!resources.length || !offlineIds.length) return [];

  const offlineSet = new Set(offlineIds);
  const offlineList = resources.filter((r) => offlineSet.has(r.id));
  const onlineList = resources.filter((r) => !offlineSet.has(r.id));

  if (!onlineList.length) return [];

  const routes = [];

  for (const off of offlineList) {
    // 1. First search for online resources of the exact same type
    let candidates = onlineList.filter((r) => r.type === off.type);

    // 2. If no matching type online, fallback to any online resource
    if (!candidates.length) {
      candidates = onlineList;
    }

    // 3. Find closest candidate by geographic distance
    let closest = null;
    let minDistance = Infinity;

    for (const cand of candidates) {
      const dist = haversineKm(off.lat, off.lng, cand.lat, cand.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = cand;
      }
    }

    if (closest) {
      const distanceKm = Number(minDistance.toFixed(1));
      routes.push({
        from_id: off.id,
        from_name: off.name,
        from_lat: off.lat,
        from_lng: off.lng,
        to_id: closest.id,
        to_name: closest.name,
        to_lat: closest.lat,
        to_lng: closest.lng,
        distance_km: distanceKm,
        est_minutes: Math.max(3, Math.round(distanceKm * 2.2 + 4)),
        resource_type: off.type.replace('_', ' '),
      });
    }
  }

  return routes;
}

// ─────────────────────────────────────────────────────────────────────────────
// useRerouting — Auto-computes reroute arcs when offlineIds change
// ─────────────────────────────────────────────────────────────────────────────
export function useRerouting({ resources = [], offlineIds = [], region = 'chennai' }) {
  const [routes, setRoutes] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateReroutes = useCallback(async () => {
    if (!offlineIds.length) {
      setRoutes([]);
      return;
    }

    setIsCalculating(true);
    try {
      // Try backend first
      const backendRoutes = await fetchReroutes({
        offline_ids: offlineIds,
        region,
      });

      if (backendRoutes && backendRoutes.length > 0) {
        setRoutes(backendRoutes);
      } else {
        // Fallback to high-fidelity client computation
        const fallback = computeClientReroutes(resources, offlineIds);
        setRoutes(fallback);
      }
    } catch {
      // Client fallback on network/backend error
      const fallback = computeClientReroutes(resources, offlineIds);
      setRoutes(fallback);
    } finally {
      setIsCalculating(false);
    }
  }, [resources, offlineIds, region]);

  const prevKeyRef = useRef('');

  // Trigger whenever offline resources list changes
  useEffect(() => {
    const key = `${region}_${offlineIds.slice().sort().join(',')}_${resources.length}`;
    if (key !== prevKeyRef.current) {
      prevKeyRef.current = key;
      calculateReroutes();
    }
  }, [offlineIds, resources, region, calculateReroutes]);

  const clearRoutes = useCallback(() => {
    setRoutes([]);
  }, []);

  return {
    routes,
    isCalculating,
    clearRoutes,
    refresh: calculateReroutes,
  };
}
