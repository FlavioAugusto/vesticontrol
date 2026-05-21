import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

async function getLojaIdDoAdmin(): Promise<string> {
  try {
    const s = createServer();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return LOJA_DEFAULT;
    const a = createClient();
    const { data } = await a.from('admins').select('loja_id').eq('id', user.id).maybeSingle();
    return data?.loja_id || LOJA_DEFAULT;
  } catch { return LOJA_DEFAULT; }
}

async function ensureComposicaoColumn(supabase: ReturnType<typeof createClient>) {
  await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS composicao TEXT DEFAULT 'Tricoline 100% Algodão'"
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { produto, imagens, variantes } = body;

    const supabase = createClient();
    const lojaId = await getLojaIdDoAdmin();

    const prodData: Record<string, unknown> = {
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
      loja_id: lojaId, // 🛡️ Multi-tenant: produto SEMPRE vinculado à loja do admin
    };

    if (produto.composicao !== undefined) {
      prodData.composicao = produto.composicao || 'Tricoline 100% Algodão';
    }
    if (produto.tecido !== undefined) {
      prodData.tecido = produto.tecido || null;
    }
    if (produto.lavagem !== undefined) {
      prodData.lavagem = produto.lavagem || null;
    }

    const { data: prod, error } = await supabase.from('produtos').insert(prodData).select().single();

    if (error || !prod) {
      return NextResponse.json({ error: error?.message ?? 'Erro ao criar produto' }, { status: 500 });
    }

    const pid = (prod as { id: string }).id;

    if (imagens && imagens.length > 0) {
      const { error: imgErr } = await supabase.from('produto_imagens').insert(
        imagens.map((img: { url: string; alt: string }, i: number) => ({
          produto_id: pid,
          url: img.url,
          alt: img.alt || produto.nome,
          ordem: i,
          principal: i === 0,
          loja_id: lojaId,
        }))
      );
      if (imgErr) {
        return NextResponse.json({ error: `Produto criado mas erro nas imagens: ${imgErr.message}` }, { status: 500 });
      }
    }

    if (variantes && variantes.length > 0) {
      const { error: varErr } = await supabase.from('produto_variantes').insert(
        variantes.map((v: { tamanho: string; cor: string; cor_hex: string; foto_url: string; estoque: number; sku: string }) => ({
          produto_id: pid,
          tamanho: v.tamanho,
          cor: v.cor || null,
          cor_hex: v.cor_hex || null,
          foto_url: v.foto_url || null,
          estoque: v.estoque || 0,
          sku: v.sku,
          loja_id: lojaId,
        }))
      );
      if (varErr) {
        return NextResponse.json({ error: `Produto criado mas erro nas variantes: ${varErr.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ id: pid, success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
