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

/**
 * Melhora a rota produzida pelo nearest-neighbor com 2-opt local search.
 *
 * Ideia: NN é guloso, às vezes fecha numa ordem ruim (ex.: visita um hotel
 * próximo cedo demais e depois faz desvios). 2-opt varre todos os pares de
 * arestas (i→i+1, j→j+1), inverte o segmento entre elas se a soma das duas
 * arestas resultantes for menor. Repete até nenhum swap melhorar.
 *
 * Suporta dois modos:
 *  - Open path  (sem `end`): `start` é fixo, último ponto é qualquer um
 *  - Closed path (com `end`): `start` e `end` são fixos
 *
 * Tipicamente reduz a distância em 5-15% sobre o NN puro.
 */
export function twoOpt(
  start: LatLng,
  stops: RouteStop[],
  end?: LatLng,
): RouteStop[] {
  if (stops.length < 3) return stops;
  const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    haversineKm(a, b);
  let route = stops.slice();
  const n = route.length;
  const MAX_ITER = 200;
  let iter = 0;
  let improved = true;

  while (improved && iter < MAX_ITER) {
    improved = false;
    iter++;
    for (let i = -1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const A = i === -1 ? start : { lat: route[i].lat, lng: route[i].lng };
        const B = { lat: route[i + 1].lat, lng: route[i + 1].lng };
        const C = { lat: route[j].lat, lng: route[j].lng };
        const D =
          j + 1 < n
            ? { lat: route[j + 1].lat, lng: route[j + 1].lng }
            : (end ?? null);

        let delta: number;
        if (D) {
          // standard 2-opt: troca arestas A→B,C→D por A→C,B→D
          delta = dist(A, C) + dist(B, D) - (dist(A, B) + dist(C, D));
        } else {
          // open path com end livre: só a aresta A→B muda
          delta = dist(A, C) - dist(A, B);
        }

        if (delta < -1e-6) {
          const reversed = route.slice(i + 1, j + 1).reverse();
          route = [...route.slice(0, i + 1), ...reversed, ...route.slice(j + 1)];
          improved = true;
        }
      }
    }
  }

  return route.map((s, idx) => ({ ...s, order: idx + 1 }));
}

/**
 * Brute-force exato sobre todas as permutações dos hotéis.
 * Garante o ótimo global em distância haversine — ideal pra n pequeno.
 *
 * Use quando `hotels.length <= 9`:
 *   3 stops →     6 permutações (<1ms)
 *   5 stops →   120 permutações (<1ms)
 *   8 stops → 40320 permutações (~5ms)
 *   9 stops → 362880 permutações (~50ms)
 *  10 stops → 3.6M  permutações  (~500ms — cai pra heurística aqui)
 *
 * NN+2-opt pode parar em mínimos locais (especialmente com 3-5 paradas onde
 * 2-opt não alcança todas as permutações). Brute-force resolve isso.
 *
 * Suporta destino opcional (`end`); sem ele, soma só os legs origem→...→último.
 */
export function exactOrder(
  origin: LatLng,
  hotels: Hotel[],
  end?: LatLng,
): RouteStop[] {
  if (hotels.length === 0) return [];
  if (hotels.length === 1) {
    const h = hotels[0];
    return [
      {
        hotelId: h.id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        guests: h.guests,
        order: 1,
      },
    ];
  }

  const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
    haversineKm(a, b);

  let bestOrder: number[] = [];
  let bestTotal = Infinity;
  const indices = hotels.map((_, i) => i);

  // Permutações in-place via backtracking (Heap's algorithm não é necessário;
  // este simples swap-back é OK).
  const arr = indices.slice();
  function permute(start: number) {
    if (start === arr.length) {
      let total = 0;
      let prev: LatLng = origin;
      for (const idx of arr) {
        total += dist(prev, hotels[idx]);
        prev = { lat: hotels[idx].lat, lng: hotels[idx].lng };
      }
      if (end) total += dist(prev, end);
      if (total < bestTotal) {
        bestTotal = total;
        bestOrder = arr.slice();
      }
      return;
    }
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      permute(start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }
  permute(0);

  return bestOrder.map((idx, i) => {
    const h = hotels[idx];
    return {
      hotelId: h.id,
      name: h.name,
      lat: h.lat,
      lng: h.lng,
      guests: h.guests,
      order: i + 1,
    };
  });
}

/**
 * Estratégia recomendada: ótimo exato pra n pequeno, heurística pra n grande.
 * Acima de `EXACT_THRESHOLD`, brute-force fica caro demais (10! = 3.6M).
 */
const EXACT_THRESHOLD = 9;

export function optimizeOrder(
  origin: LatLng,
  hotels: Hotel[],
  end?: LatLng,
): RouteStop[] {
  if (hotels.length <= EXACT_THRESHOLD) {
    return exactOrder(origin, hotels, end);
  }
  // Fallback heurístico: NN + 2-opt
  const nn = nearestNeighborOrder(origin, hotels);
  return twoOpt(origin, nn, end);
}
