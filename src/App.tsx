import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Crosshair, Plus } from 'lucide-react';
import { Sidebar, Tab } from './components/Sidebar';
import { MapView } from './components/MapView';
import { CitySearch } from './components/CitySearch';
import { GuestModal } from './components/GuestModal';
import { AddHotelModal } from './components/AddHotelModal';
import { FleetPanel } from './components/FleetPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { RoutePanel } from './components/RoutePanel';
import { useStore } from './store/useStore';
import { useLiveLocation } from './lib/useLiveLocation';
import type { Hotel } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('map');
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
  const [newHotelAt, setNewHotelAt] = useState<{ lat: number; lng: number } | null>(null);
  const hotels = useStore((s) => s.hotels);
  const updateHotelGuests = useStore((s) => s.updateHotelGuests);
  const addManualHotel = useStore((s) => s.addManualHotel);
  const pickingOrigin = useStore((s) => s.pickingOrigin);
  const setPickingOrigin = useStore((s) => s.setPickingOrigin);
  const addingHotel = useStore((s) => s.addingHotel);
  const setAddingHotel = useStore((s) => s.setAddingHotel);

  useLiveLocation();

  const hotelsWithGuests = useMemo(() => hotels.filter((h) => h.guests > 0).length, [hotels]);

  return (
    <div className="h-full w-full flex bg-[#0b0b0d] text-ink-100">
      <Sidebar tab={tab} setTab={setTab} />

      {/* Lateral painel */}
      <div className="w-[360px] flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-4 pt-4 pb-3">
          <div className="text-[11px] text-ink-400 uppercase tracking-[0.15em]">JF System</div>
          <div className="text-[22px] font-semibold tracking-tight">
            {tab === 'map' && 'Logística turística'}
            {tab === 'fleet' && 'Frota da empresa'}
            {tab === 'settings' && 'Configurações'}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
          <AnimatePresence mode="wait">
            {tab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <CitySearch />

                {hotels.length > 0 && (
                  <div className="text-[12px] text-ink-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    {hotels.length} hotéis •{' '}
                    <span className="text-emerald-400">
                      {hotelsWithGuests} com hóspedes
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setAddingHotel(true)}
                  className="w-full h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/15 text-[12px] text-ink-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar hotel manualmente
                </button>

                {hotels.length > 0 && hotels.length < 5 && (
                  <div className="text-[11px] text-ink-400 leading-relaxed px-1">
                    Faltando hotéis? O OpenStreetMap é comunitário e pode não ter tudo cadastrado.
                    Use <b>"Adicionar hotel manualmente"</b> acima para incluir os que faltam.
                  </div>
                )}

                <RoutePanel />
              </motion.div>
            )}
            {tab === 'fleet' && (
              <motion.div
                key="fleet"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <FleetPanel />
              </motion.div>
            )}
            {tab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <SettingsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 py-3 border-t border-white/5 text-[10px] text-ink-400 flex items-center justify-between">
          <span>Dados © OpenStreetMap</span>
          <span className="font-mono">v0.1</span>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <MapView onHotelClick={setActiveHotel} onAddHotelAt={setNewHotelAt} />

        <AnimatePresence>
          {pickingOrigin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass rounded-full px-4 py-2 text-[12px] flex items-center gap-2 shadow-glass"
            >
              <Crosshair className="w-3.5 h-3.5 text-accent" />
              Clique no mapa para marcar seu local
              <button
                onClick={() => setPickingOrigin(false)}
                className="ml-2 text-ink-400 hover:text-ink-100 text-[11px]"
              >
                cancelar
              </button>
            </motion.div>
          )}
          {addingHotel && (
            <motion.div
              key="add-hotel-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass rounded-full px-4 py-2 text-[12px] flex items-center gap-2 shadow-glass"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Clique no mapa para adicionar um hotel
              <button
                onClick={() => setAddingHotel(false)}
                className="ml-2 text-ink-400 hover:text-ink-100 text-[11px]"
              >
                cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {hotels.length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass rounded-2xl px-6 py-5 max-w-sm text-center"
            >
              <div className="text-[15px] font-semibold">Busque uma cidade</div>
              <div className="text-[12px] text-ink-400 mt-1">
                Os hotéis aparecerão no mapa. Clique em cada um para atribuir hóspedes e depois em <b>Rodar otimização</b>.
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <GuestModal
        hotel={activeHotel}
        onClose={() => setActiveHotel(null)}
        onSave={(guests) => {
          if (activeHotel) updateHotelGuests(activeHotel.id, guests);
          setActiveHotel(null);
        }}
      />

      <AddHotelModal
        point={newHotelAt}
        onClose={() => setNewHotelAt(null)}
        onSave={({ name, guests }) => {
          if (newHotelAt) {
            addManualHotel({ name, lat: newHotelAt.lat, lng: newHotelAt.lng, guests });
          }
          setNewHotelAt(null);
        }}
      />
    </div>
  );
}
