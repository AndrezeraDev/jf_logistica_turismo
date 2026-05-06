import type { Route, Vehicle } from '../types';
import { haversineKm } from './geo';

/** Consumo padrão (km/L) por tipo de veículo quando o usuário não preencheu. */
export function defaultConsumption(type: Vehicle['type']): number {
  switch (type) {
    case 'carro':
      return 11;
    case 'van':
      return 8;
    case 'micro-onibus':
      return 5;
    case 'onibus':
      return 3;
    case 'outro':
      return 10;
  }
}

export function consumptionOf(v: Vehicle): number {
  return v.fuelConsumptionKmL && v.fuelConsumptionKmL > 0
    ? v.fuelConsumptionKmL
    : defaultConsumption(v.type);
}

export interface EconomyCalc {
  /** Custo de combustível desta rota otimizada */
  fuelCost: number;
  /** Distância "ingênua": 1 ida-volta separada para cada hotel */
  naiveDistanceKm: number;
  /** Custo da abordagem ingênua */
  naiveFuelCost: number;
  /** Economia em km */
  savedKm: number;
  /** Economia em R$ */
  savedMoney: number;
  /** Economia em % */
  savedPercent: number;
  /** Consumo usado no cálculo */
  consumptionKmL: number;
}

export function calcEconomy(
  route: Route,
  vehicle: Vehicle | undefined,
  fuelPricePerLiter: number,
): EconomyCalc {
  // Se não tiver veículo selecionado, usa consumo médio
  const consumptionKmL = vehicle ? consumptionOf(vehicle) : 8;

  const fuelCost = (route.totalDistanceKm / consumptionKmL) * fuelPricePerLiter;

  // Cenário "sem sistema": uma ida-e-volta separada para cada hotel
  // a partir do ponto de partida — o que faria sem otimizar.
  const naiveDistanceKm = route.stops.reduce(
    (sum, s) => sum + 2 * haversineKm(route.origin, { lat: s.lat, lng: s.lng }),
    0,
  );
  const naiveFuelCost = (naiveDistanceKm / consumptionKmL) * fuelPricePerLiter;

  const savedKm = Math.max(0, naiveDistanceKm - route.totalDistanceKm);
  const savedMoney = Math.max(0, naiveFuelCost - fuelCost);
  const savedPercent = naiveDistanceKm > 0 ? (savedKm / naiveDistanceKm) * 100 : 0;

  return {
    fuelCost,
    naiveDistanceKm,
    naiveFuelCost,
    savedKm,
    savedMoney,
    savedPercent,
    consumptionKmL,
  };
}

export const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(v);
