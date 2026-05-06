import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { City, Hotel, Route, Settings, Vehicle } from '../types';
import type { Profile } from '../lib/supabase';
import {
  schedulePushSettings,
  pushVehicleInsert,
  pushVehicleDelete,
  pushVehicleUpdate,
} from '../lib/sync';

interface State {
  // auth
  session: Session | null;
  profile: Profile | null;
  authReady: boolean;

  // city & hotels
  selectedCity?: City;
  hotels: Hotel[];
  selectedHotelIds: string[];
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
  navigationMode: boolean;
  currentStopIndex: number;
  welcomeSeen: boolean;
  requestZoomOnNextLocation: boolean;
  flyToTarget?: { lat: number; lng: number; zoom?: number; ts: number };
  // diagnóstico de busca: quantos vieram de cada fonte
  lastSearchSources?: {
    foursquare: number;
    osm: number;
    merged: number;
    fsqError?: string;
    fsqNames?: string[];
    osmNames?: string[];
    mergedNames?: string[];
  };

  // auth actions
  setSession: (s: Session | null) => void;
  setProfile: (p: Profile | null) => void;
  setAuthReady: (b: boolean) => void;
  resetUserData: () => void;

  // sync helpers
  setVehicles: (vs: Vehicle[]) => void;
  replaceSettings: (s: Settings) => void;

  // domain actions
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
  startNavigation: () => void;
  stopNavigation: () => void;
  setCurrentStopIndex: (i: number) => void;
  markWelcomeSeen: () => void;
  requestLocationZoom: () => void;
  clearLocationZoomRequest: () => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setLastSearchSources: (s: State['lastSearchSources']) => void;
  reset: () => void;
}

const localId = () => Math.random().toString(36).slice(2, 10);
const newUuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : localId() + '-' + localId();

const defaultSettings: Settings = {
  openaiModel: 'gpt-4o-mini',
  searchRadiusKm: 5,
  showRadiusCircle: true,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      authReady: false,

      selectedCity: undefined,
      hotels: [],
      selectedHotelIds: [],
      vehicles: [],
      settings: defaultSettings,
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
      navigationMode: false,
      currentStopIndex: 0,
      welcomeSeen: false,
      requestZoomOnNextLocation: false,
      flyToTarget: undefined,

      setSession: (s) => set({ session: s }),
      setProfile: (p) => set({ profile: p }),
      setAuthReady: (b) => set({ authReady: b }),
      resetUserData: () =>
        set({
          profile: null,
          vehicles: [],
          settings: defaultSettings,
          hotels: [],
          route: undefined,
          selectedCity: undefined,
          navigationMode: false,
          liveTracking: false,
          followMe: false,
        }),

      setVehicles: (vs) => set({ vehicles: vs }),
      replaceSettings: (s) => set({ settings: s }),

      setCity: (city) => set({ selectedCity: city, hotels: [], route: undefined }),
      setHotels: (hotels) => set({ hotels }),
      updateHotelGuests: (hotelId, guests) => {
        const hotels = get().hotels.map((h) =>
          h.id === hotelId ? { ...h, guests: Math.max(0, Math.floor(guests)) } : h,
        );
        set({ hotels, route: undefined });
      },
      addVehicle: (v) => {
        const userId = get().session?.user.id;
        const vehicle: Vehicle = { ...v, id: newUuid() };
        set({ vehicles: [...get().vehicles, vehicle] });
        if (userId) {
          void pushVehicleInsert(userId, vehicle);
        }
      },
      updateVehicle: (vid, patch) => {
        const updated = get().vehicles.map((v) => (v.id === vid ? { ...v, ...patch } : v));
        set({ vehicles: updated });
        const v = updated.find((x) => x.id === vid);
        if (v && get().session) {
          void pushVehicleUpdate(v);
        }
      },
      removeVehicle: (vid) => {
        set({ vehicles: get().vehicles.filter((v) => v.id !== vid) });
        if (get().session) {
          void pushVehicleDelete(vid);
        }
      },
      setSettings: (patch) => {
        const next = { ...get().settings, ...patch };
        set({ settings: next });
        const userId = get().session?.user.id;
        if (userId) {
          schedulePushSettings(userId, next);
        }
      },
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
              id: `manual-${localId()}`,
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
          followMe: b ? true : false,
        }),
      setLiveAccuracy: (m) => set({ liveAccuracyM: m }),
      setLiveError: (e) => set({ liveError: e }),
      setFollowMe: (b) => set({ followMe: b }),
      startNavigation: () =>
        set({
          navigationMode: true,
          currentStopIndex: 0,
          liveTracking: true,
          followMe: true,
        }),
      stopNavigation: () => set({ navigationMode: false }),
      setCurrentStopIndex: (i) => set({ currentStopIndex: i }),
      markWelcomeSeen: () => set({ welcomeSeen: true }),
      requestLocationZoom: () => set({ requestZoomOnNextLocation: true }),
      clearLocationZoomRequest: () => set({ requestZoomOnNextLocation: false }),
      flyTo: (lat, lng, zoom) =>
        set({ flyToTarget: { lat, lng, zoom, ts: Date.now() } }),
      setLastSearchSources: (s) => set({ lastSearchSources: s }),
      reset: () => set({ hotels: [], route: undefined, selectedCity: undefined }),
    }),
    {
      // bump pra v3 — agora settings/vehicles vêm do Supabase, não persistimos local.
      name: 'jf-system-v3',
      partialize: (s) => ({
        welcomeSeen: s.welcomeSeen,
        liveTracking: s.liveTracking,
      }),
    },
  ),
);
