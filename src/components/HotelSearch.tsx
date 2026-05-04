import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Building2, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Hotel } from '../types';

export function HotelSearch({ onPick }: { onPick: (h: Hotel) => void }) {
  const hotels = useStore((s) => s.hotels);
  const navigationMode = useStore((s) => s.navigationMode);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // foca o input ao abrir
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQ('');
    }
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      // sem termo: mostra os primeiros 50 (priorizando os que têm hóspedes)
      return [...hotels]
        .sort((a, b) => (b.guests > 0 ? 1 : 0) - (a.guests > 0 ? 1 : 0))
        .slice(0, 50);
    }
    const scored = hotels
      .map((h) => {
        const name = h.name.toLowerCase();
        const addr = (h.address || '').toLowerCase();
        let score = 0;
        if (name === term) score += 100;
        else if (name.startsWith(term)) score += 60;
        else if (name.includes(term)) score += 30;
        if (addr.includes(term)) score += 5;
        return { h, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((x) => x.h);
    return scored;
  }, [hotels, q]);

  if (hotels.length === 0 || navigationMode) return null;

  return (
    <>
      {/* Botão lupa */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Buscar hotel"
        className="absolute top-[148px] left-4 z-[1000] glass rounded-full w-11 h-11 flex items-center justify-center shadow-glass text-ink-100 hover:bg-white/[0.12] transition-colors md:top-4 md:left-auto md:right-[210px]"
      >
        <Search className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9000] flex items-start justify-center pt-[10vh] px-4 bg-black/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg rounded-3xl overflow-hidden shadow-glass"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Search className="w-4 h-4 text-ink-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar hotel pelo nome…"
                  className="flex-1 h-9 bg-transparent border-0 outline-none text-[15px] text-ink-100 placeholder-ink-400"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-auto">
                {results.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[13px] text-ink-400">
                    Nenhum hotel encontrado para "<span className="text-ink-200">{q}</span>".
                  </div>
                ) : (
                  results.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setOpen(false);
                        onPick(h);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.06] active:bg-white/[0.1] border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                          h.guests > 0
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-accent/15 border border-accent/30 text-accent'
                        }`}
                      >
                        {h.guests > 0 ? h.guests : <Building2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] text-ink-100 truncate">{h.name}</div>
                        {h.address && (
                          <div className="text-[11px] text-ink-400 truncate">{h.address}</div>
                        )}
                      </div>
                      {h.guests > 0 && (
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1 flex-shrink-0">
                          <Users className="w-3 h-3" />
                          {h.guests}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-white/5 text-[10px] text-ink-500 flex items-center justify-between">
                <span>{results.length} resultado(s)</span>
                <span className="font-mono">ESC fecha</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
