import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShieldCheck, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { supabase, type Profile } from '../lib/supabase';
import { useStore } from '../store/useStore';

export function UsersPanel() {
  const profile = useStore((s) => s.profile);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function create() {
    setCreateError(null);
    const u = newUsername.trim().toLowerCase();
    if (!u || !newPassword) {
      setCreateError('Preencha usuário e senha.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(u)) {
      setCreateError('Use apenas letras minúsculas, números, "_" ou "-".');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('Senha precisa ter ao menos 6 caracteres.');
      return;
    }
    setCreating(true);
    const { error } = await supabase.rpc('admin_create_user', {
      p_username: u,
      p_password: newPassword,
      p_role: newRole,
    });
    if (error) {
      setCreateError(error.message);
      setCreating(false);
      return;
    }
    setNewUsername('');
    setNewPassword('');
    setNewRole('user');
    setCreating(false);
    await load();
  }

  async function remove(userId: string, username: string) {
    if (!confirm(`Excluir usuário "${username}"? Essa ação não pode ser desfeita.`)) return;
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
      return;
    }
    await load();
  }

  if (!isAdmin) {
    return (
      <Card title="Usuários">
        <div className="text-[12px] text-ink-400 leading-relaxed">
          Esta tela é restrita a administradores.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card
        title="Criar novo usuário"
        subtitle="Apenas admins podem criar contas"
        action={<Plus className="w-4 h-4 text-ink-400" />}
      >
        <div className="space-y-2">
          <Input
            placeholder="Usuário (ex: maria)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
            autoComplete="off"
          />
          <Input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
            className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-ink-100 focus:outline-none focus:border-accent/60"
          >
            <option value="user">Usuário comum</option>
            <option value="admin">Administrador</option>
          </select>
          {createError && (
            <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {createError}
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={create}
            loading={creating}
          >
            <Plus className="w-3.5 h-3.5" /> Criar usuário
          </Button>
        </div>
      </Card>

      <Card
        title={`Usuários cadastrados (${users.length})`}
        action={
          <button
            onClick={load}
            disabled={loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-white/5 disabled:opacity-50"
            aria-label="Recarregar"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        }
      >
        {error && (
          <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
            {error}
          </div>
        )}
        <div className="space-y-1.5 max-h-72 overflow-auto pr-1">
          <AnimatePresence initial={false}>
            {users.map((u) => {
              const isMe = u.id === profile?.id;
              const isAdminUser = u.role === 'admin';
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAdminUser
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                        : 'bg-white/[0.06] border border-white/10 text-ink-300'
                    }`}
                  >
                    {isAdminUser ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-100 truncate flex items-center gap-1.5">
                      {u.username}
                      {isMe && (
                        <span className="text-[10px] uppercase tracking-wider text-accent">
                          você
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-400">
                      {isAdminUser ? 'Administrador' : 'Usuário'}
                    </div>
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => remove(u.id, u.username)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-400 hover:bg-white/5"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
