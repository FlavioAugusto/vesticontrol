import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, nome, codigoSetup } = await req.json();

    if (codigoSetup !== 'BYMARCELOSETUP2025') {
      return NextResponse.json({ error: 'Código inválido' }, { status: 403 });
    }

    if (!userId || !nome) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const supabase = createClient();

    // Verificar se já existe admin
    const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Admin já configurado. Use o painel.' }, { status: 400 });
    }

    // Criar registro de admin
    await supabase.from('admins').upsert({ id: userId, nome, nivel: 'super' });

    // Criar registro de cliente se não existir
    await supabase.from('clientes').upsert({ id: userId, nome, newsletter: false });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
