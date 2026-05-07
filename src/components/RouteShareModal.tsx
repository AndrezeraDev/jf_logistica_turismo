import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Share2,
  Printer,
  Copy,
  Check,
  Map as MapIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  buildGoogleMapsUrl,
  buildShareText,
  printRoute,
} from '../lib/share';

export const RouteShareModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const route = useStore((s) => s.route);
  const settings = useStore((s) => s.settings);
  const vehicles = useStore((s) => s.vehicles);
  const vehicle = vehicles.find((v) => v.id === route?.suggestedVehicleId);
  const [copied, setCopied] = useState(false);

  if (!route) return null;

  const ctx = {
    route,
    originLabel: settings.origin?.label,
    destinationLabel: settings.destination?.label,
    vehicle,
  };

  const text = buildShareText(ctx);
  const gmapsUrl = buildGoogleMapsUrl(ctx);
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* fallback could be added */
    }
  }

  async function nativeShare() {
    try {
      await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
        title: 'Roteiro JE Hoffmann',
        text,
        url: gmapsUrl,
      });
    } catch {
      /* user cancelou ou erro — silencioso */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-lg rounded-3xl p-5 shadow-glass max-h-[88vh] overflow-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-ink-400 text-[11px] uppercase tracking-wider">
                  <Share2 className="w-3.5 h-3.5" /> Compartilhar
                </div>
                <div className="text-[18px] font-semibold mt-1">Roteiro de coleta</div>
                <div className="text-[12px] text-ink-400 mt-0.5">
                  {route.stops.length} parada(s) · {route.totalGuests} pax ·{' '}
                  {route.totalDistanceKm.toFixed(1)} km
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview do texto */}
            <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 max-h-40 overflow-auto text-[11.5px] text-ink-200 font-mono leading-snug whitespace-pre-wrap mb-4">
              {text}
            </div>

            {/* Ações */}
            <div className="grid grid-cols-2 gap-2">
              <ShareAction
                icon={<Printer className="w-4 h-4" />}
                label="Imprimir / PDF"
                description="Layout limpo pra salvar PDF"
                onClick={() => printRoute(ctx)}
              />
              <ShareAction
                icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                label={copied ? 'Copiado!' : 'Copiar texto'}
                description="WhatsApp, email, etc."
                onClick={copyToClipboard}
                highlight={copied}
              />
              <ShareAction
                icon={<MapIcon className="w-4 h-4" />}
                label="Google Maps"
                description="Abre rota com waypoints"
                onClick={() => window.open(gmapsUrl, '_blank', 'noopener')}
              />
              {canNativeShare && (
                <ShareAction
                  icon={<Share2 className="w-4 h-4" />}
                  label="Compartilhar..."
                  description="Apps do dispositivo"
                  onClick={nativeShare}
                />
              )}
            </div>

            <div className="mt-3 text-[10px] text-ink-500 text-center leading-relaxed">
              O Google Maps vai abrir com seu ponto de partida + todos os hotéis na ordem
              correta e o destino final.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ShareAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}> = ({ icon, label, description, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`text-left p-3 rounded-2xl border transition-all active:scale-[0.98] ${
      highlight
        ? 'bg-emerald-500/10 border-emerald-500/40'
        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
    }`}
  >
    <div className="flex items-center gap-2 text-ink-100">
      {icon}
      <span className="text-[13px] font-medium">{label}</span>
    </div>
    <div className="text-[11px] text-ink-400 mt-1">{description}</div>
  </button>
);
