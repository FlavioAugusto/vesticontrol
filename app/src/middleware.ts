import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  SECURITY_HEADERS, isMaliciousUA, isHoneypotPath,
  rateLimit, getClientIP,
} from '@/lib/security';

const LOJA_DEFAULT_ID = '00000000-0000-0000-0000-000000000001';

async function detectarLoja(hostname: string): Promise<{ id: string; slug: string } | null> {
  try {
    const host = hostname.toLowerCase().split(':')[0];
    if (host === 'localhost' || host.startsWith('127.') || host.endsWith('.easypanel.host') || host.endsWith('.vercel.app')) {
      return { id: LOJA_DEFAULT_ID, slug: 'bymarcelomedeiros' };
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return { id: LOJA_DEFAULT_ID, slug: 'bymarcelomedeiros' };

    const r1 = await fetch(`${url}/rest/v1/lojas?dominio=eq.${encodeURIComponent(host)}&ativo=eq.true&select=id,slug&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
    });
    if (r1.ok) { const a = await r1.json(); if (a?.[0]) return a[0]; }

    const partes = host.split('.');
    if (partes.length >= 3) {
      const r2 = await fetch(`${url}/rest/v1/lojas?slug=eq.${partes[0]}&ativo=eq.true&select=id,slug&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      });
      if (r2.ok) { const a = await r2.json(); if (a?.[0]) return a[0]; }
    }
    return { id: LOJA_DEFAULT_ID, slug: 'bymarcelomedeiros' };
  } catch {
    return { id: LOJA_DEFAULT_ID, slug: 'bymarcelomedeiros' };
  }
}

