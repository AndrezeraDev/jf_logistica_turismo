export interface LatLng {
  lat: number;
  lng: number;
}

export interface Hotel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  guests: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'carro' | 'van' | 'micro-onibus' | 'onibus' | 'outro';
  capacity: number;
  fuelConsumptionKmL?: number; // km/L. Se null, usa default por tipo.
}

export interface City {
  displayName: string;
  lat: number;
  lng: number;
  boundingBox: [number, number, number, number]; // [south, north, west, east]
}

export interface RouteStop {
  hotelId: string;
  name: string;
  lat: number;
  lng: number;
  guests: number;
  order: number;
}

export interface Route {
  origin: LatLng;
  stops: RouteStop[];
  returnStops: RouteStop[];
  polyline: LatLng[]; // pickup leg
  returnPolyline: LatLng[]; // return leg
  totalDistanceKm: number;
  totalDurationMin: number;
  totalGuests: number;
  suggestedVehicleId?: string;
  aiSuggestion?: string;
  usedFallback?: boolean; // true = OSRM falhou, traçado é em linha reta
  routingEngine?: string; // host do OSRM que respondeu
  trafficDelayMin?: number; // atraso somado por trânsito (TomTom — pickup+return)
}

export interface Settings {
  openaiApiKey?: string;
  openaiModel?: string;
  orsApiKey?: string; // OpenRouteService
  foursquareApiKey?: string; // Foursquare Places (cobertura extra de hotéis)
  tomtomApiKey?: string; // TomTom (rotas com trânsito real-time)
  showTrafficOverlay?: boolean; // toggle pra mostrar overlay de trânsito no mapa
  origin?: LatLng & { label?: string };
  destination?: LatLng & { label?: string }; // saída da cidade / fim da viagem
  searchRadiusKm?: number;
  showRadiusCircle?: boolean;
  fuelPricePerLiter?: number; // R$/L
  maxStopMinutes?: number; // tempo máximo em cada hotel (embarque/espera). Soma na duração total.
}
