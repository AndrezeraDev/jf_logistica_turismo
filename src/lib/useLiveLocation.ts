import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

/**
 * Enquanto `liveTracking` estiver on, mantém um `watchPosition` ativo:
 * atualiza `settings.origin` + `liveAccuracyM` a cada update do GPS.
 * No PRIMEIRO fix de cada sessão, dispara `requestLocationZoom` pra que o
 * MapView faça flyTo suave até a posição real (não pra um origin antigo).
 */
export function useLiveLocation() {
  const liveTracking = useStore((s) => s.liveTracking);
  const setSettings = useStore((s) => s.setSettings);
  const setLiveAccuracy = useStore((s) => s.setLiveAccuracy);
  const setLiveError = useStore((s) => s.setLiveError);
  const setLiveTracking = useStore((s) => s.setLiveTracking);
  const firstFixRef = useRef(true);

  useEffect(() => {
    if (!liveTracking) {
      setLiveAccuracy(undefined);
      firstFixRef.current = true; // reset pra próxima ativação
      return;
    }
    if (!('geolocation' in navigator)) {
      setLiveError('Navegador sem suporte a geolocalização.');
      setLiveTracking(false);
      return;
    }
    const insecure =
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';
    if (insecure) {
      setLiveError(
        'Rastreamento exige HTTPS ou localhost. Acesse pelo http://localhost:5173.',
      );
      setLiveTracking(false);
      return;
    }

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        // No primeiro fix da sessão, peça pro mapa fazer um flyTo suave.
        // Importante: chamar ANTES de setSettings — assim, quando o efeito
        // do MapView reagir à mudança de origin, requestZoomOnNextLocation
        // já estará true e o flyTo é executado.
        if (firstFixRef.current) {
          useStore.getState().requestLocationZoom();
          firstFixRef.current = false;
        }
        setSettings({
          origin: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: 'Ao vivo',
          },
        });
        setLiveAccuracy(pos.coords.accuracy);
        setLiveError(undefined);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Permissão de localização negada.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Sinal GPS indisponível (precisa de GPS ou Wi-Fi de referência).'
            : err.code === err.TIMEOUT
            ? 'Tempo esgotado ao obter localização.'
            : err.message || 'Falha desconhecida.';
        setLiveError(msg);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(wid);
  }, [liveTracking, setSettings, setLiveAccuracy, setLiveError, setLiveTracking]);
}
