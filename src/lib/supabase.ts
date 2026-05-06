import { createClient } from '@supabase/supabase-js';

// Env vars na Vercel (recomendado), com fallback hardcoded p/ dev local.
// A anon key é PÚBLICA por design — segurança vem do RLS configurado no banco.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://xmqnabyluqoxljxnutrb.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcW5hYnlsdXFveGxqeG51dHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTAwMjksImV4cCI6MjA5MzYyNjAyOX0.YKjCPAWhXBwag85WXMn-4y1RXPwgZH0lvo2cQnxKtsM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Convenção: username "admin" → email "admin@jflogistica.local".
// O domínio é fictício; só serve como ID interno do Supabase Auth.
export const USERNAME_DOMAIN = '@jflogistica.local';

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}${USERNAME_DOMAIN}`;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}
