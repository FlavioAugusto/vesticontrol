import { NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Retorna TODAS as configurações (incluindo tokens) da loja do admin.
 * Sistema single-tenant: usa loja_id do admin se existir, senão LOJA_DEFAULT.
 *
 * Mesma lógica do salvar-configs — garante que LÊ do mesmo lugar que SALVA.
 */
export async function GET() {
  try {
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const admin = createAdmin();

    // Verifica permissão (admin ou super_admin)
    const { data: adminRow } = await admin.from('admins')
      .select('loja_id').eq('id', user.id).maybeSingle();
    const { data: superRow } = await admin.from('super_admins')
      .select('id').eq('id', user.id).maybeSingle();

    if (!adminRow && !superRow) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // MESMA lógica do salvar-configs: admin.loja_id || LOJA_DEFAULT
    const lojaId = adminRow?.loja_id || LOJA_DEFAULT;

    const { data: configs } = await admin
      .from('configuracoes')
      .select('chave, valor')
      .eq('loja_id', lojaId);

    const result: Record<string, string> = {};
    (configs ?? []).forEach((c: { chave: string; valor: string | null }) => {
      result[c.chave] = c.valor ?? '';
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Erro',
    }, { status: 500 });
  }
}
