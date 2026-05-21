import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as adminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ items: [], logged: false });

    const admin = adminClient();
    const { data } = await admin
      .from('lista_desejos')
      .select('id, produto_id, created_at')
      .eq('cliente_id', user.id);

    return NextResponse.json({ items: data ?? [], logged: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, items: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Faça login para usar a lista de desejos', logged: false }, { status: 401 });

    const { produto_id } = await req.json();
    if (!produto_id) return NextResponse.json({ error: 'produto_id obrigatório' }, { status: 400 });

    const admin = adminClient();
    // Verifica se já existe
    const { data: existente } = await admin
      .from('lista_desejos').select('id')
      .eq('cliente_id', user.id).eq('produto_id', produto_id).maybeSingle();
    if (existente) return NextResponse.json({ ok: true, id: (existente as { id: string }).id, ja_existia: true });

    const { data, error } = await admin
      .from('lista_desejos')
      .insert({ cliente_id: user.id, produto_id })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: (data as { id: string }).id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { produto_id } = await req.json();
    if (!produto_id) return NextResponse.json({ error: 'produto_id obrigatório' }, { status: 400 });

    const admin = adminClient();
    const { error } = await admin
      .from('lista_desejos')
      .delete()
      .eq('cliente_id', user.id)
      .eq('produto_id', produto_id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
