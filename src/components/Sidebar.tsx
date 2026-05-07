import { Map, Bus, Settings, Users, LogOut, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export type Tab = 'map' | 'fleet' | 'settings' | 'users';

export function Sidebar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const profile = useStore((s) => s.profile);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const isAdmin = profile?.role === 'admin';

  const items: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'map', label: 'Rotas', icon: <Map className="w-[18px] h-[18px]" /> },
    { key: 'fleet', label: 'Frota', icon: <Bus className="w-[18px] h-[18px]" /> },
    ...(isAdmin
      ? [
          {
            key: 'users' as Tab,
            label: 'Users',
            icon: <Users className="w-[18px] h-[18px]" />,
          },
        ]
      : []),
    { key: 'settings', label: 'Config.', icon: <Settings className="w-[18px] h-[18px]" /> },
  ];

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <aside className="w-[72px] flex-shrink-0 border-r border-white/5 bg-black/30 backdrop-blur-xl flex flex-col items-center py-4 gap-1">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-accent to-blue-600 shadow-[0_6px_18px_rgba(10,132,255,0.45)] flex items-center justify-center text-white font-bold text-sm mb-2">
        JE
      </div>
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className="relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 group transition-colors"
          >
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-2xl bg-white/[0.08] border border-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span
              className={`relative ${active ? 'text-ink-100' : 'text-ink-400 group-hover:text-ink-200'} transition-colors`}
            >
              {it.icon}
            </span>
            <span
              className={`relative text-[9px] font-medium tracking-wide uppercase ${active ? 'text-ink-200' : 'text-ink-400 group-hover:text-ink-300'}`}
            >
              {it.label}
            </span>
          </button>
        );
      })}

      {profile && (
        <div className="mt-auto flex flex-col items-center gap-1 pb-1">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-white/[0.06] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
          </button>
          <div
            title={profile.username}
            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[11px] font-semibold uppercase text-ink-200"
          >
            {profile.username.slice(0, 2)}
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-ink-400 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}
    </aside>
  );
}
