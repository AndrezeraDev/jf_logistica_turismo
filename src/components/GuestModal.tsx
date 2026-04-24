import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Hotel } from '../types';

export function GuestModal({
  hotel,
  onClose,
  onSave,
}: {
  hotel: Hotel | null;
  onClose: () => void;
  onSave: (guests: number) => void;
}) {
  const [value, setValue] = useState('');
  useEffect(() => {
    if (hotel) setValue(String(hotel.guests || ''));
  }, [hotel]);

  return (
    <AnimatePresence>
      {hotel && (
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
                  <Users className="w-3.5 h-3.5" /> Hóspedes neste hotel
                </div>
                <div className="text-[17px] font-semibold mt-1">{hotel.name}</div>
                {hotel.address && (
                  <div className="text-[12px] text-ink-400 mt-0.5">{hotel.address}</div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5">
              <label className="text-[12px] text-ink-400 mb-1.5 block">
                Quantidade de pessoas
              </label>
              <Input
                type="number"
                min={0}
                step={1}
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave(parseInt(value || '0', 10));
                  }
                }}
                placeholder="0"
                className="text-center text-2xl h-14 font-semibold"
              />
              <div className="flex gap-2 mt-3 justify-center">
                {[1, 2, 4, 6, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setValue(String(n))}
                    className="h-8 px-3 rounded-lg text-[12px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-colors"
                  >
                    +{n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => onSave(parseInt(value || '0', 10))}
                className="flex-1"
              >
                Salvar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
