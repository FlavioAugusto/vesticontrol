/**
 * ─── MÓDULO DE SEGURANÇA ────────────────────────────────────────────────────
 * Proteção contra: SQLi, XSS, CSRF, Brute Force, Path Traversal,
 * Scanner de vulnerabilidades, Bots maliciosos e injeção de scripts.
 */

// ─── Rate Limiting por IP + endpoint ────────────────────────────────────────
const hitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, opts: { max: number; windowMs: number }): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hitMap.get(key);
  if (!entry || entry.resetAt < now) {
    hitMap.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.max - 1 };
  }
  if (entry.count >= opts.max) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: opts.max - entry.count };
}

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hitMap.entries()) {
    if (val.resetAt < now) hitMap.delete(key);
  }
}, 5 * 60 * 1000);

// ─── Sanitização de inputs ──────────────────────────────────────────────────
export function sanitizeString(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLen)
    .replace(/[<>]/g, '')                      // remove < >
    .replace(/javascript:/gi, '')              // remove javascript:
    .replace(/on\w+\s*=/gi, '')                // remove event handlers (onclick=, etc)
    .replace(/data:\s*text\/html/gi, '')        // remove data URIs perigosos
    .replace(/vbscript:/gi, '')                // remove vbscript:
    .trim();
}

export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  const e = email.toLowerCase().trim().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

export function sanitizeSlug(slug: unknown): string {
  if (typeof slug !== 'string') return '';
  return slug.toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 100);
}

export function sanitizeUUID(id: unknown): string {
  if (typeof id !== 'string') return '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : '';
}

export function sanitizeNumber(val: unknown, min = 0, max = 999999): number {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

// ─── Detecção de User-Agents maliciosos ────────────────────────────────────
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /nuclei/i, /metasploit/i,
  /burpsuite/i, /acunetix/i, /nessus/i, /openvas/i, /w3af/i, /dirbuster/i,
  /wfuzz/i, /hydra/i, /medusa/i, /zap/i, /skipfish/i, /whatweb/i,
  /python-requests\/[0-9]/i, /go-http-client/i, /curl\/[0-9]/i,
  /libwww-perl/i, /wget/i, /scrapy/i, /mechanize/i,
];

export function isMaliciousUA(ua: string | null): boolean {
  if (!ua) return false;
  return BLOCKED_UA_PATTERNS.some(p => p.test(ua));
}

// ─── Paths suspeitos (scanners tentam esses) ────────────────────────────────
const HONEYPOT_PATHS = [
  '/wp-admin', '/wp-login', '/phpmyadmin', '/.env', '/.git',
  '/admin.php', '/config.php', '/backup', '/shell', '/cmd',
  '/.htaccess', '/web.config', '/xmlrpc.php', '/eval',
  '/etc/passwd', '/proc/self', '/cgi-bin', '/admin/config',
  '/actuator', '/swagger', '/graphql', '/../', '/..%2F',
  '/admin/admin.php', '/login.php', '/wp-content',
];

export function isHoneypotPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return HONEYPOT_PATHS.some(p => lower.includes(p));
}

// ─── Detecção de injeção SQL ────────────────────────────────────────────────
const SQL_PATTERNS = [
  /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bTRUNCATE\b)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(--|;|\/\*|\*\/|xp_|0x[0-9a-f]+)/i,
  /(\bOR\b|\bAND\b)\s+[\d'"]+=\s*[\d'"]+/i,
  /\bEXEC\b|\bEXECUTE\b|\bsp_/i,
  /CHAR\s*\(|CONCAT\s*\(|CAST\s*\(/i,
];

export function hasSQLInjection(input: string): boolean {
  return SQL_PATTERNS.some(p => p.test(input));
}

// ─── Detecção de XSS ────────────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<script[\s>]/i, /<\/script>/i, /javascript:/i,
  /on\w+\s*=\s*["'`]/i, /<iframe/i, /<object/i,
  /<embed/i, /eval\s*\(/i, /expression\s*\(/i,
  /document\.cookie/i, /window\.location/i, /alert\s*\(/i,
  /<img[^>]+onerror/i, /data:text\/html/i, /vbscript:/i,
];

export function hasXSS(input: string): boolean {
  return XSS_PATTERNS.some(p => p.test(input));
}

// ─── Valida body completo de um request ────────────────────────────────────
export function validateBody(body: Record<string, unknown>): { safe: boolean; reason?: string } {
  for (const [key, val] of Object.entries(body)) {
    if (typeof val === 'string') {
      if (hasSQLInjection(val)) return { safe: false, reason: `Campo "${key}" contém padrão SQL suspeito` };
      if (hasXSS(val)) return { safe: false, reason: `Campo "${key}" contém script malicioso` };
    }
  }
  return { safe: true };
}

// ─── Headers de segurança HTTP ──────────────────────────────────────────────
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https://images.unsplash.com",
    "connect-src 'self' https://*.supabase.co https://api.mercadopago.com https://api.checkout.infinitepay.io https://viacep.com.br https://melhorenvio.com.br",
    "frame-src 'self' https://www.google.com https://maps.google.com https://www.google.com.br https://*.google.com https://checkout.infinitepay.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// ─── IP do cliente ──────────────────────────────────────────────────────────
export function getClientIP(req: { headers: { get: (h: string) => string | null } }): string {
  return (
    req.headers.get('cf-connecting-ip') ||     // Cloudflare
    req.headers.get('x-real-ip') ||            // Nginx
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
