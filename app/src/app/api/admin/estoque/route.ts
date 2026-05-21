import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function PATCH(req: NextRequest) {
  try {
    const { variante_id, estoque } = await req.json();

    if (!variante_id) {
      return NextResponse.json({ error: 'variante_id obrigatório' }, { status: 400 });
    }
    if (typeof estoque !== 'number' || estoque < 0) {
      return NextResponse.json({ error: 'Estoque inválido' }, { status: 400 });
    }

    const supabase = createClient(); // service role — bypassa RLS
    const { data, error } = await supabase
      .from('produto_variantes')
      .update({ estoque })
      .eq('id', variante_id)
      .select('id, estoque')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, estoque: (data as { estoque: number }).estoque });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao atualizar estoque' }, { status: 500 });
  }
}
