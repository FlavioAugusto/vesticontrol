import type { Metadata } from 'next';
import Link from 'next/link';
import ProdutoDetalhes from '@/components/shop/ProdutoDetalhes';
import ProdutosRelacionados from '@/components/shop/ProdutosRelacionados';
import { getLojaId } from '@/lib/tenant';
import type { ProdutoComDetalhes } from '@/types/database';

export const dynamic = 'force-dynamic';

async function getProdutoDB(slug: string, lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data } = await supabase
      .from('produtos')
      .select('*, categorias(*), produto_imagens(*), produto_variantes(*)')
      .eq('loja_id', lojaId).eq('slug', slug).eq('ativo', true).maybeSingle();
    return data as ProdutoComDetalhes | null;
  } catch { return null; }
}

async function getRelacionadosDB(categoriaId: string | null, slugAtual: string, lojaId: string) {
  try {
    if (!categoriaId) return null;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, slug, preco, preco_antigo, badge, categorias(*), produto_imagens(*), produto_variantes(*)')
      .eq('loja_id', lojaId).eq('ativo', true).eq('categoria_id', categoriaId).neq('slug', slugAtual).limit(4);
    return data && data.length > 0 ? data : null;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lojaId = getLojaId();
  const db = await getProdutoDB(params.slug, lojaId);
  return { title: db?.nome ?? 'Produto', description: db?.nome ?? 'Produto' };
}

export default async function ProdutoPage({ params }: { params: { slug: string } }) {
  const lojaId = getLojaId();
  const produto = await getProdutoDB(params.slug, lojaId);

  if (!produto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="font-serif text-2xl text-charcoal mb-3">Produto não encontrado</p>
        <Link href="/produtos" className="btn-gold inline-flex">Ver Coleção</Link>
      </div>
    );
  }

  const dbRel = await getRelacionadosDB(produto.categoria_id, params.slug, lojaId);
  const relacionados = (dbRel ?? []) as ProdutoComDetalhes[];

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <ProdutoDetalhes produto={produto} />
      </div>
      {relacionados.length > 0 && <ProdutosRelacionados produtos={relacionados} />}
    </div>
  );
}
