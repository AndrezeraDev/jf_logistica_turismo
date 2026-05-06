import type { Hotel } from '../types';

// IMPORTANTE: o endpoint atual da Foursquare (places-api.foursquare.com) NÃO
// envia headers CORS, então não dá pra chamar direto do browser.
// Usamos um proxy serverless em /api/foursquare-search (Vercel Function) que
// faz a chamada server-side e devolve o JSON. Isso evita CORS e mantém a key
// fora dos logs públicos do Foursquare (a key continua no localStorage do user,
// trafega só do front pro próprio backend deles).
const FSQ_PROXY = '/api/foursquare-search';
const FSQ_TIMEOUT_MS = 12_000;

// IDs v1 de categorias de hospedagem — o que de fato funciona na API atual.
// (O id v2 `19014` retorna lugares fora de hospedagem; quase nenhum place no
// banco do Foursquare foi re-tagueado com v2.)
const LODGING_CATEGORY_IDS = [
  '4bf58dd8d48988d1fa931735', // Hotel (inclui pousadas)
  '4bf58dd8d48988d1ee931735', // Hostel
  '4bf58dd8d48988d1fb931735', // Motel
  '4bf58dd8d48988d1fc931735', // Bed & Breakfast
  '4bf58dd8d48988d12f951735', // Resort
  '4bf58dd8d48988d1f8931735', // Inn / Pousada
  '56aa371be4b08b9a8d573547', // Vacation Rental
].join(',');

interface RawPlace {
  fsq_place_id?: string;
  fsq_id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  location?: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
}

// Quantas páginas de 50 baixar no máximo. 6 = 300 hotéis. Mais que suficiente
// pra qualquer cidade turística — Gramado em raio 8km tem ~97.
const FSQ_MAX_PAGES = 6;

async function fsqFetchOne(
  apiKey: string,
  params: URLSearchParams,
): Promise<{ hotels: Hotel[]; nextCursor?: string }> {
  const url = `${FSQ_PROXY}?${params.toString()}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FSQ_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'X-Fsq-Key': apiKey, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Foursquare HTTP ${res.status}: ${txt.slice(0, 180)}`);
    }
    const data = (await res.json()) as { results?: RawPlace[] };
    const hotels = parseFsq(data.results || []);

    // Cursor da próxima página vem no Link header em formato:
    //   <https://...?cursor=XYZ&...>; rel="next"
    let nextCursor: string | undefined;
    const linkHeader = res.headers.get('link');
    if (linkHeader && /rel="next"/i.test(linkHeader)) {
      const m = linkHeader.match(/[?&]cursor=([^&>;\s]+)/);
      if (m) nextCursor = decodeURIComponent(m[1]);
    }
    return { hotels, nextCursor };
  } finally {
    clearTimeout(t);
  }
}

async function fsqSearch(apiKey: string, params: URLSearchParams): Promise<Hotel[]> {
  params.set('fsq_category_ids', LODGING_CATEGORY_IDS);
  params.set('limit', '50');
  // sort=DISTANCE garante que os 50 mais PRÓXIMOS do centro voltem na 1ª página.
  // (Sem isso, FSQ ranqueia por "relevância" e pode tirar hotéis próximos do top 50.)
  params.set('sort', 'DISTANCE');

  const all: Hotel[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < FSQ_MAX_PAGES; page++) {
    const p = new URLSearchParams(params);
    if (cursor) p.set('cursor', cursor);
    const { hotels, nextCursor } = await fsqFetchOne(apiKey, p);
    all.push(...hotels);
    if (!nextCursor || hotels.length === 0) break;
    cursor = nextCursor;
  }
  return all;
}

function parseFsq(results: RawPlace[]): Hotel[] {
  const hotels: Hotel[] = [];
  for (const r of results) {
    const lat = r.latitude ?? r.geocodes?.main?.latitude;
    const lng = r.longitude ?? r.geocodes?.main?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    const id = r.fsq_place_id || r.fsq_id;
    if (!id) continue;
    const addrParts = [r.location?.address, r.location?.locality].filter(Boolean);
    hotels.push({
      id: `fsq-${id}`,
      name: r.name || 'Acomodação',
      lat,
      lng,
      address: addrParts.join(', ') || r.location?.formatted_address || '',
      guests: 0,
    });
  }
  return hotels;
}

export async function fetchHotelsFsqRadius(
  apiKey: string,
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<Hotel[]> {
  const radius = Math.min(100_000, Math.max(50, Math.round(radiusKm * 1000)));
  const params = new URLSearchParams({ ll: `${lat},${lng}`, radius: String(radius) });
  return fsqSearch(apiKey, params);
}

export async function fetchHotelsFsqBbox(
  apiKey: string,
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<Hotel[]> {
  const params = new URLSearchParams({
    ne: `${north},${east}`,
    sw: `${south},${west}`,
  });
  return fsqSearch(apiKey, params);
}
