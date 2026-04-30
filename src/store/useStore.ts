import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { City, Hotel, Route, Settings, Vehicle } from '../types';

interface State {
  // city & hotels
  selectedCity?: City;
  hotels: Hotel[];
  selectedHotelIds: string[]; // hotéis com hóspedes atribuídos (guests > 0 after assignment)
  // fleet
  vehicles: Vehicle[];
  // settings
  settings: Settings;
  // computed
  route?: Route;
  aiLoading: boolean;
  aiError?: string;
  pickingOrigin: boolean;
  addingHotel: boolean;
  hotelsLoading: boolean;
  hotelsError?: string;
  hotelsFetchedAt?: number;
  liveTracking: boolean;
  liveAccuracyM?: number;
  liveError?: string;
  followMe: boolean;

  // actions
  setCity: (city: City | undefined) => void;
  setHotels: (hotels: Hotel[]) => void;
  updateHotelGuests: (id: string, guests: number) => void;
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setRoute: (r: Route | undefined) => void;
  setAiLoading: (b: boolean) => void;
  setAiError: (e: string | undefined) => void;
  setPickingOrigin: (b: boolean) => void;
  setAddingHotel: (b: boolean) => void;
  addManualHotel: (h: { name: string; lat: number; lng: number; guests: number }) => void;
  setHotelsLoading: (b: boolean) => void;
  setHotelsError: (e: string | undefined) => void;
  markHotelsFetched: () => void;
  setLiveTracking: (b: boolean) => void;
  setLiveAccuracy: (m: number | undefined) => void;
  setLiveError: (e: string | undefined) => void;
  setFollowMe: (b: boolean) => void;
  reset: () => void;
}

const id = () => Math.random().toString(36).slice(2, 10);

const defaultVehicles: Vehicle[] = [
  { id: id(), name: 'Carro Executivo', type: 'carro', capacity: 4 },
  { id: id(), name: 'SUV 7 lugares', type: 'carro', capacity: 7 },
  { id: id(), name: 'Van 15 lugares', type: 'van', capacity: 15 },
  { id: id(), name: 'Micro-ônibus 30', type: 'micro-onibus', capacity: 30 },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      selectedCity: undefined,
      hotels: [],
      selectedHotelIds: [],
      vehicles: defaultVehicles,
      settings: {
        openaiModel: 'gpt-4o-mini',
        searchRadiusKm: 5,
        showRadiusCircle: true,
      },
      route: undefined,
      aiLoading: false,
      aiError: undefined,
      pickingOrigin: false,
      addingHotel: false,
      hotelsLoading: false,
      hotelsError: undefined,
      hotelsFetchedAt: undefined,
      liveTracking: false,
      liveAccuracyM: undefined,
      liveError: undefined,
      followMe: false,

      setCity: (city) => set({ selectedCity: city, hotels: [], route: undefined }),
      setHotels: (hotels) => set({ hotels }),
      updateHotelGuests: (hotelId, guests) => {
        const hotels = get().hotels.map((h) =>
          h.id === hotelId ? { ...h, guests: Math.max(0, Math.floor(guests)) } : h,
        );
        set({ hotels, route: undefined });
      },
      addVehicle: (v) => set({ vehicles: [...get().vehicles, { ...v, id: id() }] }),
      updateVehicle: (vid, patch) =>
        set({
          vehicles: get().vehicles.map((v) => (v.id === vid ? { ...v, ...patch } : v)),
        }),
      removeVehicle: (vid) =>
        set({ vehicles: get().vehicles.filter((v) => v.id !== vid) }),
      setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      setRoute: (r) => set({ route: r }),
      setAiLoading: (b) => set({ aiLoading: b }),
      setAiError: (e) => set({ aiError: e }),
      setPickingOrigin: (b) => set({ pickingOrigin: b }),
      setAddingHotel: (b) => set({ addingHotel: b }),
      addManualHotel: ({ name, lat, lng, guests }) =>
        set({
          hotels: [
            ...get().hotels,
            {
              id: `manual-${id()}`,
              name: name.trim() || 'Hotel personalizado',
              lat,
              lng,
              address: 'Adicionado manualmente',
              guests: Math.max(0, Math.floor(guests)),
            },
          ],
          addingHotel: false,
        }),
      setHotelsLoading: (b) => set({ hotelsLoading: b }),
      setHotelsError: (e) => set({ hotelsError: e }),
      markHotelsFetched: () => set({ hotelsFetchedAt: Date.now() }),
      setLiveTracking: (b) =>
        set({
          liveTracking: b,
          liveError: undefined,
          // ao ligar tracking, segue automaticamente; ao desligar, para de seguir
          followMe: b ? true : false,
        }),
      setLiveAccuracy: (m) => set({ liveAccuracyM: m }),
      setLiveError: (e) => set({ liveError: e }),
      setFollowMe: (b) => set({ followMe: b }),
      reset: () => set({ hotels: [], route: undefined, selectedCity: undefined }),
    }),
    {
      name: 'jf-system',
      partialize: (s) => ({
        vehicles: s.vehicles,
        settings: s.settings,
      }),
    },
  ),
);
