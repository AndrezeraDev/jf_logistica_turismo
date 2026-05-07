import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, MapPin, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { useStore } from '../store/useStore';

export function WelcomeDialog() {
  const welcomeSeen = useStore((s) => s.welcomeSeen);
  const markWelcomeSeen = useStore((s) => s.markWelcomeSeen);
  const setPickingOrigin = useStore((s) => s.setPickingOrigin);
  const setSettings = useStore((s) => s.setSettings);

  function pickOrigin() {
    // Limpa partida + saída antigas pra usuário marcar do zero — não pode aparecer
    // já preenchido. Origin → MapView encadeia automaticamente pickingDestination.
    setSettings({ origin: undefined, destination: undefined });
    setPickingOrigin(true);
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
            <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-accent to-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(10,132,255,0.55)]"
              >
                <Crosshair className="w-7 h-7 text-white" />
              </motion.div>

              <div className="text-center mt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Bem-vindo
                </div>
                <h2 className="text-[22px] font-semibold tracking-tight mt-1">
                  Marque seu ponto de partida
                </h2>
                <p className="text-[13px] text-ink-300 leading-relaxed mt-2">
                  É a partir desse ponto que as rotas serão calculadas. Toque no botão
                  abaixo e clique no local exato no mapa.
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <Bullet text="Garagem, hotel base, escritório — onde a operação inicia" />
                <Bullet text="Pode mudar a qualquer momento em Configurações" />
                <Bullet text="A rota de coleta e retorno usa esse ponto" />
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={pickOrigin}
                >
                  <MapPin className="w-4 h-4" />
                  Marcar no mapa
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
                Você também pode buscar por endereço em Configurações.
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
