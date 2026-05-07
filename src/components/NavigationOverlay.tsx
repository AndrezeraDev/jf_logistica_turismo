import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigation, Play, X, MapPin, CheckCircle2, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { haversineKm } from '../lib/geo';
import { RouteShareModal } from './RouteShareModal';

export function NavigationOverlay() {
  const route = useStore((s) => s.route);
  const navigationMode = useStore((s) => s.navigationMode);
  const startNavigation = useStore((s) => s.startNavigation);
  const stopNavigation = useStore((s) => s.stopNavigation);
  const currentStopIndex = useStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useStore((s) => s.setCurrentStopIndex);
  const origin = useStore((s) => s.settings.origin);
  const liveTracking = useStore((s) => s.liveTracking);
  const [shareOpen, setShareOpen] = useState(false);

  const allStops = useMemo(
    () => (route ? [...route.stops, ...route.returnStops] : []),
    [route],
  );

  const nextStop = allStops[currentStopIndex];
  const isReturnLeg = route ? currentStopIndex >= route.stops.length : false;
  const finished = !!route && currentStopIndex >= allStops.length - 1 && !nextStop;

  const distanceKm = useMemo(() => {
    if (!nextStop || !origin) return null;
    return haversineKm(
      { lat: origin.lat, lng: origin.lng },
      { lat: nextStop.lat, lng: nextStop.lng },
    );
  }, [nextStop, origin]);

  // Após calcular rota: se GPS ativo, mostra "Iniciar rota" (modo navegação live).
  // Se GPS desativado, mostra "Compartilhar rota" (planejamento sem dirigir agora).
  const showActionButton = !!route && !navigationMode;

  return (
    <>
      <AnimatePresence>
        {showActionButton && (
          <motion.div
            key="action-btns"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[1100] flex items-center gap-2"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
          >
            {/* Iniciar rota — só quando GPS ativo (modo motorista live) */}
            {liveTracking && (
              <button
                onClick={startNavigation}
                className="flex items-center gap-2.5 h-14 px-7 rounded-full text-[15px] font-semibold
                  bg-gradient-to-b from-accent to-blue-600 text-white
                  shadow-[0_10px_30px_rgba(10,132,255,0.55)]
                  hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                Iniciar rota
              </button>
            )}
            {/* Compartilhar — sempre disponível quando há rota */}
            <button
              onClick={() => setShareOpen(true)}
              className={`flex items-center gap-2.5 h-14 rounded-full text-[14px] font-semibold transition-all
                active:scale-[0.98]
                ${
                  liveTracking
                    ? 'px-5 glass text-ink-100 hover:bg-white/[0.12]'
                    : 'px-7 bg-gradient-to-b from-accent to-blue-600 text-white text-[15px] shadow-[0_10px_30px_rgba(10,132,255,0.55)] hover:brightness-110'
                }`}
            >
              <Share2 className="w-4 h-4" />
              {liveTracking ? 'Compartilhar' : 'Compartilhar rota'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <RouteShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      <AnimatePresence>
        {navigationMode && route && (
          <>
            {/* HUD topo — próxima parada + distância */}
            <motion.div
              key="nav-hud-top"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="absolute top-0 left-0 right-0 z-[1100] p-3 md:p-4 pointer-events-none"
              style={{ paddingTop: 'calc(env(safe-area-inset-top, 0) + 12px)' }}
            >
              <div className="glass rounded-2xl px-4 py-3 shadow-glass max-w-md mx-auto pointer-events-auto">
                {finished ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-emerald-400">
                        Rota concluída
                      </div>
                      <div className="text-[14px] font-semibold">Todas as paradas visitadas</div>
                    </div>
                  </div>
                ) : nextStop ? (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold ${
                        isReturnLeg
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-accent/20 border border-accent/40 text-accent'
                      }`}
                    >
                      {isReturnLeg ? currentStopIndex - route.stops.length + 1 : nextStop.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {isReturnLeg ? 'Deixar' : 'Buscar'} •{' '}
                        {currentStopIndex + 1} / {allStops.length}
                      </div>
                      <div className="text-[14px] font-semibold truncate">{nextStop.name}</div>
                      <div className="text-[12px] text-ink-300 flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-ink-400" />
                        {distanceKm != null ? formatDistance(distanceKm) : '—'} •{' '}
                        {nextStop.guests} pax
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>

            {/* Controles inferior — encerrar rota + skip */}
            <motion.div
              key="nav-hud-bottom"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="absolute left-0 right-0 bottom-0 z-[1100] p-3 md:p-4 flex items-center justify-center gap-2 pointer-events-none"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 12px)' }}
            >
              <button
                onClick={stopNavigation}
                className="pointer-events-auto h-12 px-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-[14px] font-semibold flex items-center gap-2 shadow-[0_8px_24px_rgba(255,69,58,0.45)] active:scale-[0.98] transition-all"
              >
                <X className="w-4 h-4" />
                Encerrar rota
              </button>
              {!finished && nextStop && currentStopIndex < allStops.length - 1 && (
                <button
                  onClick={() => setCurrentStopIndex(currentStopIndex + 1)}
                  className="pointer-events-auto h-12 px-5 rounded-full glass text-[14px] font-medium text-ink-100 hover:bg-white/[0.12] active:scale-[0.98] transition-all"
                >
                  Pular parada
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
