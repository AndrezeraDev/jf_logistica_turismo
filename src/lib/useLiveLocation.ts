import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { haversineKm } from './geo';

// Distância mínima (metros) entre updates pra commitar setSettings.
// GPS oscila ~3-5m parado — sem isso o app re-renderiza várias vezes por segundo
// só por jitter, o que pode travar mobile. 5m é um bom balanço.
const MIN_MOVE_METERS = 5;

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
  const lastCommittedRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!liveTracking) {
      setLiveAccuracy(undefined);
      firstFixRef.current = true; // reset pra próxima ativação
      lastCommittedRef.current = null;
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Sempre atualiza accuracy (barato — não dispara cascata)
        setLiveAccuracy(pos.coords.accuracy);
        setLiveError(undefined);

        // No primeiro fix da sessão, peça pro mapa fazer um flyTo suave.
        // Importante: chamar ANTES de setSettings — assim, quando o efeito
        // do MapView reagir à mudança de origin, requestZoomOnNextLocation
        // já estará true e o flyTo é executado.
        if (firstFixRef.current) {
          useStore.getState().requestLocationZoom();
          firstFixRef.current = false;
        } else if (lastCommittedRef.current) {
          // Skip update se o usuário praticamente não se moveu — evita
          // re-renders desnecessários (GPS oscila parado por ~3-5m).
          const distKm = haversineKm(lastCommittedRef.current, { lat, lng });
          if (distKm * 1000 < MIN_MOVE_METERS) return;
        }

        lastCommittedRef.current = { lat, lng };
        setSettings({
          origin: { lat, lng, label: 'Ao vivo' },
        });
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
