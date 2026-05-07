import type { LatLng } from '../types';

const OSRM_ENDPOINTS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
];
const OSRM_TIMEOUT_MS = 20_000;
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const ORS_TIMEOUT_MS = 20_000;
const TOMTOM_TIMEOUT_MS = 15_000;

export interface OsrmResult {
  polyline: LatLng[];
  distanceKm: number;
  durationMin: number;
  usedFallback: boolean;
  engine?: string;
  trafficDelayMin?: number;
}

/**
 * Cadeia de roteamento (em ordem de preferência):
 *  1) TomTom (com trânsito real) — se key configurada
 *  2) OpenRouteService — se key configurada (sem trânsito, mais waypoints)
 *  3) OSRM público — fallback grátis (sem trânsito, ~8 waypoints)
 *  4) Linha reta — último recurso
 */
export async function routeVia(
  points: LatLng[],
  orsApiKey?: string,
  tomtomApiKey?: string,
): Promise<OsrmResult> {
  if (points.length < 2) {
    return { polyline: points.slice(), distanceKm: 0, durationMin: 0, usedFallback: false };
  }

  // 1) TomTom — rota com trânsito em tempo real
  if (tomtomApiKey?.trim()) {
    const r = await tryTomtom(tomtomApiKey.trim(), points);
    if (r) return r;
  }

  // 2) OpenRouteService
  if (orsApiKey?.trim()) {
    const r = await tryORS(orsApiKey.trim(), points);
    if (r) return r;
  }

  // 3) OSRM públicos
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

  // 4) Todos os servidores falharam → fallback de linha reta
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

async function tryTomtom(apiKey: string, points: LatLng[]): Promise<OsrmResult | null> {
  // TomTom expects: lat,lng:lat,lng:lat,lng (até 150 waypoints)
  const coords = points.map((p) => `${p.lat},${p.lng}`).join(':');
  const params = new URLSearchParams({
    key: apiKey,
    traffic: 'true',
    travelMode: 'car',
    routeType: 'fastest',
    computeTravelTimeFor: 'all', // garante trafficDelayInSeconds na resposta
  });
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${coords}/json?${params.toString()}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TOMTOM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn(`[TomTom] HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      console.warn('[TomTom]: resposta sem rota');
      return null;
    }
    const polyline: LatLng[] = [];
    for (const leg of route.legs || []) {
      for (const p of leg.points || []) {
        if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
          polyline.push({ lat: p.latitude, lng: p.longitude });
        }
      }
    }
    if (polyline.length < 2) {
      console.warn('[TomTom]: geometria incompleta');
      return null;
    }
    const summary = route.summary || {};
    return {
      polyline,
      distanceKm: (summary.lengthInMeters || 0) / 1000,
      durationMin: (summary.travelTimeInSeconds || 0) / 60,
      usedFallback: false,
      engine: 'tomtom.com',
      trafficDelayMin: (summary.trafficDelayInSeconds || 0) / 60,
    };
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === 'AbortError';
    console.warn(
      `[TomTom]: ${isAbort ? `timeout (${TOMTOM_TIMEOUT_MS / 1000}s)` : (e as Error).message}`,
    );
    return null;
  } finally {
    clearTimeout(t);
  }
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
