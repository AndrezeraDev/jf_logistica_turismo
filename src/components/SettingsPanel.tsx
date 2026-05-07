import { useState } from 'react';
import {
  Sparkles,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Crosshair,
  Search,
  Loader2,
  Radius,
  Route as RouteIcon,
  Radar,
  Building2,
  Fuel,
  Sun,
  Moon,
  Activity,
  Flag,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { useStore } from '../store/useStore';
import { reverseGeocode, searchAddress, AddressHit } from '../lib/nominatim';

export function SettingsPanel() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setPickingOrigin = useStore((s) => s.setPickingOrigin);
  const setPickingDestination = useStore((s) => s.setPickingDestination);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const liveTracking = useStore((s) => s.liveTracking);
  const setLiveTracking = useStore((s) => s.setLiveTracking);
  const liveAccuracyM = useStore((s) => s.liveAccuracyM);
  const liveError = useStore((s) => s.liveError);
  const [keyVisible, setKeyVisible] = useState(false);
  const [orsKeyVisible, setOrsKeyVisible] = useState(false);
  const [fsqKeyVisible, setFsqKeyVisible] = useState(false);
  const [tomtomKeyVisible, setTomtomKeyVisible] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | undefined>();
  const [manualLat, setManualLat] = useState(settings.origin?.lat.toString() ?? '');
  const [manualLng, setManualLng] = useState(settings.origin?.lng.toString() ?? '');
  const [addrQ, setAddrQ] = useState('');
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrHits, setAddrHits] = useState<AddressHit[]>([]);

  async function searchOriginAddress() {
    if (!addrQ.trim()) return;
    setAddrLoading(true);
    try {
      const hits = await searchAddress(addrQ);
      setAddrHits(hits);
    } finally {
      setAddrLoading(false);
    }
  }

  function chooseAddress(h: AddressHit) {
    setSettings({
      origin: {
        lat: h.lat,
        lng: h.lng,
        label: h.displayName.split(',').slice(0, 2).join(','),
      },
    });
    setManualLat(h.lat.toFixed(6));
    setManualLng(h.lng.toFixed(6));
    setAddrHits([]);
    setAddrQ('');
  }

  const insecureContext =
    typeof window !== 'undefined' &&
    !window.isSecureContext &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  async function useGeolocation() {
    setGeoError(undefined);

    if (!('geolocation' in navigator)) {
      setGeoError('Este navegador não suporta geolocalização.');
      return;
    }
    if (insecureContext) {
      setGeoError(
        `Geolocalização exige HTTPS ou localhost. Você está em http://${window.location.host}. ` +
          `Acesse pelo http://localhost:5173 (na máquina onde o servidor roda).`,
      );
      return;
    }

    // Permissions API hint (quando disponível)
    try {
      const perms = (navigator as Navigator & {
        permissions?: { query: (d: { name: 'geolocation' }) => Promise<PermissionStatus> };
      }).permissions;
      if (perms) {
        const st = await perms.query({ name: 'geolocation' });
        if (st.state === 'denied') {
          setGeoError(
            'Permissão de localização bloqueada para este site. ' +
              'Clique no cadeado da barra de endereços → Permissões → Localização → Permitir, e tente de novo.',
          );
          return;
        }
      }
    } catch {
      /* permissions API ausente — segue tentando */
    }

    setLocating(true);

    const tryGet = (highAccuracy: boolean, timeout: number) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: 60_000,
        });
      });

    try {
      let pos: GeolocationPosition;
      try {
        pos = await tryGet(true, 8000);
      } catch (e) {
        const err = e as GeolocationPositionError;
        if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
          // fallback: sem alta precisão (desktop sem GPS)
          pos = await tryGet(false, 15000);
        } else {
          throw err;
        }
      }
      const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setSettings({
        origin: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: label.split(',').slice(0, 2).join(',') || 'Minha localização',
        },
      });
      setManualLat(pos.coords.latitude.toFixed(6));
      setManualLng(pos.coords.longitude.toFixed(6));
    } catch (e) {
      const err = e as GeolocationPositionError;
      const msg =
        err.code === err.PERMISSION_DENIED
          ? 'Permissão negada. Libere a localização nas permissões do site.'
          : err.code === err.POSITION_UNAVAILABLE
          ? 'Localização indisponível (sem GPS/Wi-Fi de referência). Use coordenadas manuais abaixo.'
          : err.code === err.TIMEOUT
          ? 'Tempo esgotado tentando obter a localização. Tente de novo ou use coordenadas manuais.'
          : err.message || 'Falha desconhecida ao obter localização.';
      setGeoError(msg);
    } finally {
      setLocating(false);
    }
  }

  function setManual() {
    const la = parseFloat(manualLat);
    const ln = parseFloat(manualLng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    setSettings({ origin: { lat: la, lng: ln, label: 'Coordenadas manuais' } });
  }

  return (
    <div className="space-y-3">
      <Card
        title="Aparência"
        subtitle={theme === 'dark' ? 'Tema escuro' : 'Tema claro'}
        action={
          theme === 'dark' ? (
            <Moon className="w-4 h-4 text-ink-400" />
          ) : (
            <Sun className="w-4 h-4 text-ink-400" />
          )
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme('dark')}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[13px] font-medium border transition-all ${
              theme === 'dark'
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-white/[0.04] border-white/10 text-ink-300 hover:bg-white/[0.08]'
            }`}
          >
            <Moon className="w-4 h-4" />
            Escuro
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[13px] font-medium border transition-all ${
              theme === 'light'
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-white/[0.04] border-white/10 text-ink-300 hover:bg-white/[0.08]'
            }`}
          >
            <Sun className="w-4 h-4" />
            Claro
          </button>
        </div>
      </Card>

      <Card title="Meu local" subtitle="Ponto de partida das rotas">
        <div className="space-y-2.5">
          {settings.origin && (
            <div className="text-[12px] text-ink-200 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
              📍 {settings.origin.label || `${settings.origin.lat.toFixed(4)}, ${settings.origin.lng.toFixed(4)}`}
            </div>
          )}

          {/* Método mais confiável: clique no mapa */}
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => setPickingOrigin(true)}
          >
            <Crosshair className="w-3.5 h-3.5" /> Marcar no mapa
          </Button>

          {/* Buscar endereço */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <Input
              placeholder="Buscar endereço…"
              value={addrQ}
              onChange={(e) => setAddrQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchOriginAddress()}
              className="pl-9"
            />
            {addrLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-ink-400" />
            )}
          </div>
          <AnimatePresence>
            {addrHits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="glass rounded-xl overflow-hidden"
              >
                {addrHits.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => chooseAddress(h)}
                    className="w-full text-left px-3 py-2 hover:bg-white/[0.08] text-[12px] transition-colors border-b border-white/5 last:border-0 truncate"
                    title={h.displayName}
                  >
                    {h.displayName}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Geolocalização do navegador */}
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={useGeolocation}
            loading={locating}
          >
            <MapPin className="w-3.5 h-3.5" /> Usar minha localização (GPS)
          </Button>
          {insecureContext && (
            <div className="text-[11px] text-amber-200 bg-amber-300/10 border border-amber-300/25 rounded-lg px-3 py-2 leading-relaxed flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                GPS exige <b>HTTPS</b> ou <b>localhost</b>. Use "Marcar no mapa" ou busca por endereço.
              </span>
            </div>
          )}
          {geoError && (
            <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 leading-relaxed">
              {geoError}
            </div>
          )}

          {/* Live tracking */}
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  liveTracking ? 'bg-accent' : 'bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={liveTracking}
                  onChange={(e) => setLiveTracking(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                    liveTracking ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-ink-100 flex items-center gap-1.5">
                  <Radar
                    className={`w-3.5 h-3.5 ${liveTracking ? 'text-accent animate-pulse' : 'text-ink-400'}`}
                  />
                  Rastreamento ao vivo
                </div>
                {liveTracking && liveAccuracyM != null && (
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    precisão ±{Math.round(liveAccuracyM)} m
                  </div>
                )}
                {!liveTracking && (
                  <div className="text-[11px] text-ink-400 mt-0.5">
                    Atualiza o seu ponto conforme você anda.
                  </div>
                )}
              </div>
            </label>
            {liveError && liveTracking && (
              <div className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {liveError}
              </div>
            )}
          </div>

          {/* Manual */}
          <details className="text-[12px]">
            <summary className="cursor-pointer text-ink-400 hover:text-ink-200 select-none px-1">
              Inserir coordenadas manualmente
            </summary>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                />
                <Input
                  placeholder="Longitude"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="sm" onClick={setManual} className="w-full">
                Salvar coordenadas
              </Button>
            </div>
          </details>
        </div>
      </Card>

      <Card
        title="Saída / fim da viagem"
        subtitle="Pra onde a rota termina depois de pegar todos"
        action={<Flag className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          {settings.destination ? (
            <div className="text-[12px] text-ink-200 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white flex-shrink-0 shadow-[0_0_0_2px_rgba(255,59,48,0.3)]" />
              <span className="truncate flex-1">
                {settings.destination.label ||
                  `${settings.destination.lat.toFixed(4)}, ${settings.destination.lng.toFixed(4)}`}
              </span>
              <button
                onClick={() => setSettings({ destination: undefined })}
                className="text-[11px] text-ink-400 hover:text-red-400"
              >
                limpar
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-ink-400 px-1 leading-relaxed">
              Defina pra onde o motorista segue depois de buscar todos. Pode ser saída
              da cidade, aeroporto, ponto turístico — sua rota termina aqui.
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => setPickingDestination(true)}
          >
            <Flag className="w-3.5 h-3.5" />
            {settings.destination ? 'Alterar saída' : 'Marcar saída no mapa'}
          </Button>
        </div>
      </Card>

      <Card
        title="Raio de busca"
        subtitle="Alcance ao redor do centro do mapa"
        action={<Radius className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={settings.searchRadiusKm ?? 5}
              onChange={(e) =>
                setSettings({ searchRadiusKm: parseInt(e.target.value, 10) })
              }
              className="flex-1 accent-accent h-1"
            />
            <div className="text-[13px] font-mono text-ink-100 min-w-[52px] text-right">
              {settings.searchRadiusKm ?? 5} km
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 3, 5, 10, 20, 50].map((n) => (
              <button
                key={n}
                onClick={() => setSettings({ searchRadiusKm: n })}
                className={`flex-1 h-7 rounded-lg text-[11px] border transition-colors ${
                  (settings.searchRadiusKm ?? 5) === n
                    ? 'bg-accent/20 border-accent/40 text-accent'
                    : 'bg-white/[0.04] border-white/10 text-ink-300 hover:bg-white/[0.08]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[12px] text-ink-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showRadiusCircle ?? true}
              onChange={(e) => setSettings({ showRadiusCircle: e.target.checked })}
              className="accent-accent"
            />
            Mostrar círculo de alcance no mapa
          </label>
        </div>
      </Card>

      <Card
        title="Combustível"
        subtitle="Preço usado no cálculo de custo da rota"
        action={<Fuel className="w-4 h-4 text-ink-400" />}
      >
        <div className="flex items-center gap-3">
          <div className="text-[12px] text-ink-400">R$</div>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={settings.fuelPricePerLiter ?? 6.0}
            onChange={(e) => {
              const v = parseFloat(e.target.value.replace(',', '.'));
              setSettings({ fuelPricePerLiter: Number.isFinite(v) && v >= 0 ? v : 0 });
            }}
            className="flex-1 text-center font-mono"
          />
          <div className="text-[12px] text-ink-400">/ L</div>
        </div>
      </Card>

      <Card
        title="Cobertura de hotéis"
        subtitle="Foursquare como fonte extra (cobre o que falta no OpenStreetMap)"
        action={<Building2 className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <Input
              type={fsqKeyVisible ? 'text' : 'password'}
              placeholder="Foursquare Service API key"
              value={settings.foursquareApiKey || ''}
              onChange={(e) => setSettings({ foursquareApiKey: e.target.value })}
              className="pl-9 pr-10 font-mono text-[12px]"
            />
            <button
              onClick={() => setFsqKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100"
            >
              {fsqKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[11px] text-ink-400 leading-relaxed">
            {settings.foursquareApiKey?.trim() ? (
              <span className="text-emerald-400">
                ✓ Foursquare ativo — busca hotéis em paralelo com OSM e dedupica
              </span>
            ) : (
              <>
                Sem key = só OSM (pode faltar hotéis). Pegue uma grátis em{' '}
                <a
                  href="https://foursquare.com/developers/projects"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  foursquare.com/developers
                </a>{' '}
                — 100k chamadas/mês, sem cartão.
              </>
            )}
          </div>
        </div>
      </Card>

      <Card
        title="Roteamento"
        subtitle="Traçado via ruas reais"
        action={<RouteIcon className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <Input
              type={orsKeyVisible ? 'text' : 'password'}
              placeholder="OpenRouteService API key"
              value={settings.orsApiKey || ''}
              onChange={(e) => setSettings({ orsApiKey: e.target.value })}
              className="pl-9 pr-10 font-mono text-[12px]"
            />
            <button
              onClick={() => setOrsKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100"
            >
              {orsKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-[11px] text-ink-400 leading-relaxed">
            {settings.orsApiKey?.trim() ? (
              <span className="text-emerald-400">
                ✓ Usando OpenRouteService (até 70 paradas, 2k req/dia)
              </span>
            ) : (
              <>
                Sem key = usa servidores OSRM públicos (instáveis, limite ~8 paradas).
                Pegue uma grátis em{' '}
                <a
                  href="https://openrouteservice.org/dev/#/signup"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  openrouteservice.org
                </a>
                .
              </>
            )}
          </div>
        </div>
      </Card>

      <Card
        title="Trânsito em tempo real"
        subtitle="TomTom — rotas inteligentes que evitam congestionamento"
        action={<Activity className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <Input
              type={tomtomKeyVisible ? 'text' : 'password'}
              placeholder="TomTom API key"
              value={settings.tomtomApiKey || ''}
              onChange={(e) => setSettings({ tomtomApiKey: e.target.value })}
              className="pl-9 pr-10 font-mono text-[12px]"
            />
            <button
              onClick={() => setTomtomKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100"
            >
              {tomtomKeyVisible ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-ink-400 leading-relaxed">
            {settings.tomtomApiKey?.trim() ? (
              <span className="text-emerald-400">
                ✓ TomTom ativo — rotas evitam ruas congestionadas automaticamente
              </span>
            ) : (
              <>
                Pegue uma grátis em{' '}
                <a
                  href="https://developer.tomtom.com/user/register"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  developer.tomtom.com
                </a>{' '}
                — 2.500 chamadas/dia, sem cartão. Marque "Routing API" + "Traffic API".
              </>
            )}
          </div>

          {/* Toggle do overlay */}
          {settings.tomtomApiKey?.trim() && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-white/5">
              <div
                className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors mt-0.5 ${
                  settings.showTrafficOverlay ? 'bg-accent' : 'bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.showTrafficOverlay ?? false}
                  onChange={(e) => setSettings({ showTrafficOverlay: e.target.checked })}
                  className="sr-only"
                />
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                    settings.showTrafficOverlay ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-ink-100">Overlay de trânsito no mapa</div>
                <div className="text-[11px] text-ink-400 mt-0.5 leading-relaxed">
                  Mostra ruas congestionadas em vermelho/amarelo. Consome cota — use só
                  quando precisar.
                </div>
              </div>
            </label>
          )}
        </div>
      </Card>

      <Card
        title="IA (opcional)"
        subtitle="Sugestões contextualizadas via OpenAI"
        action={<Sparkles className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <Input
              type={keyVisible ? 'text' : 'password'}
              placeholder="sk-…"
              value={settings.openaiApiKey || ''}
              onChange={(e) => setSettings({ openaiApiKey: e.target.value })}
              className="pl-9 pr-10 font-mono text-[12px]"
            />
            <button
              onClick={() => setKeyVisible((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100"
            >
              {keyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <select
            value={settings.openaiModel || 'gpt-4o-mini'}
            onChange={(e) => setSettings({ openaiModel: e.target.value })}
            className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-ink-100 focus:outline-none focus:border-accent/60"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (rápido / barato)</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            <option value="gpt-4.1">gpt-4.1</option>
          </select>
          <p className="text-[11px] text-ink-400 leading-relaxed">
            Chave salva apenas no seu navegador (localStorage). Nada é enviado para servidores nossos.
          </p>
        </div>
      </Card>
    </div>
  );
}
