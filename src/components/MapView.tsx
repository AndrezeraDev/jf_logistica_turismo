import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, Loader2, LocateFixed, Locate } from 'lucide-react';
import { useStore } from '../store/useStore';
import { reverseGeocode } from '../lib/nominatim';
import { fetchHotelsInRadius } from '../lib/overpass';
import { fetchHotelsFsqRadius } from '../lib/foursquare';
import { mergeHotels } from '../lib/mergeHotels';
import type { Hotel, Route } from '../types';

// Fix leaflet default icon paths (we don't use them, but just in case)
// @ts-expect-error private
delete L.Icon.Default.prototype._getIconUrl;

/** Tamanho do ícone do hotel em função do zoom — pra evitar que ícones se sobreponham
 *  em zoom de cidade (lots of hotels) e cresçam pra ficar legíveis em zoom de rua. */
function hotelIconSize(zoom: number): number {
  if (zoom < 13) return 14;
  if (zoom < 15) return 20;
  if (zoom < 17) return 26;
  return 32;
}

function hotelIcon(hotel: Hotel, size: number, animate = true): L.DivIcon {
  const has = hotel.guests > 0;
  // Em tamanhos pequenos, esconde texto/ring pra ficar limpo (pontos coloridos).
  const showText = size >= 18;
  const showRing = !has && size >= 22;
  const fontSize = Math.max(9, Math.round(size * 0.42));
  const borderWidth = size <= 16 ? 1.5 : 2.5;
  const text = showText ? (has ? String(hotel.guests) : 'H') : '';
  const ring = showRing ? '<span class="ring"></span>' : '';
  const animClass = animate ? 'pop-in' : '';
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html:
      `<div class="hotel-pin ${animClass} ${has ? 'has-guests' : ''}" ` +
      `style="width:${size}px;height:${size}px;font-size:${fontSize}px;border-width:${borderWidth}px">` +
      `${ring}${text}</div>`,
  });
}

function stepIcon(order: number): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="step-pin pop-in">${order}</div>`,
  });
}

function meIcon(live = false): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div class="me-pin${live ? ' live' : ''}"></div>`,
  });
}

