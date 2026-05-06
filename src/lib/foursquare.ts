import type { Hotel } from '../types';

// Service API (Bearer key — gerada no developer.foursquare.com).
// Endpoint novo (a partir de 2024): places-api.foursquare.com/places/search
const FSQ_URL = 'https://places-api.foursquare.com/places/search';
const FSQ_API_VERSION = '2025-06-17';
const FSQ_TIMEOUT_MS = 12_000;

// Categoria 19014 = Lodging (umbrella: hotel, hostel, B&B, motel, resort, etc).
const LODGING_CATEGORY = '19014';

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

async function fsqSearch(apiKey: string, params: URLSearchParams): Promise<Hotel[]> {
  params.set('categories', LODGING_CATEGORY);
  params.set('limit', '50');
  const url = `${FSQ_URL}?${params.toString()}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FSQ_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Places-Api-Version': FSQ_API_VERSION,
        Accept: 'application/json',
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Foursquare HTTP ${res.status}: ${txt.slice(0, 180)}`);
    }
    const data = (await res.json()) as { results?: RawPlace[] };
    return parseFsq(data.results || []);
  } finally {
    clearTimeout(t);
  }
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