export async function middleware(req: NextRequest) {
  const ip = getClientIP(req as any);
  const { pathname } = req.nextUrl;
  const ua = req.headers.get('user-agent') || '';

  // ─── 1. BLOQUEIO IMEDIATO — scanners e honeypots ─────────────────────────
  if (isHoneypotPath(pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (isMaliciousUA(ua)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // ─── 2. RATE LIMITING GLOBAL ─────────────────────────────────────────────
  const globalLimit = rateLimit(`global:${ip}`, { max: 200, windowMs: 60_000 });
  if (!globalLimit.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
    });
  }

  // Rate limit extra para login (proteção brute force) — bem afrouxado
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    const loginLimit = rateLimit(`login:${ip}`, { max: 30, windowMs: 5 * 60_000 });
    if (!loginLimit.allowed) {
      // Página HTML bonita pra usuário; JSON pra API
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Muitas tentativas. Aguarde 5 minutos.' }), {
          status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '300' },
        });
      }
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Muitas tentativas — Aguarde</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e1a16; color: #faf9f7; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .container { max-width: 480px; width: 100%; background: #2a2520; border: 1px solid rgba(184,145,85,0.2); border-radius: 16px; padding: 48px 32px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
  .icon { width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(245,158,11,0.1); border: 2px solid rgba(245,158,11,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; }
  h1 { font-family: Georgia, serif; font-size: 28px; margin-bottom: 12px; color: #faf9f7; font-weight: 400; }
  .subtitle { color: #b89155; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 24px; font-weight: 600; }
  p { color: rgba(250,249,247,0.7); line-height: 1.7; margin-bottom: 16px; font-size: 14px; }
  .timer { background: rgba(184,145,85,0.1); border: 1px solid rgba(184,145,85,0.2); border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; color: #b89155; }
  .timer strong { display: block; font-size: 22px; margin-top: 6px; color: #fff; font-family: Georgia, serif; }
  .info { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-top: 20px; font-size: 12px; color: rgba(250,249,247,0.5); text-align: left; }
  .info ul { list-style: none; }
  .info li { padding: 4px 0; }
  .info li::before { content: '→ '; color: #b89155; font-weight: bold; }
  a { color: #b89155; text-decoration: none; font-weight: 600; }
  a:hover { text-decoration: underline; }
</style>
</head>
<body>
  <div class="container">
    <div class="icon">⏳</div>
    <p class="subtitle">Proteção de Segurança</p>
    <h1>Muitas tentativas detectadas</h1>
    <p>Por segurança, bloqueamos temporariamente novas tentativas de login deste dispositivo.</p>
    <div class="timer">
      Aguarde
      <strong>5 minutos</strong>
      antes de tentar novamente
    </div>
    <div class="info">
      <ul>
        <li>Confira se está usando o e-mail correto</li>
        <li>Caso esqueceu a senha, use a recuperação após o desbloqueio</li>
        <li>Se você não tentou fazer login, alguém pode estar tentando — fique atento(a)</li>
      </ul>
    </div>
    <p style="margin-top:24px; font-size:11px; color:rgba(250,249,247,0.4)">
      Esta proteção evita ataques de força bruta. <a href="/">Voltar ao site</a>
    </p>
  </div>
</body>
</html>`;
      return new NextResponse(html, {
        status: 429,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '300', 'Cache-Control': 'no-store' },
      });
    }
  }

  // Rate limit para APIs
  if (pathname.startsWith('/api/')) {
    const apiLimit = rateLimit(`api:${ip}`, { max: 100, windowMs: 60_000 });
    if (!apiLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
  }

  // ─── 4. MULTI-TENANT: identifica a loja ──────────────────────────────────
  // IMPORTANT: x-loja-id precisa ir no REQUEST (não response) pra Server Components lerem
  const hostname = req.headers.get('host') || '';
  const loja = await detectarLoja(hostname);

  // Clona o request com os headers da loja injetados
  const requestHeaders = new Headers(req.headers);
  // SEMPRE injeta (mesmo no fallback) pra Server Components confirmarem que middleware rodou
  requestHeaders.set('x-loja-id', loja?.id || LOJA_DEFAULT_ID);
  requestHeaders.set('x-loja-slug', loja?.slug || 'bymarcelomedeiros');
  requestHeaders.set('x-middleware-ran', 'true');
  requestHeaders.set('x-detected-host', hostname);

  // ─── 3. HEADERS DE SEGURANÇA ─────────────────────────────────────────────
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));

  // Remove headers que expõem tecnologia
  res.headers.delete('X-Powered-By');
  res.headers.delete('Server');

  // Também expõe no RESPONSE pra debug
  res.headers.set('x-loja-id', loja?.id || LOJA_DEFAULT_ID);
  res.headers.set('x-loja-slug', loja?.slug || 'bymarcelomedeiros');
  res.headers.set('x-middleware-ran', 'true');

  // ─── 5. SUPER-ADMIN: rotas removidas (sistema é loja única agora) ────────
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin')) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Rota não disponível' }, { status: 404 })
      : NextResponse.redirect(new URL('/admin', req.url));
  }

  // ─── 6. ADMIN: protege /admin com dupla validação ─────────────────────────
  if (pathname === '/admin/setup') return res;

  const ehRotaAdmin = pathname.startsWith('/admin') || pathname.startsWith('/minha-conta') ||
    (pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/config-pagamento') && !pathname.startsWith('/api/admin/gerar'));

  if (ehRotaAdmin) {
    // Headers anti-cache para nunca servir páginas admin do cache
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name) => req.cookies.get(name)?.value,
            set: (name, value, options) => { res.cookies.set({ name, value, ...options }); },
            remove: (name, options) => { res.cookies.set({ name, value: '', ...options }); },
          },
        }
      );

      // getUser() é MAIS SEGURO que getSession() — valida com o servidor Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      // Sem usuário ou erro de auth → redireciona pra login
      if (!user || userError) {
        if (pathname.startsWith('/api/admin/')) {
          return NextResponse.json({ error: 'Não autorizado. Faça login.', code: 'NOT_AUTHENTICATED' }, { status: 401 });
        }
        if (pathname.startsWith('/admin')) {
          // Salva a URL pra voltar após o login
          const next = encodeURIComponent(pathname);
          return NextResponse.redirect(new URL(`/login?next=${next}&motivo=sessao_expirada`, req.url));
        }
        if (pathname.startsWith('/minha-conta')) {
          const next = encodeURIComponent(pathname);
          return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
        }
      }

      // Para /admin: precisa ser admin OU super_admin (super_admin tem acesso total ao sistema)
      if (pathname.startsWith('/admin') && user) {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        try {
          // Verifica em paralelo: é admin? ou é super_admin?
          const [resAdmin, resSuper] = await Promise.all([
            fetch(
              `${supaUrl}/rest/v1/admins?id=eq.${user.id}&select=id&limit=1`,
              { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
            ),
            fetch(
              `${supaUrl}/rest/v1/super_admins?id=eq.${user.id}&select=id&limit=1`,
              { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
            ),
          ]);
          const adminList = resAdmin.ok ? await resAdmin.json() : [];
          const superList = resSuper.ok ? await resSuper.json() : [];
          const ehAdmin = Array.isArray(adminList) && adminList.length > 0;
          const ehSuper = Array.isArray(superList) && superList.length > 0;
          if (!ehAdmin && !ehSuper) {
            // Não é admin nem super_admin → bloqueia
            return NextResponse.redirect(new URL('/?acesso=negado', req.url));
          }
          // ✅ É admin ou super_admin → passa
        } catch {
          return NextResponse.redirect(new URL('/login?next=/admin&erro=verificacao', req.url));
        }
      }
    } catch {
      // Erro grave de auth → sempre redireciona pra login
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Erro de autenticação', code: 'AUTH_ERROR' }, { status: 401 });
      const next = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/login?next=${next}&erro=auth`, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
