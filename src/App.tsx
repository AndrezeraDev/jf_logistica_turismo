import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Crosshair, Plus, Menu, X } from 'lucide-react';
import { Sidebar, Tab } from './components/Sidebar';
import { MapView } from './components/MapView';
import { CitySearch } from './components/CitySearch';
import { GuestModal } from './components/GuestModal';
import { AddHotelModal } from './components/AddHotelModal';
import { FleetPanel } from './components/FleetPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { RoutePanel } from './components/RoutePanel';
import { NavigationOverlay } from './components/NavigationOverlay';
import { WelcomeDialog } from './components/WelcomeDialog';
import { HotelSearch } from './components/HotelSearch';
import { LoginPage } from './components/LoginPage';
import { UsersPanel } from './components/UsersPanel';
import { useStore } from './store/useStore';
import { useLiveLocation } from './lib/useLiveLocation';
import { supabase } from './lib/supabase';
import { hydrateFromSupabase } from './lib/sync';
import type { Hotel } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('map');
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
  const [newHotelAt, setNewHotelAt] = useState<{ lat: number; lng: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hotels = useStore((s) => s.hotels);
  const updateHotelGuests = useStore((s) => s.updateHotelGuests);
  const addManualHotel = useStore((s) => s.addManualHotel);
  const pickingOrigin = useStore((s) => s.pickingOrigin);
  const setPickingOrigin = useStore((s) => s.setPickingOrigin);
  const addingHotel = useStore((s) => s.addingHotel);
  const setAddingHotel = useStore((s) => s.setAddingHotel);
  const navigationMode = useStore((s) => s.navigationMode);
  const flyToMap = useStore((s) => s.flyTo);
  const session = useStore((s) => s.session);
  const authReady = useStore((s) => s.authReady);
  const setSession = useStore((s) => s.setSession);
  const setAuthReady = useStore((s) => s.setAuthReady);
  const resetUserData = useStore((s) => s.resetUserData);

  useLiveLocation();

  // Auth gate — sessão + hidratação inicial
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) {
        void hydrateFromSupabase(data.session.user.id);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        void hydrateFromSupabase(sess.user.id);
      } else {
        resetUserData();
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setAuthReady, resetUserData]);

  const hotelsWithGuests = useMemo(() => hotels.filter((h) => h.guests > 0).length, [hotels]);

  // Quando entra em modo "marcar no mapa" / "adicionar hotel", fecha o drawer
  // automaticamente (no mobile) pra deixar o mapa visível.
  useEffect(() => {
    if (pickingOrigin || addingHotel) setDrawerOpen(false);
  }, [pickingOrigin, addingHotel]);

  const panelContent = (
    <>
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div>
          <div className="text-[11px] text-ink-400 uppercase tracking-[0.15em]">JF System</div>
          <div className="text-[22px] font-semibold tracking-tight">
            {tab === 'map' && 'Logística turística'}
            {tab === 'fleet' && 'Frota da empresa'}
            {tab === 'settings' && 'Configurações'}
            {tab === 'users' && 'Usuários'}
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Fechar menu"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-ink-300 hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
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
          {tab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <UsersPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-3 border-t border-white/5 text-[10px] text-ink-400 flex items-center justify-between">
        <span>Dados © OpenStreetMap</span>
        <span className="font-mono">v0.1</span>
      </div>
    </>
  );

  // Auth gates
  if (!authReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#0b0b0d] text-ink-400 text-[13px]">
        Carregando…
      </div>
    );
  }
  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="h-full w-full flex bg-[#0b0b0d] text-ink-100 overflow-hidden">
      {/* Desktop: sidebar + painel sempre visíveis */}
      <div className="hidden md:flex">
        <Sidebar tab={tab} setTab={setTab} />
      </div>
      <div className="hidden md:flex w-[360px] flex-shrink-0 border-r border-white/5 flex-col">
        {panelContent}
      </div>

      {/* Mobile: drawer (gaveta) */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed top-0 left-0 bottom-0 z-[1101] flex md:hidden bg-[#0b0b0d] border-r border-white/5 shadow-2xl"
              style={{ width: 'min(86vw, 420px)' }}
            >
              <Sidebar
                tab={tab}
                setTab={(t) => {
                  setTab(t);
                }}
              />
              <div className="flex-1 flex flex-col">{panelContent}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mapa (sempre visível) */}
      <div className="flex-1 relative">
        <MapView onHotelClick={setActiveHotel} onAddHotelAt={setNewHotelAt} />

        {/* Hamburger — só no mobile, e escondido em modo navegação.
            top-[92px] evita colidir com o controle de zoom do Leaflet (~10–80px do topo). */}
        {!navigationMode && (
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="md:hidden absolute top-[92px] left-4 z-[1000] glass rounded-full w-11 h-11 flex items-center justify-center shadow-glass text-ink-100 hover:bg-white/[0.12]"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence>
          {pickingOrigin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass rounded-full px-4 py-2 text-[12px] flex items-center gap-2 shadow-glass max-w-[calc(100vw-32px)]"
            >
              <Crosshair className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span className="truncate">Clique no mapa para marcar seu local</span>
              <button
                onClick={() => setPickingOrigin(false)}
                className="ml-2 text-ink-400 hover:text-ink-100 text-[11px] flex-shrink-0"
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
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass rounded-full px-4 py-2 text-[12px] flex items-center gap-2 shadow-glass max-w-[calc(100vw-32px)]"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Clique no mapa para adicionar um hotel</span>
              <button
                onClick={() => setAddingHotel(false)}
                className="ml-2 text-ink-400 hover:text-ink-100 text-[11px] flex-shrink-0"
              >
                cancelar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {hotels.length === 0 && !navigationMode && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-4">
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

        <HotelSearch
          onPick={(h) => {
            flyToMap(h.lat, h.lng, 17);
            // pequeno delay pra o flyTo começar antes do modal cobrir o mapa
            setTimeout(() => setActiveHotel(h), 380);
          }}
        />

        <NavigationOverlay />
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

      <WelcomeDialog />
    </div>
  );
}
