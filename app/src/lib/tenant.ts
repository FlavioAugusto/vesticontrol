/**
 * Helpers para sistema multi-tenant.
 *
 * Cada loja (cliente do SaaS) é identificada por:
 * - subdomínio: cliente.sua-marca.com
 * - domínio próprio: bymarcelomedeiros.com
 *
 * Este módulo centraliza a detecção e o cache de lojas.
 */

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/admin';

// ID da loja padrão (By Marcelo Medeiros) — primeira do sistema
export const LOJA_DEFAULT_ID = '00000000-0000-0000-0000-000000000001';

export interface Loja {
  id: string;
  nome: string;
  slug: string;
  dominio: string | null;
  email_admin: string;
  plano: string;
  ativo: boolean;
  trial_ate: string | null;
  expira_em: string | null;
  limite_produtos: number;
  limite_pedidos: number;
}

// Cache simples in-memory por hostname (resetado a cada deploy)
const cache = new Map<string, { loja: Loja | null; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Busca a loja a partir do hostname (com cache).
 *
 * Prioridade de match:
 * 1. dominio === hostname (custom domain)
 * 2. slug === primeira parte do hostname (subdomínio)
 * 3. Loja default (fallback)
 */
export async function buscarLojaPorHostname(hostname: string): Promise<Loja | null> {
  const host = (hostname || '').toLowerCase().split(':')[0]; // remove porta se houver

  // Cache hit
  const cached = cache.get(host);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.loja;
  }

  try {
    const supabase = createClient();

    // 1. Tenta domínio próprio
    const { data: porDominio } = await supabase
      .from('lojas')
      .select('*')
      .eq('dominio', host)
      .eq('ativo', true)
      .maybeSingle();

    if (porDominio) {
      const loja = porDominio as Loja;
      cache.set(host, { loja, expiresAt: Date.now() + CACHE_TTL });
      return loja;
    }

    // 2. Tenta subdomínio (primeira parte antes do primeiro ponto)
    const partes = host.split('.');
    if (partes.length >= 3) { // ex: cliente.sua-marca.com
      const slug = partes[0];
      const { data: porSlug } = await supabase
        .from('lojas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();

      if (porSlug) {
        const loja = porSlug as Loja;
        cache.set(host, { loja, expiresAt: Date.now() + CACHE_TTL });
        return loja;
      }
    }

    // 3. Fallback: loja padrão (By Marcelo)
    const { data: padrao } = await supabase
      .from('lojas')
      .select('*')
      .eq('id', LOJA_DEFAULT_ID)
      .maybeSingle();

    const loja = (padrao ?? null) as Loja | null;
    cache.set(host, { loja, expiresAt: Date.now() + CACHE_TTL });
    return loja;
  } catch (e) {
    console.error('[tenant] Erro ao buscar loja:', e);
    return null;
  }
}

/**
 * Retorna o ID da loja atual baseado no header `x-loja-id` (setado pelo middleware).
 * Se não houver header, retorna a loja default.
 *
 * Use em Server Components, API Routes e Server Actions.
 */
export function getLojaId(): string {
  try {
    const h = headers();
    const id = h.get('x-loja-id');
    return id || LOJA_DEFAULT_ID;
  } catch {
    return LOJA_DEFAULT_ID;
  }
}

/**
 * Retorna o slug da loja atual.
 */
export function getLojaSlug(): string | null {
  try {
    const h = headers();
    return h.get('x-loja-slug') || null;
  } catch {
    return null;
  }
}

/**
 * Limpa o cache de uma loja específica (útil após edição).
 */
export function invalidarCacheLoja(hostname: string) {
  cache.delete(hostname.toLowerCase().split(':')[0]);
}

/**
 * Limpa todo o cache (útil em desenvolvimento).
 */
export function limparTodoCache() {
  cache.clear();
}
