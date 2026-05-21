import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: produto, error } = await supabase
      .from('produtos')
      .select('*, categorias(id, nome, slug), produto_imagens(id, url, alt, ordem, principal), produto_variantes(id, tamanho, cor, cor_hex, foto_url, estoque, sku)')
      .eq('id', params.id)
      .single();

    if (error || !produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json(produto);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { produto, imagens, variantes } = body;
    const supabase = createClient();

    const updateData: Record<string, unknown> = {
      nome: produto.nome,
      slug: produto.slug,
      descricao: produto.descricao || null,
      preco: produto.preco,
      preco_antigo: produto.preco_antigo || null,
      categoria_id: produto.categoria_id || null,
      categorias_extras: Array.isArray(produto.categorias_extras) ? produto.categorias_extras : [],
      badge: produto.badge || null,
      ativo: produto.ativo ?? true,
      destaque: produto.destaque ?? false,
      peso_gramas: produto.peso_gramas || 500,
      updated_at: new Date().toISOString(),
    };
    if (produto.composicao !== undefined) {
      updateData.composicao = produto.composicao || 'Tricoline 100% Algodão';
    }
    if (produto.tecido !== undefined) {
      updateData.tecido = produto.tecido || null;
    }
    if (produto.lavagem !== undefined) {
      updateData.lavagem = produto.lavagem || null;
    }
    const { error } = await supabase.from('produtos').update(updateData).eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (imagens !== undefined) {
      await supabase.from('produto_imagens').delete().eq('produto_id', params.id);
      if (imagens.length > 0) {
        await supabase.from('produto_imagens').insert(
          imagens.map((img: { url: string; alt: string }, i: number) => ({
            produto_id: params.id, url: img.url, alt: img.alt || produto.nome, ordem: i, principal: i === 0,
          }))
        );
      }
    }

    if (variantes !== undefined) {
      await supabase.from('produto_variantes').delete().eq('produto_id', params.id);
      if (variantes.length > 0) {
        await supabase.from('produto_variantes').insert(
          variantes.map((v: { tamanho: string; cor: string; cor_hex: string; foto_url: string; estoque: number; sku: string }) => ({
            produto_id: params.id, tamanho: v.tamanho, cor: v.cor || null,
            cor_hex: v.cor_hex || null, foto_url: v.foto_url || null, estoque: v.estoque || 0, sku: v.sku,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    await supabase.from('produto_imagens').delete().eq('produto_id', params.id);
    await supabase.from('produto_variantes').delete().eq('produto_id', params.id);
    const { error } = await supabase.from('produtos').delete().eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = createClient();
    const { error } = await supabase.from('produtos').update(body).eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro' }, { status: 500 });
  }
}
