// Rate limiting simples em memória (sem Redis)
// Para produção escalável, substituir por Upstash Redis

const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs: number;   // janela em ms
  max: number;        // máximo de requests
}

export function rateLimit(key: string, options: RateLimitOptions): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.max - 1, resetIn: options.windowMs };
  }

  if (entry.count >= options.max) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: options.max - entry.count, resetIn: entry.resetAt - now };
}

// Limpar entradas expiradas periodicamente (evitar memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;
  return 'unknown';
}
