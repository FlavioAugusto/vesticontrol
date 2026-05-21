import { NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Retorna info da loja do admin logado + TODAS as configurações.
 * Endpoint robusto: tudo em uma única chamada.
 *
 * Resposta:
 * {
 *   loja_id, loja, nivel, eh_super_admin,
 *   configs: { loja_nome, loja_cnpj, ... }   ← TODAS as configs incluindo tokens
 * }
 */
export async function GET() {
  try {
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const admin = createAdmin();

    // Detecta loja_id do admin (ou super_admin → LOJA_DEFAULT)
    const { data: adminRow } = await admin.from('admins')
      .select('loja_id, nivel, nome')
      .eq('id', user.id)
      .maybeSingle();

    let lojaId: string;
    let nivel: string;
    let eh_super_admin = false;

    if (adminRow?.loja_id) {
      lojaId = adminRow.loja_id;
      nivel = adminRow.nivel || 'admin';
    } else {
      const { data: sup } = await admin.from('super_admins')
        .select('id').eq('id', user.id).maybeSingle();
      if (sup) {
        lojaId = LOJA_DEFAULT;
        nivel = 'super';
        eh_super_admin = true;
      } else {
        return NextResponse.json({ error: 'Usuário sem permissão' }, { status: 403 });
      }
    }

    // Pega info da loja
    const { data: loja } = await admin.from('lojas')
      .select('id, nome, slug, dominio')
      .eq('id', lojaId)
      .maybeSingle();

    // Pega TODAS as configurações da loja
    const { data: configsData } = await admin
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId);

    const configs: Record<string, string> = {};
    (configsData ?? []).forEach((c: { chave: string; valor: string | null }) => {
      configs[c.chave] = c.valor ?? '';
    });

    return NextResponse.json({
      loja_id: lojaId,
      loja: loja,
      nivel: nivel,
      eh_super_admin,
      configs, // 🆕 todas as configs incluídas
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Erro',
    }, { status: 500 });
  }
}
