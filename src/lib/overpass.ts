import type { City, Hotel } from '../types';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

interface OverpassResponse {
  elements?: Element[];
  remark?: string;
}

/**
 * Tenta vários endpoints. Trata `remark` (timeout/erro silencioso, status 200) como falha
 * e segue para o próximo servidor.
 */
const FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(url: string, body: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));
}

async function runOverpass(query: string): Promise<OverpassResponse> {
  const body = 'data=' + encodeURIComponent(query);
  let lastErr: unknown;
  for (const url of OVERPASS_ENDPOINTS) {
    const host = url.split('/')[2];
    try {
      const res = await fetchWithTimeout(url, body, FETCH_TIMEOUT_MS);
      if (!res.ok) {
        lastErr = new Error(`${host} HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as OverpassResponse;
      // 200 com `remark` = timeout/erro silencioso na execução do Overpass
      if (data.remark && (data.elements?.length ?? 0) === 0) {
        lastErr = new Error(`${host}: ${data.remark}`);
        continue;
      }
      return data;
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === 'AbortError';
      lastErr = isAbort ? new Error(`${host}: timeout (${FETCH_TIMEOUT_MS / 1000}s)`) : e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Todos os servidores Overpass falharam');
}

const TOURISM_RE =
  '^(hotel|hostel|guest_house|motel|apartment|apartment_hotel|resort|chalet|camp_site|caravan_site|alpine_hut|wilderness_hut)$';

/** Query principal (tipos de tourism — rápida, cobre 90% dos casos) */
function queryTourism(geoFilter: string): string {
  return `
    [out:json][timeout:12];
    (
      node["tourism"~"${TOURISM_RE}"]${geoFilter};
      way["tourism"~"${TOURISM_RE}"]${geoFilter};
      relation["tourism"~"${TOURISM_RE}"]${geoFilter};
    );
    out center tags;
  `;
}

/** Query secundária (tags alternativas — leve, sem `building` que era o gargalo) */
function queryAlt(geoFilter: string): string {
  return `
    [out:json][timeout:12];
    (
      node["amenity"="hotel"]${geoFilter};
      way["amenity"="hotel"]${geoFilter};
      node["leisure"="resort"]${geoFilter};
      way["leisure"="resort"]${geoFilter};
    );
    out center tags;
  `;
}

/**
 * Roda as duas queries em paralelo. Se uma falhar, ainda devolve resultados da outra.
 * Erro só sobe quando AMBAS falham.
 */
async function fetchByGeoFilter(geoFilter: string): Promise<Hotel[]> {
  const [primary, alt] = await Promise.allSettled([
    runOverpass(queryTourism(geoFilter)),
    runOverpass(queryAlt(geoFilter)),
  ]);

  const elements: Element[] = [];
  if (primary.status === 'fulfilled') elements.push(...(primary.value.elements ?? []));
  if (alt.status === 'fulfilled') elements.push(...(alt.value.elements ?? []));

  if (primary.status === 'rejected' && alt.status === 'rejected') {
    const a = primary.reason instanceof Error ? primary.reason.message : String(primary.reason);
    const b = alt.reason instanceof Error ? alt.reason.message : String(alt.reason);
    throw new Error(`Overpass falhou: ${a} | ${b}`);
  }

  return parseHotels(elements);
}

export async function fetchHotelsInCity(city: City): Promise<Hotel[]> {
  const [south, north, west, east] = city.boundingBox;
  return fetchHotelsInBbox(south, west, north, east);
}

export async function fetchHotelsInRadius(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Hotel[]> {
  const r = Math.max(50, Math.round(radiusKm * 1000));
  return fetchByGeoFilter(`(around:${r},${lat},${lng})`);
}

export async function fetchHotelsInBbox(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<Hotel[]> {
  return fetchByGeoFilter(`(${south},${west},${north},${east})`);
}

type Element = {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function tagLabel(tags: Record<string, string>): string {
  if (tags.tourism) {
    const map: Record<string, string> = {
      hotel: 'Hotel',
      hostel: 'Hostel',
      guest_house: 'Pousada',
      motel: 'Motel',
      apartment: 'Apartamento',
      apartment_hotel: 'Apart-hotel',
      resort: 'Resort',
      chalet: 'Chalé',
      camp_site: 'Camping',
      caravan_site: 'Caravan',
      alpine_hut: 'Refúgio',
      wilderness_hut: 'Abrigo',
    };
    return map[tags.tourism] || tags.tourism;
  }
  if (tags.amenity === 'hotel') return 'Hotel';
  if (tags.leisure === 'resort') return 'Resort';
  return '';
}

function parseHotels(elements: Element[]): Hotel[] {
  const hotels: Hotel[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const tags = el.tags || {};
    const label = tagLabel(tags);
    const name = tags.name || tags['name:pt'] || label || 'Acomodação';
    // dedupe por nome + coordenadas aprox (tolerância ~1m)
    const key = `${name.toLowerCase()}@${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const addrParts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:suburb'] || tags['addr:neighbourhood'],
    ].filter(Boolean);
    const address = addrParts.join(', ') || (label && name !== label ? label : '');

    hotels.push({
      id: `${el.type}-${el.id}`,
      name,
      lat,
      lng,
      address,
      guests: 0,
    });
  }
  return hotels;
}
