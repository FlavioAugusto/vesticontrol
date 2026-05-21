import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, senha, nome, codigoSetup } = await req.json();

    if (codigoSetup !== 'BYMARCELOSETUP2025') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 403 });
    }
    if (!email || !senha || !nome) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = createClient();

    // Verificar se já existe admin cadastrado
    const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Admin já configurado. Use o login.' }, { status: 400 });
    }

    // Criar usuário com service role — sem precisar confirmar e-mail
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // confirma e-mail automaticamente
      user_metadata: { nome },
    });

    if (createErr || !userData.user) {
      // Se já existe, tentar fazer o update da senha
      if (createErr?.message?.includes('already registered')) {
        const { data: allUsers } = await supabase.auth.admin.listUsers();
        const existing = allUsers?.users?.find(u => u.email === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: senha,
            email_confirm: true,
          });
          // Criar admin se não existe
          await supabase.from('admins').upsert({ id: existing.id, nome, nivel: 'super' });
          await supabase.from('clientes').upsert({ id: existing.id, nome, newsletter: false });
          return NextResponse.json({ ok: true, novo: false });
        }
      }
      return NextResponse.json({ error: createErr?.message ?? 'Erro ao criar usuário' }, { status: 500 });
    }

    const userId = userData.user.id;

    // Criar admin e cliente
    await supabase.from('admins').upsert({ id: userId, nome, nivel: 'super' });
    await supabase.from('clientes').upsert({ id: userId, nome, newsletter: false });

    return NextResponse.json({ ok: true, novo: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro' }, { status: 500 });
  }
}