export function MapView({
  onHotelClick,
  onAddHotelAt,
}: {
  onHotelClick: (h: Hotel) => void;
  onAddHotelAt: (p: { lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const hotelLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  // Última coordenada que processamos — evita panTo após flyTo (mesma coord, dep diferente)
  const lastHandledOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const onHotelClickRef = useRef(onHotelClick);
  onHotelClickRef.current = onHotelClick;
  const onAddHotelAtRef = useRef(onAddHotelAt);
  onAddHotelAtRef.current = onAddHotelAt;

  const selectedCity = useStore((s) => s.selectedCity);
  const hotels = useStore((s) => s.hotels);
  const route = useStore((s) => s.route);
  const origin = useStore((s) => s.settings.origin);
  const pickingOrigin = useStore((s) => s.pickingOrigin);
  const setPickingOrigin = useStore((s) => s.setPickingOrigin);
  const addingHotel = useStore((s) => s.addingHotel);
  const setAddingHotel = useStore((s) => s.setAddingHotel);
  const setSettings = useStore((s) => s.setSettings);
  const setHotels = useStore((s) => s.setHotels);
  const setHotelsLoading = useStore((s) => s.setHotelsLoading);
  const setHotelsError = useStore((s) => s.setHotelsError);
  const markHotelsFetched = useStore((s) => s.markHotelsFetched);
  const hotelsLoading = useStore((s) => s.hotelsLoading);
  const radiusKm = useStore((s) => s.settings.searchRadiusKm ?? 5);
  const showRadiusCircle = useStore((s) => s.settings.showRadiusCircle ?? true);
  const tomtomApiKey = useStore((s) => s.settings.tomtomApiKey);
  const showTrafficOverlay = useStore((s) => s.settings.showTrafficOverlay ?? false);
  const liveTracking = useStore((s) => s.liveTracking);
  const liveAccuracyM = useStore((s) => s.liveAccuracyM);
  const followMe = useStore((s) => s.followMe);
  const setFollowMe = useStore((s) => s.setFollowMe);
  const navigationMode = useStore((s) => s.navigationMode);
  const currentStopIndex = useStore((s) => s.currentStopIndex);
  const setCurrentStopIndex = useStore((s) => s.setCurrentStopIndex);
  const requestZoomOnNextLocation = useStore((s) => s.requestZoomOnNextLocation);
  const clearLocationZoomRequest = useStore((s) => s.clearLocationZoomRequest);
  const flyToTarget = useStore((s) => s.flyToTarget);
  const [showAreaBtn, setShowAreaBtn] = useState(false);
  const [centerTick, setCenterTick] = useState(0);
  const [hotelSize, setHotelSize] = useState(() => hotelIconSize(11));

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    // Zoom inicial — se já tiver "Meu local" salvo, abre na cidade/região (zoom 11).
    // Senão, abre em Gramado/RS (default — base operacional).
    const GRAMADO: [number, number, number] = [-29.3756, -50.8744, 13];
    const initialOrigin = useStore.getState().settings.origin;
    const initialView: [number, number, number] = initialOrigin
      ? [initialOrigin.lat, initialOrigin.lng, 11]
      : GRAMADO;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      minZoom: 3,
      maxZoom: 19,
    }).setView([initialView[0], initialView[1]], initialView[2]);

    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap',
        className: 'tile-dark',
      },
    );
    tileLayer.addTo(map);

    hotelLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    // mostra o botão "buscar nesta área" quando o usuário move/zooma o mapa
    map.on('moveend', () => {
      setShowAreaBtn(map.getZoom() >= 10);
      setCenterTick((t) => t + 1);
    });
    map.on('move', () => setCenterTick((t) => t + 1));
    // atualiza tamanho dos ícones conforme zoom
    map.on('zoomend', () => {
      setHotelSize(hotelIconSize(map.getZoom()));
    });
    setHotelSize(hotelIconSize(map.getZoom())); // sincroniza com zoom inicial
    // pan manual do usuário quebra o follow mode
    map.on('dragstart', () => {
      if (useStore.getState().followMe) useStore.getState().setFollowMe(false);
    });

    mapInst.current = map;

    // Resize observer
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapInst.current = null;
    };
  }, []);

  // Fit to city bounds when city changes
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !selectedCity) return;
    const [south, north, west, east] = selectedCity.boundingBox;
    map.flyToBounds(
      [
        [south, west],
        [north, east],
      ],
      { duration: 1.1, padding: [30, 30] },
    );
  }, [selectedCity]);

  // Draw hotels — quando há rota calculada, mostra só os hotéis com hóspedes.
  // Pop-in animation só na primeira renderização da lista; em mudanças de zoom
  // (só `hotelSize` mudou), redesenha sem animação pra não ficar piscando.
  const lastHotelsRef = useRef<Hotel[] | null>(null);
  useEffect(() => {
    const layer = hotelLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const displayed = route ? hotels.filter((h) => h.guests > 0) : hotels;
    const isNewList = lastHotelsRef.current !== hotels;
    lastHotelsRef.current = hotels;
    displayed.forEach((h, i) => {
      const m = L.marker([h.lat, h.lng], {
        icon: hotelIcon(h, hotelSize, isNewList),
        opacity: isNewList ? 0 : 1,
      });
      m.on('click', () => onHotelClickRef.current(h));
      if (isNewList) {
        m.on('add', () => {
          setTimeout(() => m.setOpacity(1), Math.min(i * 20, 1500));
        });
      }
      m.bindTooltip(
        `<div style="font-size:12px"><b>${escapeHtml(h.name)}</b>${
          h.guests > 0
            ? `<br/><span style="color:#34C759">${h.guests} hóspede(s)</span>`
            : ''
        }</div>`,
        { direction: 'top', offset: [0, -10] },
      );
      layer.addLayer(m);
    });
  }, [hotels, route, hotelSize]);

  // Picking origin mode — change cursor + capture next click
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = pickingOrigin || addingHotel ? 'crosshair' : '';
    if (!pickingOrigin) return;
    const handler = async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setPickingOrigin(false);
      setSettings({ origin: { lat, lng, label: 'Marcando…' } });
      const label = await reverseGeocode(lat, lng);
      setSettings({
        origin: {
          lat,
          lng,
          label: label.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        },
      });
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [pickingOrigin, addingHotel, setPickingOrigin, setSettings]);

  // Adding-hotel mode — next click opens the new-hotel modal
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !addingHotel) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onAddHotelAtRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
      setAddingHotel(false);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [addingHotel, setAddingHotel]);

  // Draw origin marker (sem flicker: setLatLng se já existe)
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    if (!origin) {
      if (originMarkerRef.current) {
        map.removeLayer(originMarkerRef.current);
        originMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      return;
    }
    const latLng: L.LatLngTuple = [origin.lat, origin.lng];
    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng(latLng);
      originMarkerRef.current.setIcon(meIcon(liveTracking));
    } else {
      originMarkerRef.current = L.marker(latLng, {
        icon: meIcon(liveTracking),
        zIndexOffset: 1000,
      })
        .bindTooltip(liveTracking ? 'Meu local (ao vivo)' : 'Meu local', {
          direction: 'top',
          offset: [0, -8],
        })
        .addTo(map);
    }

    // círculo de accuracy — só desenha quando informativo:
    //  - precisa de live tracking ativo
    //  - precisão precisa estar definida e > 0
    //  - se a incerteza for grande (>250m), o círculo cobre a cidade inteira no zoom,
    //    então escondemos. O ponto branco já indica a posição.
    const ACCURACY_MAX_M = 250;
    const showAccuracyCircle =
      liveTracking && !!liveAccuracyM && liveAccuracyM > 0 && liveAccuracyM <= ACCURACY_MAX_M;
    if (showAccuracyCircle) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(liveAccuracyM!);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: liveAccuracyM!,
          color: '#0A84FF',
          weight: 1,
          opacity: 0.35,
          fillColor: '#0A84FF',
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(map);
      }
    } else if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    // Prioridade de animação ao receber novo origin:
    //  1) Welcome / "Ativar GPS" pediu zoom suave → flyTo com zoom forte
    //  2) Modo navegação ativo → flyTo com zoom street-level
    //  3) Follow mode normal → panTo suave (mantém zoom atual)
    //
    // Crucial: o efeito re-roda quando QUALQUER dep mudar (não só origin).
    // Ex.: depois do flyTo, clearLocationZoomRequest dispara um novo render →
    // efeito roda de novo com mesmo origin → cairia em panTo e interromperia
    // a animação do flyTo. Por isso só pannamos se origin REALMENTE mudou.
    const last = lastHandledOriginRef.current;
    const originChanged =
      !last || last.lat !== origin.lat || last.lng !== origin.lng;

    if (requestZoomOnNextLocation && originChanged) {
      // Só consome o request quando origin REALMENTE mudou. Se origin é o mesmo
      // de antes (e.g., requestZoom chegou antes do setSettings em renders separados),
      // aguardamos o próximo update — assim o flyTo vai pra coordenada do GPS atual,
      // não pra um origin antigo que estava no store.
      const targetZoom = Math.max(map.getZoom(), 13);
      map.flyTo(latLng, targetZoom, { duration: 1.6, easeLinearity: 0.2 });
      clearLocationZoomRequest();
      lastHandledOriginRef.current = { lat: origin.lat, lng: origin.lng };
    } else if (navigationMode && map.getZoom() < 15 && originChanged) {
      map.flyTo(latLng, 17, { duration: 1.4, easeLinearity: 0.25 });
      lastHandledOriginRef.current = { lat: origin.lat, lng: origin.lng };
    } else if (followMe && originChanged) {
      map.panTo(latLng, { animate: true, duration: 0.6 });
      lastHandledOriginRef.current = { lat: origin.lat, lng: origin.lng };
    }
  }, [
    origin,
    liveTracking,
    liveAccuracyM,
    followMe,
    requestZoomOnNextLocation,
    clearLocationZoomRequest,
    navigationMode,
  ]);

  // Traffic overlay (TomTom) — toggle nas Configurações
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    // remove se existir
    if (trafficLayerRef.current) {
      map.removeLayer(trafficLayerRef.current);
      trafficLayerRef.current = null;
    }
    if (!showTrafficOverlay || !tomtomApiKey?.trim()) return;
    // `relative-delay` mostra apenas vias com atraso significativo (transparente nas demais)
    const url =
      `https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${encodeURIComponent(tomtomApiKey.trim())}`;
    const layer = L.tileLayer(url, {
      attribution: '© TomTom',
      opacity: 0.85,
      maxZoom: 22,
      minZoom: 8,
      // pane higher than tilePane mas abaixo dos markers/route
      pane: 'overlayPane',
    });
    layer.addTo(map);
    trafficLayerRef.current = layer;
    return () => {
      if (trafficLayerRef.current) {
        map.removeLayer(trafficLayerRef.current);
        trafficLayerRef.current = null;
      }
    };
  }, [showTrafficOverlay, tomtomApiKey]);

  // Radius circle — segue o centro do mapa
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }
    if (!showRadiusCircle) return;
    const c = map.getCenter();
    radiusCircleRef.current = L.circle([c.lat, c.lng], {
      radius: radiusKm * 1000,
      color: '#0A84FF',
      weight: 1.5,
      opacity: 0.55,
      fillColor: '#0A84FF',
      fillOpacity: 0.06,
      dashArray: '6 8',
      interactive: false,
    }).addTo(map);
  }, [radiusKm, showRadiusCircle, centerTick]);

  // External flyTo trigger (lupa de busca, etc) — disparado via store
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !flyToTarget) return;
    map.flyTo(
      [flyToTarget.lat, flyToTarget.lng],
      flyToTarget.zoom ?? Math.max(map.getZoom(), 17),
      { duration: 1.0, easeLinearity: 0.25 },
    );
    // não precisamos limpar — o ts garante unicidade; se vier outro request, dispara de novo
  }, [flyToTarget]);

  // Navigation mode — animação inicial quando entra no modo navegação
  // (caso origin já exista; se não, o efeito do origin abaixo cuida no primeiro fix)
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !navigationMode) return;
    const o = useStore.getState().settings.origin;
    if (!o) return;
    map.flyTo([o.lat, o.lng], 17, { duration: 1.4, easeLinearity: 0.25 });
  }, [navigationMode]);

  // Auto-progresso: quando origin chega perto da parada atual, avança índice
  useEffect(() => {
    if (!navigationMode || !route || !origin) return;
    const all = [...route.stops, ...route.returnStops];
    const target = all[currentStopIndex];
    if (!target) return;
    const dKm = haversineKmLocal(origin, { lat: target.lat, lng: target.lng });
    if (dKm < 0.06 && currentStopIndex < all.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
    }
  }, [origin, navigationMode, route, currentStopIndex, setCurrentStopIndex]);

  // Draw route
  useEffect(() => {
    const map = mapInst.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!route) return;
    drawRouteOnLayer(route, layer);
    // fit to route
    const allPts = [
      ...route.polyline,
      ...route.returnPolyline,
      route.origin,
    ];
    if (allPts.length) {
      const bounds = L.latLngBounds(allPts.map((p) => [p.lat, p.lng]));
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.0 });
    }
  }, [route]);

  async function fetchAreaHotels() {
    const map = mapInst.current;
    if (!map) return;
    const c = map.getCenter();
    setHotelsLoading(true);
    setHotelsError(undefined);
    const setLastSearchSources = useStore.getState().setLastSearchSources;
    try {
      const fsqKey = useStore.getState().settings.foursquareApiKey?.trim();
      let fsqError: string | undefined;

      // Faz as duas chamadas em paralelo, capturando contagens individualmente
      const fsqPromise = fsqKey
        ? fetchHotelsFsqRadius(fsqKey, c.lat, c.lng, radiusKm).catch((e) => {
            fsqError = e instanceof Error ? e.message : String(e);
            console.warn('[foursquare]', fsqError);
            return [] as Hotel[];
          })
        : Promise.resolve([] as Hotel[]);
      const osmPromise = fetchHotelsInRadius(c.lat, c.lng, radiusKm).catch((e) => {
        console.warn('[overpass]', e);
        return [] as Hotel[];
      });
      const [fsqResults, osmResults] = await Promise.all([fsqPromise, osmPromise]);

      // Dedupe: FSQ primeiro pra prevalecer em duplicatas
      const merged = mergeHotels([...fsqResults, ...osmResults]);

      // Diagnóstico — visível na UI + console
      console.group('[hotel-search]');
      console.log('FSQ key set:', !!fsqKey);
      console.log('Center:', c.lat.toFixed(5), c.lng.toFixed(5), '| radius:', radiusKm, 'km');
      console.log('Foursquare returned:', fsqResults.length, fsqError ? `(error: ${fsqError})` : '');
      console.log('OSM returned:', osmResults.length);
      console.log('After merge:', merged.length);
      const fioreze = merged.filter((h) => h.name.toLowerCase().includes('fioreze'));
      if (fioreze.length) {
        console.log('Fioreze entries:', fioreze.map((h) => `${h.name} [${h.id}]`));
      }
      console.groupEnd();

      setLastSearchSources({
        foursquare: fsqResults.length,
        osm: osmResults.length,
        merged: merged.length,
        fsqError,
        fsqNames: fsqResults.map((h) => h.name),
        osmNames: osmResults.map((h) => h.name),
        mergedNames: merged.map((h) => h.name),
      });

      if (merged.length === 0) {
        throw new Error('Nenhum hotel encontrado nas fontes consultadas.');
      }
      setHotels(merged);
      markHotelsFetched();
    } catch (e) {
      setHotelsError(
        e instanceof Error ? `Falha ao buscar hotéis: ${e.message}` : 'Falha ao buscar hotéis.',
      );
    } finally {
      setHotelsLoading(false);
    }
  }

  function centerOnMe() {
    const map = mapInst.current;
    if (!map || !origin) return;
    map.flyTo([origin.lat, origin.lng], Math.max(map.getZoom(), 15), {
      duration: 0.8,
    });
    if (liveTracking) setFollowMe(true);
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {showAreaBtn && !navigationMode && (
        <button
          onClick={fetchAreaHotels}
          disabled={hotelsLoading}
          className="absolute top-4 right-4 z-[1000] glass rounded-full px-4 py-2 text-[12px] flex items-center gap-2 shadow-glass hover:bg-white/[0.12] transition-colors disabled:opacity-60"
        >
          {hotelsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          Buscar hotéis em {radiusKm} km
        </button>
      )}
      {origin && !navigationMode && (
        <button
          onClick={centerOnMe}
          title={followMe ? 'Seguindo — clique no mapa para pausar' : 'Centralizar em mim'}
          className={`absolute bottom-6 right-4 z-[1000] glass rounded-full w-11 h-11 flex items-center justify-center shadow-glass transition-colors
            ${followMe ? 'text-accent bg-accent/10 border-accent/30' : 'text-ink-200 hover:bg-white/[0.12]'}`}
        >
          {followMe ? <LocateFixed className="w-4 h-4" /> : <Locate className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function drawRouteOnLayer(route: Route, layer: L.LayerGroup) {
  // Pickup leg — solid blue
  if (route.polyline.length >= 2) {
    L.polyline(
      route.polyline.map((p) => [p.lat, p.lng]),
      {
        color: '#0A84FF',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      },
    ).addTo(layer);
  }
  // Return leg — dashed green
  if (route.returnPolyline.length >= 2) {
    L.polyline(
      route.returnPolyline.map((p) => [p.lat, p.lng]),
      {
        color: '#34C759',
        weight: 4,
        opacity: 0.9,
        dashArray: '8 10',
        lineCap: 'round',
      },
    ).addTo(layer);
  }
  // Step numbers
  route.stops.forEach((s) => {
    L.marker([s.lat, s.lng], {
      icon: stepIcon(s.order),
      zIndexOffset: 800,
    })
      .bindTooltip(`${s.order}. ${escapeHtml(s.name)} — ${s.guests} pax`, {
        direction: 'top',
        offset: [0, -12],
      })
      .addTo(layer);
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

function haversineKmLocal(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
