import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Debug endpoint — diagnóstico completo do multi-tenant.
 */
export async function GET(req: NextRequest) {
  const h = headers();
  const host = h.get('host');
  const xLojaId = h.get('x-loja-id');
  const xLojaSlug = h.get('x-loja-slug');
  const xMiddlewareRan = h.get('x-middleware-ran');
  const xDetectedHost = h.get('x-detected-host');

  // Lista TODOS os headers x-* recebidos
  const todosHeadersX: Record<string, string> = {};
  h.forEach((value, key) => {
    if (key.startsWith('x-')) todosHeadersX[key] = value;
  });

  // Tenta detectar a loja AQUI mesmo (sem confiar no middleware)
  let lojaPorHost: unknown = null;
  let lojaPorSlug: unknown = null;
  let erro: string | null = null;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      erro = 'Variáveis SUPABASE não configuradas';
    } else {
      // Busca por dominio
      const r1 = await fetch(`${url}/rest/v1/lojas?dominio=eq.${encodeURIComponent(host || '')}&select=id,nome,slug,dominio,ativo&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      });
      if (r1.ok) lojaPorHost = (await r1.json())[0] ?? null;

      // Busca por slug (primeira parte do hostname)
      const partes = (host || '').toLowerCase().split('.');
      if (partes.length >= 2) {
        const r2 = await fetch(`${url}/rest/v1/lojas?slug=eq.${partes[0]}&select=id,nome,slug,dominio,ativo&limit=1`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
        });
        if (r2.ok) lojaPorSlug = (await r2.json())[0] ?? null;
      }
    }
  } catch (e) {
    erro = e instanceof Error ? e.message : 'Erro desconhecido';
  }

  return NextResponse.json({
    request: {
      host,
      url: req.url,
      partes_hostname: (host || '').split('.'),
    },
    middleware_headers: {
      'x-loja-id': xLojaId,
      'x-loja-slug': xLojaSlug,
      'x-middleware-ran': xMiddlewareRan,
      'x-detected-host': xDetectedHost,
      middleware_rodou: xMiddlewareRan === 'true',
    },
    todos_headers_x: todosHeadersX,
    deteccao_direta: {
      por_dominio: lojaPorHost,
      por_slug: lojaPorSlug,
      erro,
    },
    env: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    diagnostico: xLojaId === null
      ? '⚠️ Middleware não está injetando x-loja-id no request. Verifique se o deploy mais recente foi aplicado.'
      : '✅ Middleware OK',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}
