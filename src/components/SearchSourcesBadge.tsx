import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';

/** Mostra de onde vieram os hotéis da última busca — diagnóstico visual. */
export function SearchSourcesBadge() {
  const stats = useStore((s) => s.lastSearchSources);
  const [open, setOpen] = useState(false);
  if (!stats) return null;

  const fsqOk = stats.foursquare > 0;
  const fsqHidden = stats.foursquare === 0 && !stats.fsqError;

  // procura por uma palavra-chave (ex: "fioreze") nos nomes pra debug rápido
  const [needle, setNeedle] = useState('');
  const lc = needle.trim().toLowerCase();
  const fsqMatches = lc ? (stats.fsqNames || []).filter((n) => n.toLowerCase().includes(lc)) : [];
  const osmMatches = lc ? (stats.osmNames || []).filter((n) => n.toLowerCase().includes(lc)) : [];
  const mergedMatches = lc ? (stats.mergedNames || []).filter((n) => n.toLowerCase().includes(lc)) : [];

  return (
    <div className="text-[10.5px] text-ink-500 pl-5 space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`px-1.5 py-0.5 rounded-md border ${
            fsqOk
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : stats.fsqError
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-white/[0.04] border-white/10 text-ink-500'
          }`}
          title={stats.fsqError || ''}
        >
          Foursquare: {fsqHidden ? 'off' : stats.foursquare}
        </span>
        <span className="px-1.5 py-0.5 rounded-md border bg-white/[0.04] border-white/10">
          OSM: {stats.osm}
        </span>
        <span className="text-ink-600">→ {stats.merged} no mapa</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto flex items-center gap-0.5 text-ink-400 hover:text-ink-200"
        >
          debug {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {stats.fsqError && (
        <div className="text-[10px] text-red-300 break-words">
          FSQ erro: {stats.fsqError}
        </div>
      )}

      {open && (
        <div className="space-y-1 pt-1 border-t border-white/5">
          <input
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="Buscar nome (ex: fioreze)…"
            className="w-full h-7 px-2 rounded-md bg-white/[0.04] border border-white/10 text-[11px] text-ink-100 placeholder-ink-500 outline-none focus:border-accent/60"
          />
          {lc && (
            <div className="text-[10px] space-y-0.5">
              <div className="text-emerald-300">
                FSQ ({fsqMatches.length}): {fsqMatches.join(' • ') || '—'}
              </div>
              <div className="text-ink-300">
                OSM ({osmMatches.length}): {osmMatches.join(' • ') || '—'}
              </div>
              <div className="text-accent">
                Merged ({mergedMatches.length}): {mergedMatches.join(' • ') || '—'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
