import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Cria/atualiza perfil de cliente com loja_id detectado via middleware.
 * Chamado após signUp do Supabase Auth.
 *
 * Aceita user_id no body (porque pode rodar antes da confirmação de email,
 * quando ainda não há sessão ativa). Valida que o auth.users existe.
 *
 * Body: { user_id, nome, sobrenome?, cpf?, telefone?, whatsapp?, newsletter? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, nome, sobrenome, cpf, telefone, whatsapp, newsletter } = body;

    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });
    if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

    const admin = createAdmin();

    // Verifica que o user_id realmente existe em auth.users (impede spam)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authUser, error: authErr } = await (admin.auth as any).admin.getUserById(user_id);
    if (authErr || !authUser?.user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Detecta loja_id do domínio via middleware (header x-loja-id)
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    // Upsert do cliente com loja_id correto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from('clientes') as any).upsert({
      id: user_id,
      loja_id: lojaId,
      nome,
      sobrenome: sobrenome ?? null,
      cpf: cpf ?? null,
      telefone: telefone ?? null,
      whatsapp: whatsapp ?? telefone ?? null,
      newsletter: newsletter ?? true,
    }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, loja_id: lojaId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro' },
      { status: 500 }
    );
  }
}
