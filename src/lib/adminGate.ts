/**
 * Confirma uma ação destrutiva pedindo a palavra-chave "admin".
 * Uso: if (!confirmAdmin('remover esta API key')) return;
 *
 * Implementação simples via window.prompt — o objetivo é prevenir cliques
 * acidentais, não segurança real. A palavra fica hardcoded no JS e qualquer
 * usuário pode abrir o devtools e ver. Suficiente pra "ops, cliquei sem querer".
 */
const ADMIN_PASSPHRASE = 'admin';

export function confirmAdmin(action: string): boolean {
  const pwd = window.prompt(
    `Pra ${action}, digite a palavra-chave de administrador:`,
  );
  if (pwd === null) return false; // cancelou
  if (pwd.trim().toLowerCase() === ADMIN_PASSPHRASE) return true;
  alert('Palavra-chave incorreta. Operação cancelada.');
  return false;
}
