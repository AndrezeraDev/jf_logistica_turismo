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

/** Busca paginada filtrando pelas categorias de hospedagem. Retorna até 300. */
async function fsqByCategory(
  apiKey: string,
  baseParams: URLSearchParams,
): Promise<Hotel[]> {
  const params = new URLSearchParams(baseParams);
  params.set('fsq_category_ids', LODGING_CATEGORY_IDS);
  params.set('limit', '50');
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

/** Busca por palavra no nome SEM filtro de categoria, num ponto específico.
 *  Foursquare tem filtro de "qualidade" silencioso que esconde alguns hotéis em
 *  áreas grandes — em raios pequenos eles voltam.   */
async function fsqByQueryAt(
  apiKey: string,
  lat: number,
  lng: number,
  radiusM: number,
  query: string,
): Promise<Hotel[]> {
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: String(radiusM),
    query,
    limit: '50',
    sort: 'DISTANCE',
  });
  const { hotels } = await fsqFetchOne(apiKey, params);
  return hotels;
}

/** Faz uma grade de sub-buscas com `query` em células pequenas pra contornar
 *  o filtro de qualidade do FSQ, que oculta hotéis em buscas amplas.
 *  Grid 5x5 = 25 células com sobreposição alta — Foursquare ranqueia muito
 *  instavelmente, então usamos cells pequenas (2km) e bem espalhadas. */
async function fsqGridQuery(
  apiKey: string,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  query: string,
): Promise<Hotel[]> {
  // Densidade da grade depende do raio. Em raios grandes precisamos mais cells.
  const GRID = radiusKm <= 4 ? 3 : radiusKm <= 8 ? 5 : 7;
  const cellRadiusKm = 2.0; // sempre 2km — ponto ótimo onde FSQ não filtra
  const dLatTotal = radiusKm / 111;
  const dLngTotal = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  const tasks: Promise<Hotel[]>[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const lat = centerLat - dLatTotal + ((i + 0.5) * (2 * dLatTotal)) / GRID;
      const lng = centerLng - dLngTotal + ((j + 0.5) * (2 * dLngTotal)) / GRID;
      tasks.push(
        fsqByQueryAt(apiKey, lat, lng, Math.round(cellRadiusKm * 1000), query).catch(
          () => [] as Hotel[],
        ),
      );
    }
  }
  const results = await Promise.all(tasks);
  const total = results.reduce((sum, r) => sum + r.length, 0);
  console.log(
    `[fsq grid] query="${query}" cells=${tasks.length} cellRadius=${cellRadiusKm.toFixed(2)}km totalResults=${total}`,
  );
  return results.flat();
}

/** Combina:
 *  1) busca por categoria com paginação (até 300, FSQ ranqueia "hotéis principais")
 *  2) grade de sub-buscas por palavra-chave (pega hotéis "ocultos" pelo FSQ)
 *  Caller dedupa via mergeHotels. */
async function fsqSearch(
  apiKey: string,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
): Promise<Hotel[]> {
  const baseParams = new URLSearchParams({
    ll: `${centerLat},${centerLng}`,
    radius: String(Math.min(100_000, Math.max(50, Math.round(radiusKm * 1000)))),
  });

  console.log(
    `[fsq] strategy: ${radiusKm > 2.5 ? 'GRID' : 'SIMPLE'} | center=${centerLat.toFixed(4)},${centerLng.toFixed(4)} | radius=${radiusKm}km`,
  );

  if (radiusKm <= 2.5) {
    const [byCat, byHotel, byPousada] = await Promise.all([
      fsqByCategory(apiKey, baseParams),
      fsqByQueryAt(apiKey, centerLat, centerLng, Math.round(radiusKm * 1000), 'hotel').catch(
        (e) => {
          console.warn('[fsq] simple hotel query failed:', e);
          return [] as Hotel[];
        },
      ),
      fsqByQueryAt(apiKey, centerLat, centerLng, Math.round(radiusKm * 1000), 'pousada').catch(
        (e) => {
          console.warn('[fsq] simple pousada query failed:', e);
          return [] as Hotel[];
        },
      ),
    ]);
    console.log(`[fsq] simple results: cat=${byCat.length} hotel=${byHotel.length} pousada=${byPousada.length}`);
    return [...byCat, ...byHotel, ...byPousada];
  }

  const [byCat, gridHotel, gridPousada] = await Promise.all([
    fsqByCategory(apiKey, baseParams),
    fsqGridQuery(apiKey, centerLat, centerLng, radiusKm, 'hotel'),
    fsqGridQuery(apiKey, centerLat, centerLng, radiusKm, 'pousada'),
  ]);
  console.log(
    `[fsq] grid results: cat=${byCat.length} gridHotel=${gridHotel.length} gridPousada=${gridPousada.length}`,
  );
  return [...byCat, ...gridHotel, ...gridPousada];
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
  return fsqSearch(apiKey, lat, lng, radiusKm);
}

export async function fetchHotelsFsqBbox(
  apiKey: string,
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<Hotel[]> {
  // Converte bbox em centro+raio aproximado pra reusar a estratégia spatial
  const lat = (north + south) / 2;
  const lng = (east + west) / 2;
  const halfDiagKm =
    Math.sqrt(
      Math.pow(((north - south) / 2) * 111, 2) +
        Math.pow(((east - west) / 2) * 111 * Math.cos((lat * Math.PI) / 180), 2),
    );
  return fsqSearch(apiKey, lat, lng, Math.min(50, halfDiagKm));
}

