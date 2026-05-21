import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { produto_id, pedido_id, nota, titulo, texto } = await req.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const admin = adminClient();
    await admin.from('avaliacoes').insert({
      produto_id, pedido_id, nota, titulo: titulo || null, texto: texto || null,
      cliente_id: user?.id ?? null, aprovado: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro' }, { status: 500 });
  }
}
