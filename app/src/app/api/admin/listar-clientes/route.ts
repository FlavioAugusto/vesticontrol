import { NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Lista clientes da loja com seus pedidos.
 * Usa service role (bypassa RLS) para garantir que o admin VÊ TODOS os clientes.
 */
export async function GET() {
  try {
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const admin = createAdmin();

    // Verifica permissão
    const { data: adminRow } = await admin.from('admins')
      .select('loja_id').eq('id', user.id).maybeSingle();
    const { data: superRow } = await admin.from('super_admins')
      .select('id').eq('id', user.id).maybeSingle();

    if (!adminRow && !superRow) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const lojaId = adminRow?.loja_id || LOJA_DEFAULT;

    // Busca clientes com pedidos via service role (bypassa RLS)
    const { data, error } = await admin
      .from('clientes')
      .select('id, nome, sobrenome, cpf, telefone, whatsapp, newsletter, vip, created_at, pedidos(id, numero, total, status, created_at, pedido_itens(nome_produto, quantidade))')
      .eq('loja_id', lojaId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro' },
      { status: 500 }
    );
  }
}
