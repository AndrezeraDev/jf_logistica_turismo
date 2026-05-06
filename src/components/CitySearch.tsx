import { useState } from 'react';
import { Search, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { searchCity } from '../lib/nominatim';
import { fetchHotelsInCity } from '../lib/overpass';
import { fetchHotelsFsqBbox } from '../lib/foursquare';
import { mergeHotels } from '../lib/mergeHotels';
import { useStore } from '../store/useStore';
import type { City, Hotel } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

export function CitySearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const [citySearchError, setCitySearchError] = useState<string | undefined>();

  const setCity = useStore((s) => s.setCity);
  const setHotels = useStore((s) => s.setHotels);
  const setHotelsLoading = useStore((s) => s.setHotelsLoading);
  const setHotelsError = useStore((s) => s.setHotelsError);
  const markHotelsFetched = useStore((s) => s.markHotelsFetched);
  const hotelsLoading = useStore((s) => s.hotelsLoading);
  const hotelsError = useStore((s) => s.hotelsError);
  const selectedCity = useStore((s) => s.selectedCity);
  const hotels = useStore((s) => s.hotels);
  const hotelsFetchedAt = useStore((s) => s.hotelsFetchedAt);

  async function doSearch() {
    if (!q.trim()) return;
    setCitySearchLoading(true);
    setCitySearchError(undefined);
    try {
      const r = await searchCity(q);
      if (r.length === 0) {
        setCitySearchError('Nenhuma cidade encontrada com esse nome.');
      }
      setResults(r);
      setOpen(true);
    } catch (e) {
      setCitySearchError(e instanceof Error ? e.message : String(e));
    } finally {
      setCitySearchLoading(false);
    }
  }

  async function loadHotels(city: City) {
    setHotelsLoading(true);
    setHotelsError(undefined);
    try {
      const fsqKey = useStore.getState().settings.foursquareApiKey?.trim();
      const [south, north, west, east] = city.boundingBox;
      // Foursquare primeiro (resultado mais preciso quando há key), OSM depois.
      const tasks: Promise<Hotel[]>[] = [];
      if (fsqKey) {
        tasks.push(
          fetchHotelsFsqBbox(fsqKey, south, west, north, east).catch((e) => {
            console.warn('[foursquare]', e);
            return [];
          }),
        );
      }
      tasks.push(
        fetchHotelsInCity(city).catch((e) => {
          console.warn('[overpass]', e);
          return [];
        }),
      );
      const results = await Promise.all(tasks);
      const merged = mergeHotels(results.flat());
      setHotels(merged);
      markHotelsFetched();
    } catch (e) {
      setHotelsError(
        e instanceof Error
          ? `Falha ao buscar hotéis: ${e.message}`
          : 'Falha ao buscar hotéis. Tente novamente.',
      );
    } finally {
      setHotelsLoading(false);
    }
  }

  async function selectCity(c: City) {
    setCity(c);
    setOpen(false);
    setQ(c.displayName.split(',')[0]);
    await loadHotels(c);
  }

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder="Buscar cidade (ex: Florianópolis)"
          className="pl-9"
        />
        {citySearchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-ink-400" />
        )}
      </div>

      {citySearchError && (
        <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{citySearchError}</span>
        </div>
      )}

      {hotelsLoading && (
        <div className="flex items-center gap-2 text-[12px] text-ink-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Mapeando hotéis da região…
        </div>
      )}

      {hotelsError && (
        <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{hotelsError}</span>
          </div>
          {selectedCity && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadHotels(selectedCity)}
              className="w-full text-red-200 hover:bg-red-500/10"
            >
              <RefreshCw className="w-3 h-3" /> Tentar novamente
            </Button>
          )}
        </div>
      )}

      {selectedCity && !hotelsLoading && !hotelsError && hotelsFetchedAt && hotels.length === 0 && (
        <div className="text-[11px] text-amber-200 bg-amber-300/10 border border-amber-300/20 rounded-lg px-3 py-2 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Nenhum hotel cadastrado no OpenStreetMap para esta área. Tente uma cidade maior
              ou use <b>"Buscar hotéis nesta área"</b> após dar zoom no mapa.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadHotels(selectedCity)}
            className="w-full"
          >
            <RefreshCw className="w-3 h-3" /> Recarregar
          </Button>
        </div>
      )}

      {selectedCity && !hotelsLoading && (
        <div className="text-[12px] text-ink-300 truncate">
          📍 {selectedCity.displayName.split(',').slice(0, 2).join(',')}
        </div>
      )}

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 left-0 right-0 top-[44px] glass rounded-xl overflow-hidden"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectCity(r)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.08] text-[13px] transition-colors border-b border-white/5 last:border-0"
              >
                <div className="text-ink-100 truncate">
                  {r.displayName.split(',').slice(0, 3).join(',')}
                </div>
                <div className="text-ink-400 text-[11px] truncate">{r.displayName}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
