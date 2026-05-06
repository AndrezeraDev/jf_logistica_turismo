import type { Hotel } from '../types';
import { haversineKm } from './geo';

/**
 * Une hotéis vindos de fontes diferentes (OSM + Foursquare) e remove duplicatas.
 * Considera duplicata: nomes parecidos E distância < 80m.
 */
export function mergeHotels(all: Hotel[]): Hotel[] {
  const out: Hotel[] = [];
  for (const h of all) {
    const dup = out.find(
      (o) =>
        similarName(o.name, h.name) &&
        haversineKm({ lat: o.lat, lng: o.lng }, { lat: h.lat, lng: h.lng }) < 0.08,
    );
    if (dup) {
      // Mantém o que tem endereço melhor (não-vazio)
      if (!dup.address && h.address) dup.address = h.address;
      continue;
    }
    out.push({ ...h });
  }
  return out;
}

function similarName(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  // Match EXATO após normalização. Antes usávamos `includes` mas isso
  // engolia variantes legítimas (ex: "Hotel Fioreze Primo" sumia se
  // o OSM tinha um "Hotel Fioreze" próximo).
  return na === nb;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (acentos)
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(hotel|hostel|pousada|motel|resort)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
