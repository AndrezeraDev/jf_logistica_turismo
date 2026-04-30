import { AnimatePresence, motion } from 'framer-motion';
import { Navigation, MapPin, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { useStore } from '../store/useStore';

export function WelcomeDialog() {
  const welcomeSeen = useStore((s) => s.welcomeSeen);
  const markWelcomeSeen = useStore((s) => s.markWelcomeSeen);
  const setLiveTracking = useStore((s) => s.setLiveTracking);
  const requestLocationZoom = useStore((s) => s.requestLocationZoom);

  function activate() {
    setLiveTracking(true); // já liga followMe automático
    requestLocationZoom(); // MapView vai dar flyTo no primeiro fix
    markWelcomeSeen();
  }

  function skip() {
    markWelcomeSeen();
  }

  return (
    <AnimatePresence>
      {!welcomeSeen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className="glass w-full max-w-md rounded-3xl p-6 shadow-glass relative overflow-hidden"
          >
            {/* halo decorativo */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              {/* ícone hero */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-accent to-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(10,132,255,0.55)]"
              >
                <Navigation className="w-7 h-7 text-white" fill="currentColor" />
              </motion.div>

              <div className="text-center mt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Bem-vindo
                </div>
                <h2 className="text-[22px] font-semibold tracking-tight mt-1">
                  Ative o GPS pra começar
                </h2>
                <p className="text-[13px] text-ink-300 leading-relaxed mt-2">
                  Ao ativar, sua localização aparece em tempo real no mapa e o app já enquadra
                  automaticamente onde você está. Você pode desligar a qualquer momento em
                  Configurações.
                </p>
              </div>

              {/* benefícios */}
              <div className="mt-5 space-y-2">
                <Bullet text="Posição atualizada conforme você se desloca" />
                <Bullet text="Mapa centralizado em você" />
                <Bullet text="Otimização de rota com base no seu ponto" />
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={activate}
                >
                  <MapPin className="w-4 h-4" />
                  Ativar GPS
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full text-ink-400"
                  onClick={skip}
                >
                  Agora não
                </Button>
              </div>

              <div className="mt-3 text-[10px] text-ink-500 text-center leading-relaxed">
                Sua localização nunca sai do dispositivo. Funciona em HTTPS ou localhost.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px] text-ink-200">
      <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(10,132,255,0.8)]" />
      {text}
    </div>
  );
}
