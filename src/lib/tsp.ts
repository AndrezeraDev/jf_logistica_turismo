import { haversineKm } from './geo';
import type { Hotel, LatLng, RouteStop } from '../types';

/**
 * Nearest-neighbor TSP a partir da origem.
 * Sempre escolhe o hotel mais próximo do ponto atual até visitar todos.
 */
export function nearestNeighborOrder(origin: LatLng, hotels: Hotel[]): RouteStop[] {
  const remaining = hotels.slice();
  const ordered: RouteStop[] = [];
  let current: LatLng = origin;
  let order = 1;

  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push({
      hotelId: next.id,
      name: next.name,
      lat: next.lat,
      lng: next.lng,
      guests: next.guests,
      order: order++,
    });
    current = { lat: next.lat, lng: next.lng };
  }
  return ordered;
}

/**
 * Para o retorno, usamos a mesma estratégia de nearest-neighbor
 * (do último ponto de coleta até deixar todos, voltando à origem),
 * mas partindo do último hotel visitado.
 */
export function nearestNeighborReturn(
  startFrom: LatLng,
  stops: RouteStop[],
): RouteStop[] {
  return nearestNeighborOrder(
    startFrom,
    stops.map((s) => ({
      id: s.hotelId,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      guests: s.guests,
    })),
  );
}
