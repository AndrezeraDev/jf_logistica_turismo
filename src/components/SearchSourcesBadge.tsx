import { useStore } from '../store/useStore';

/** Mostra de onde vieram os hotéis da última busca — diagnóstico visual. */
export function SearchSourcesBadge() {
  const stats = useStore((s) => s.lastSearchSources);
  if (!stats) return null;

  const fsqOk = stats.foursquare > 0;
  const fsqHidden = stats.foursquare === 0 && !stats.fsqError;
  return (
    <div className="text-[10.5px] text-ink-500 flex items-center gap-1.5 flex-wrap pl-5">
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
      {stats.fsqError && (
        <div className="basis-full text-[10px] text-red-300 mt-0.5 break-words">
          FSQ erro: {stats.fsqError}
        </div>
      )}
    </div>
  );
}
