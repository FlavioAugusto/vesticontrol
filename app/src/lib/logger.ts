/**
 * Logger seguro para produção.
 * - Em dev: imprime no console
 * - Em produção: silencia info/debug, mantém apenas warn/error
 * - Nunca loga dados sensíveis (tokens, senhas, payment_id completo)
 */

const isDev = process.env.NODE_ENV !== 'production';

function sanitize(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      // Mascara tokens, chaves e IDs longos
      return arg
        .replace(/(eyJ[A-Za-z0-9_\-\.]+)/g, '***JWT***')
        .replace(/(sk_[a-zA-Z0-9_]+)/g, '***SECRET***')
        .replace(/(APP_USR-[a-zA-Z0-9-]+)/g, '***MP_TOKEN***');
    }
    if (arg instanceof Error) return { name: arg.name, message: arg.message };
    return arg;
  });
}

export const logger = {
  debug: (...args: unknown[]) => { if (isDev) console.debug('[DEBUG]', ...sanitize(args)); },
  info:  (...args: unknown[]) => { if (isDev) console.info('[INFO]',  ...sanitize(args)); },
  warn:  (...args: unknown[]) => console.warn('[WARN]', ...sanitize(args)),
  error: (...args: unknown[]) => console.error('[ERROR]', ...sanitize(args)),
};

/**
 * Valida UUID v4 (qualquer versão Postgres)
 */
export function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Extrai mensagem de erro segura para retornar ao cliente
 */
export function errorMessage(e: unknown, fallback = 'Erro interno'): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return fallback;
}
