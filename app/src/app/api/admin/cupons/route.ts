import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

// GET — listar todos os cupons
export async function GET() {
  try {
    const s = createClient();
    const { data, error } = await s.from('cupons').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cupons: data ?? [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}

// POST — criar novo cupom
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, tipo, valor, uso_maximo, valor_minimo, ativo, valido_ate } = body;

    if (!codigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 });

    const s = createClient();

    // Verificar se já existe
    const { data: existente } = await s.from('cupons').select('id').eq('codigo', codigo.toUpperCase()).single();
    if (existente) return NextResponse.json({ error: `Cupom "${codigo}" já existe` }, { status: 400 });

    const { data, error } = await s.from('cupons').insert({
      codigo: codigo.toUpperCase(),
      tipo,
      valor: valor || null,
      uso_maximo: uso_maximo || null,
      valor_minimo: valor_minimo || null,
      uso_atual: 0,
      ativo: ativo ?? true,
      valido_ate: valido_ate || null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cupom: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}

// PATCH — atualizar cupom (toggle ativo)
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const s = createClient();
    const { error } = await s.from('cupons').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}

// DELETE — excluir cupom
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const s = createClient();
    const { error } = await s.from('cupons').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}
