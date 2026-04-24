import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/**
 * Enquanto `liveTracking` estiver on, mantém um `watchPosition` ativo:
 * atualiza `settings.origin` + `liveAccuracyM` a cada update do GPS.
 */
export function useLiveLocation() {
  const liveTracking = useStore((s) => s.liveTracking);
  const setSettings = useStore((s) => s.setSettings);
  const setLiveAccuracy = useStore((s) => s.setLiveAccuracy);
  const setLiveError = useStore((s) => s.setLiveError);
  const setLiveTracking = useStore((s) => s.setLiveTracking);

  useEffect(() => {
    if (!liveTracking) {
      setLiveAccuracy(undefined);
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
