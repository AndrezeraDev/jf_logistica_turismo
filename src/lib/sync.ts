import { supabase, type Profile } from './supabase';
import { useStore } from '../store/useStore';
import type { Settings, Vehicle } from '../types';

let settingsDebounce: ReturnType<typeof setTimeout> | null = null;

export async function hydrateFromSupabase(userId: string) {
  const [profileRes, settingsRes, vehiclesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  const store = useStore.getState();
  store.setProfile((profileRes.data as Profile | null) || null);

  const vehicles: Vehicle[] = (vehiclesRes.data || []).map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    capacity: v.capacity,
  }));
  store.setVehicles(vehicles);

  if (settingsRes.data) {
    const s = settingsRes.data;
    const newSettings: Settings = {
      origin:
        s.origin_lat != null && s.origin_lng != null
          ? { lat: s.origin_lat, lng: s.origin_lng, label: s.origin_label || '' }
          : undefined,
      searchRadiusKm: s.search_radius_km ?? 5,
      showRadiusCircle: s.show_radius_circle ?? true,
      openaiApiKey: s.openai_api_key || undefined,
      openaiModel: s.openai_model || 'gpt-4o-mini',
      orsApiKey: s.ors_api_key || undefined,
      foursquareApiKey: s.foursquare_api_key || undefined,
    };
    store.replaceSettings(newSettings);
  }
}

export function schedulePushSettings(userId: string | undefined, settings: Settings) {
  if (!userId) return;
  if (settingsDebounce) clearTimeout(settingsDebounce);
  settingsDebounce = setTimeout(() => {
    void supabase
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          origin_lat: settings.origin?.lat ?? null,
          origin_lng: settings.origin?.lng ?? null,
          origin_label: settings.origin?.label ?? null,
          search_radius_km: settings.searchRadiusKm ?? 5,
          show_radius_circle: settings.showRadiusCircle ?? true,
          openai_api_key: settings.openaiApiKey ?? null,
          openai_model: settings.openaiModel ?? 'gpt-4o-mini',
          ors_api_key: settings.orsApiKey ?? null,
          foursquare_api_key: settings.foursquareApiKey ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .then((res) => {
        if (res.error) console.error('[sync] settings:', res.error.message);
      });
  }, 700);
}

export async function pushVehicleInsert(userId: string, vehicle: Vehicle): Promise<void> {
  const { error } = await supabase.from('vehicles').insert({
    id: vehicle.id,
    user_id: userId,
    name: vehicle.name,
    type: vehicle.type,
    capacity: vehicle.capacity,
  });
  if (error) console.error('[sync] vehicle insert:', error.message);
}

export async function pushVehicleDelete(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) console.error('[sync] vehicle delete:', error.message);
}

export async function pushVehicleUpdate(vehicle: Vehicle): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ name: vehicle.name, type: vehicle.type, capacity: vehicle.capacity })
    .eq('id', vehicle.id);
  if (error) console.error('[sync] vehicle update:', error.message);
}
