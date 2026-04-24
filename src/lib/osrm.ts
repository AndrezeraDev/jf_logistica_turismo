import type { LatLng } from '../types';

const OSRM_ENDPOINTS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];
const OSRM_TIMEOUT_MS = 20_000;
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const ORS_TIMEOUT_MS = 20_000;

export interface OsrmResult {
  polyline: LatLng[];
  distanceKm: number;
  durationMin: number;
  usedFallback: boolean;
  engine?: string;
}

/**
 * Tenta (1) OpenRouteService se houver API key, depois (2) OSRM públicos.
 * Fallback final: linha reta com `usedFallback=true`.
 */
export async function routeVia(
  points: LatLng[],
  orsApiKey?: string,
): Promise<OsrmResult> {
  if (points.length < 2) {
    return { polyline: points.slice(), distanceKm: 0, durationMin: 0, usedFallback: false };
  }

  // 1) OpenRouteService (quando houver key) — preferencial: mais estável, aceita até 70 waypoints
  if (orsApiKey?.trim()) {
    const r = await tryORS(orsApiKey.trim(), points);
    if (r) return r;
  }

  // 2) OSRM públicos
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  for (const base of OSRM_ENDPOINTS) {
    const host = new URL(base).hostname;
    const url = `${base}/${coords}?overview=full&geometries=geojson&steps=false`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), OSRM_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        console.warn(`[OSRM] ${host} HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const r = data.routes?.[0];
      if (!r || !r.geometry?.coordinates?.length) {
        console.warn(`[OSRM] ${host}: resposta sem geometria`);
        continue;
      }
      const coords2: [number, number][] = r.geometry.coordinates;
      return {
        polyline: coords2.map(([lng, lat]) => ({ lat, lng })),
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
        usedFallback: false,
        engine: host,
      };
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === 'AbortError';
      console.warn(
        `[OSRM] ${host}: ${isAbort ? `timeout (${OSRM_TIMEOUT_MS / 1000}s)` : (e as Error).message}`,
      );
    } finally {
      clearTimeout(t);
    }
  }

  // 3) Todos os servidores falharam → fallback de linha reta
  console.warn('[routing] todos os endpoints falharam, usando linha reta');
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversineKm(points[i - 1], points[i]);
  }
  return {
    polyline: points.slice(),
    distanceKm: dist,
    durationMin: (dist / 45) * 60,
    usedFallback: true,
  };
}

async function tryORS(apiKey: string, points: LatLng[]): Promise<OsrmResult | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ORS_TIMEOUT_MS);
  try {
    const res = await fetch(ORS_URL, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        coordinates: points.map((p) => [p.lng, p.lat]),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn(`[ORS] HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const feat = data.features?.[0];
    const coords: [number, number][] | undefined = feat?.geometry?.coordinates;
    if (!coords?.length) {
      console.warn('[ORS] resposta sem geometria');
      return null;
    }
    const summary = feat.properties?.summary;
    return {
      polyline: coords.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: (summary?.distance || 0) / 1000,
      durationMin: (summary?.duration || 0) / 60,
      usedFallback: false,
      engine: 'openrouteservice.org',
    };
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === 'AbortError';
    console.warn(
      `[ORS] ${isAbort ? `timeout (${ORS_TIMEOUT_MS / 1000}s)` : (e as Error).message}`,
    );
    return null;
  } finally {
    clearTimeout(t);
  }
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
