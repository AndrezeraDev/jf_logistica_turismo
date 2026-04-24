import type { City } from '../types';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

export async function searchCity(query: string): Promise<City[]> {
  const url =
    `${ENDPOINT}?q=${encodeURIComponent(query)}` +
    `&format=json&addressdetails=1&limit=8&accept-language=pt-BR`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'pt-BR' },
  });
  if (!res.ok) throw new Error('Falha ao buscar cidade');
  const data: Array<{
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
    class?: string;
    type?: string;
  }> = await res.json();
  return data
    .filter((d) => !!d.boundingbox)
    .map((d) => ({
      displayName: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
      boundingBox: [
        parseFloat(d.boundingbox[0]),
        parseFloat(d.boundingbox[1]),
        parseFloat(d.boundingbox[2]),
        parseFloat(d.boundingbox[3]),
      ] as [number, number, number, number],
    }));
}

export interface AddressHit {
  displayName: string;
  lat: number;
  lng: number;
}

export async function searchAddress(query: string): Promise<AddressHit[]> {
  const url =
    `${ENDPOINT}?q=${encodeURIComponent(query)}` +
    `&format=json&addressdetails=1&limit=6&accept-language=pt-BR`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
  if (!res.ok) throw new Error('Falha ao buscar endereço');
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
  return data.map((d) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`;
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}
