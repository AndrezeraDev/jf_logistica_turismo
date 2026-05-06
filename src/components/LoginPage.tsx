import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase, usernameToEmail } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Captcha {
  a: number;
  b: number;
  answer: number;
}

function genCaptcha(): Captcha {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { a, b, answer: a + b };
}

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState<Captcha>(() => genCaptcha());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function regen() {
    setCaptcha(genCaptcha());
    setCaptchaInput('');
  }

  async function submit() {
    setError(null);
    if (!username.trim() || !password) {
      setError('Preencha usuário e senha.');
      return;
    }
    if (Number(captchaInput) !== captcha.answer) {
      setError('Verificação anti-bot incorreta. Tente novamente.');
      regen();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(username),
        password,
      });
      if (error) {
        const msg = error.message || '';
        setError(
          msg.includes('Invalid login credentials')
            ? 'Usuário ou senha incorretos.'
            : msg,
        );
        regen();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      regen();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-[#0b0b0d]">
      {/* aurora background — 3 manchas radiais animadas */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-[30%] -left-[20%] w-[800px] h-[800px] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(10,132,255,0.45), transparent 70%)',
          }}
          animate={{ x: [0, 120, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[30%] -right-[20%] w-[700px] h-[700px] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(52,199,89,0.30), transparent 70%)',
          }}
          animate={{ x: [0, -80, 0], y: [0, -50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[20%] right-[15%] w-[500px] h-[500px] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(180,80,255,0.22), transparent 70%)',
          }}
          animate={{ x: [0, 60, 0], y: [0, 90, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* grid sutil — efeito "tech" */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative glass rounded-3xl p-7 sm:p-8 max-w-sm w-full mx-4 shadow-glass z-10"
      >
        <div className="flex justify-center mb-5">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 16 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-b from-accent to-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(10,132,255,0.55)] text-white font-bold text-lg tracking-tight"
          >
            JF
          </motion.div>
        </div>

        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-400">
            JF Logística
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1">Entrar</h1>
          <p className="text-[12px] text-ink-400 mt-1">
            Use suas credenciais pra acessar o painel
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              autoFocus
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="pl-9"
              autoComplete="username"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="pl-9"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-[11px] uppercase tracking-wider text-ink-400 select-none flex-shrink-0">
              Anti-bot
            </span>
            <span className="font-mono text-[14px] text-ink-100 select-none">
              {captcha.a} + {captcha.b} =
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="flex-1 bg-transparent outline-none text-center font-mono text-[14px] text-ink-100"
              maxLength={2}
              aria-label="Resposta do captcha"
            />
            <button
              type="button"
              onClick={regen}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-white/5 transition-colors"
              aria-label="Trocar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-2 text-[12px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={submit}
            loading={loading}
          >
            {!loading && <LogIn className="w-4 h-4" />}
            Entrar
          </Button>
        </div>

        <div className="mt-6 text-center text-[10px] text-ink-500">
          © {new Date().getFullYear()} JF Logística
        </div>
      </motion.div>
    </div>
  );
}
