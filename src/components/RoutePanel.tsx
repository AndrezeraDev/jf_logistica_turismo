import { useMemo, useState } from 'react';
import { Play, Loader2, Sparkles, Navigation, Gauge, Timer, Users, Bus, AlertTriangle, Fuel, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useStore } from '../store/useStore';
import { nearestNeighborOrder, nearestNeighborReturn, twoOpt } from '../lib/tsp';
import { routeVia } from '../lib/osrm';
import { suggestWithAI } from '../lib/openai';
import { calcEconomy, formatBRL } from '../lib/economy';
import type { Hotel, LatLng, Route } from '../types';

export function RoutePanel() {
  const hotels = useStore((s) => s.hotels);
  const settings = useStore((s) => s.settings);
  const vehicles = useStore((s) => s.vehicles);
  const route = useStore((s) => s.route);
  const setRoute = useStore((s) => s.setRoute);
  const aiLoading = useStore((s) => s.aiLoading);
  const setAiLoading = useStore((s) => s.setAiLoading);
  const aiError = useStore((s) => s.aiError);
  const setAiError = useStore((s) => s.setAiError);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | undefined>();

  const selected: Hotel[] = useMemo(() => hotels.filter((h) => h.guests > 0), [hotels]);
  const totalGuests = selected.reduce((a, h) => a + h.guests, 0);

  const suggestedVehicle = useMemo(() => {
    if (!totalGuests) return undefined;
    const ordered = [...vehicles].sort((a, b) => a.capacity - b.capacity);
    return ordered.find((v) => v.capacity >= totalGuests) || ordered[ordered.length - 1];
  }, [vehicles, totalGuests]);

  const canRun = selected.length > 0 && !!settings.origin;

  async function run() {
    if (!settings.origin) {
      setRouteError('Configure "Meu local" em Configurações antes de rodar a otimização.');
      return;
    }
    if (selected.length === 0) {
      setRouteError('Atribua hóspedes a pelo menos um hotel.');
      return;
    }

    setRouteLoading(true);
    setRouteError(undefined);
    try {
      const origin: LatLng = { lat: settings.origin.lat, lng: settings.origin.lng };
      const dest: LatLng | null = settings.destination
        ? { lat: settings.destination.lat, lng: settings.destination.lng }
        : null;

      // Modo "viagem one-way": tem destino → rota = origin → pickups → destination.
      //   Não há leg de retorno; ordem dos pickups otimizada pra minimizar
      //   distância total considerando o destino como end fixo.
      // Modo clássico: sem destino → origin → pickups → drop-off (return) → origin.
      const nnStops = nearestNeighborOrder(origin, selected);
      const stops = dest
        ? twoOpt(origin, nnStops, dest) // closed path com destino como fim
        : twoOpt(origin, nnStops); // open path
      const last: LatLng = stops.length
        ? { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng }
        : origin;

      const pickupPoints: LatLng[] = [
        origin,
        ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        ...(dest ? [dest] : []),
      ];

      let returnStops: typeof stops = [];
      let returnPoints: LatLng[] = [];
      if (!dest) {
        const nnReturn = nearestNeighborReturn(last, stops);
        returnStops = twoOpt(last, nnReturn, origin);
        returnPoints = [
          last,
          ...returnStops.map((s) => ({ lat: s.lat, lng: s.lng })),
          origin,
        ];
      }

      const [pickup, back] = await Promise.all([
        routeVia(pickupPoints, settings.orsApiKey, settings.tomtomApiKey),
        returnPoints.length > 0
          ? routeVia(returnPoints, settings.orsApiKey, settings.tomtomApiKey)
          : Promise.resolve({
              polyline: [],
              distanceKm: 0,
              durationMin: 0,
              usedFallback: false,
              engine: undefined,
              trafficDelayMin: 0,
            }),
      ]);

      const r: Route = {
        origin,
        stops,
        returnStops: returnStops.map((s, i) => ({ ...s, order: i + 1 })),
        polyline: pickup.polyline,
        returnPolyline: back.polyline,
        totalDistanceKm: pickup.distanceKm + back.distanceKm,
        totalDurationMin: pickup.durationMin + back.durationMin,
        totalGuests,
        suggestedVehicleId: suggestedVehicle?.id,
        usedFallback: pickup.usedFallback || back.usedFallback,
        routingEngine: pickup.engine || back.engine,
        trafficDelayMin: (pickup.trafficDelayMin || 0) + (back.trafficDelayMin || 0),
      };
      setRoute(r);
      setAiError(undefined);
    } catch (e) {
      setRouteError(e instanceof Error ? e.message : String(e));
    } finally {
      setRouteLoading(false);
    }
  }

  async function runAI() {
    if (!route) return;
    if (!settings.openaiApiKey) {
      setAiError('Adicione a API key da OpenAI em Configurações.');
      return;
    }
    setAiLoading(true);
    setAiError(undefined);
    try {
      const txt = await suggestWithAI(
        settings.openaiApiKey,
        settings.openaiModel || 'gpt-4o-mini',
        route,
        vehicles,
      );
      setRoute({ ...route, aiSuggestion: txt });
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Card
        title="Rota"
        subtitle={
          selected.length
            ? `${selected.length} hotel(is) • ${totalGuests} hóspede(s)`
            : 'Clique em um hotel no mapa para atribuir hóspedes'
        }
      >
        {!settings.origin && (
          <div className="mb-3 text-[12px] text-amber-300 bg-amber-300/10 border border-amber-300/20 rounded-lg px-3 py-2">
            Defina "Meu local" em Configurações.
          </div>
        )}
        {selected.length > 8 && !settings.orsApiKey && (
          <div className="mb-3 text-[11px] text-amber-200 bg-amber-300/10 border border-amber-300/25 rounded-lg px-3 py-2 leading-relaxed">
            Você tem {selected.length} pontos. O OSRM público costuma rejeitar rotas com mais
            de 8 paradas — adicione uma <b>API key do OpenRouteService</b> em Configurações
            pra evitar fallback em linha reta.
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canRun || routeLoading}
          loading={routeLoading}
          onClick={run}
        >
          {!routeLoading && <Play className="w-4 h-4" fill="currentColor" />}
          {routeLoading ? 'Calculando rota…' : 'Rodar otimização'}
        </Button>

        {routeError && (
          <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 leading-relaxed">
            {routeError}
          </div>
        )}

        {suggestedVehicle && (
          <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <Bus className="w-4 h-4 text-accent" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-ink-400 uppercase tracking-wider">Sugestão</div>
              <div className="text-[13px] text-ink-100 truncate">
                {suggestedVehicle.name} — {suggestedVehicle.capacity} lugares
              </div>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {route && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
          >
            <Card title="Resumo">
              {route.usedFallback && (
                <div className="mb-3 text-[11px] text-amber-200 bg-amber-300/10 border border-amber-300/25 rounded-lg px-3 py-2 flex gap-2 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Roteamento por ruas indisponível — todos os servidores OSRM falharam.
                    O traçado mostrado é em <b>linha reta</b> (estimativa). Tente rodar de novo
                    em alguns segundos.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-3">
                <Stat icon={<Gauge className="w-3.5 h-3.5" />} label="Distância" value={`${route.totalDistanceKm.toFixed(1)} km`} />
                <Stat icon={<Timer className="w-3.5 h-3.5" />} label="Duração" value={`${Math.round(route.totalDurationMin)} min`} />
                <Stat icon={<Users className="w-3.5 h-3.5" />} label="Pax" value={`${route.totalGuests}`} />
              </div>

              {!!route.trafficDelayMin && route.trafficDelayMin > 0.5 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-300/10 border border-amber-300/25 text-[12px] text-amber-200 flex items-center gap-2">
                  <span className="text-amber-400">🚦</span>
                  <span className="flex-1">
                    Trânsito atual adiciona{' '}
                    <b>+{Math.round(route.trafficDelayMin)} min</b> à rota
                  </span>
                  {route.routingEngine === 'tomtom.com' && (
                    <span className="text-[10px] text-amber-400/80">via TomTom</span>
                  )}
                </div>
              )}

              <EconomyCard route={route} />

              <div className="space-y-1.5 max-h-56 overflow-auto pr-1">
                <div className="text-[11px] text-ink-400 uppercase tracking-wider px-1">
                  <Navigation className="w-3 h-3 inline mr-1" /> Coleta
                </div>
                {route.stops.map((s) => (
                  <div key={`p-${s.hotelId}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                    <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/40 text-[11px] font-bold flex items-center justify-center text-accent">
                      {s.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-ink-100 truncate">{s.name}</div>
                    </div>
                    <div className="text-[11px] text-ink-400">{s.guests} pax</div>
                  </div>
                ))}
                <div className="text-[11px] text-ink-400 uppercase tracking-wider px-1 mt-2">
                  <Navigation className="w-3 h-3 inline mr-1" /> Retorno
                </div>
                {route.returnStops.map((s) => (
                  <div key={`r-${s.hotelId}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center text-emerald-400">
                      {s.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-ink-100 truncate">{s.name}</div>
                    </div>
                    <div className="text-[11px] text-ink-400">{s.guests} pax</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5">
                <Button variant="secondary" size="sm" className="w-full" onClick={runAI} loading={aiLoading}>
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Sugerir com IA
                </Button>
                {aiError && (
                  <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {aiError}
                  </div>
                )}
                {route.aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-[12px] text-ink-200 whitespace-pre-wrap bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 leading-relaxed"
                  >
                    {route.aiSuggestion}
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-2 py-2 rounded-xl bg-white/[0.04] border border-white/5">
      <div className="flex items-center gap-1 text-ink-400 text-[10px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="text-[14px] font-semibold text-ink-100 mt-0.5">{value}</div>
    </div>
  );
}

function EconomyCard({ route }: { route: Route }) {
  const vehicles = useStore((s) => s.vehicles);
  const fuelPrice = useStore((s) => s.settings.fuelPricePerLiter ?? 6.0);
  const vehicle = vehicles.find((v) => v.id === route.suggestedVehicleId);
  const eco = calcEconomy(route, vehicle, fuelPrice);

  return (
    <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-emerald-500/15">
        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] uppercase tracking-wider text-emerald-300 flex-1">
          Economia
        </span>
        <span className="text-[11px] text-ink-400">
          {eco.consumptionKmL.toFixed(1)} km/L · {formatBRL(fuelPrice)}/L
        </span>
      </div>
      <div className="px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <div className="flex items-center gap-1.5 text-ink-300">
          <Fuel className="w-3 h-3 text-ink-400" />
          Custo da rota
        </div>
        <div className="text-right font-semibold text-ink-100">
          {formatBRL(eco.fuelCost)}
        </div>

        <div className="text-ink-400 text-[11px]">
          Sem otimização
        </div>
        <div className="text-right text-ink-400 text-[11px] line-through">
          {formatBRL(eco.naiveFuelCost)}
        </div>

        <div className="text-emerald-300 col-span-2 mt-1 pt-2 border-t border-emerald-500/15">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider">Você poupa</span>
            <span className="text-[15px] font-semibold">
              {formatBRL(eco.savedMoney)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-[11px] text-emerald-400/80 mt-0.5">
            <span>{eco.savedKm.toFixed(1)} km a menos</span>
            <span>−{eco.savedPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
