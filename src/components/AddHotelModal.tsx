import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Building2, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function AddHotelModal({
  point,
  onClose,
  onSave,
}: {
  point: { lat: number; lng: number } | null;
  onClose: () => void;
  onSave: (data: { name: string; guests: number }) => void;
}) {
  const [name, setName] = useState('');
  const [guests, setGuests] = useState('');

  useEffect(() => {
    if (point) {
      setName('');
      setGuests('');
    }
  }, [point]);

  function submit() {
    onSave({
      name: name.trim() || 'Hotel personalizado',
      guests: parseInt(guests || '0', 10) || 0,
    });
  }

  return (
    <AnimatePresence>
      {point && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-3xl p-5 shadow-glass"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-ink-400 text-[11px] uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" /> Novo hotel
                </div>
                <div className="text-[17px] font-semibold mt-1">Adicionar manualmente</div>
                <div className="text-[11px] text-ink-400 mt-0.5 font-mono">
                  {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-[12px] text-ink-400 mb-1.5 block">Nome</label>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pousada do Mar"
                />
              </div>

              <div>
                <label className="text-[12px] text-ink-400 mb-1.5 block flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Hóspedes
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="0"
                  className="text-center text-xl h-12 font-semibold"
                />
                <div className="flex gap-2 mt-2 justify-center">
                  {[1, 2, 4, 6, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setGuests(String(n))}
                      className="h-8 px-3 rounded-lg text-[12px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button variant="primary" onClick={submit} className="flex-1">
                Adicionar hotel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
