import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { getLojaId } from '@/lib/tenant';
import WishlistButton from '@/components/shop/WishlistButton';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

async function getDadosDB(slug: string, lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: cat } = await supabase.from('categorias').select('*').eq('slug', slug).eq('loja_id', lojaId).maybeSingle();
    if (!cat) return null;
    const catId = (cat as { id: string }).id;
    const { data: produtos } = await supabase
      .from('produtos').select('*, categorias(*), produto_imagens(*), produto_variantes(*)')
      .eq('loja_id', lojaId)
      .eq('ativo', true)
      .or(`categoria_id.eq.${catId},categorias_extras.cs.["${catId}"]`)
      .order('created_at', { ascending: false });
    return { cat, produtos: produtos ?? [] };
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const lojaId = getLojaId();
  const db = await getDadosDB(params.categoria, lojaId);
  const nome = db?.cat ? (db.cat as { nome: string }).nome : params.categoria;
  return { title: nome };
}

export default async function CategoriaPage({ params }: { params: { categoria: string } }) {
  const lojaId = getLojaId();
  const db = await getDadosDB(params.categoria, lojaId);

  if (!db) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="font-serif text-2xl text-charcoal mb-3">Categoria não encontrada</p>
        <Link href="/produtos" className="btn-gold inline-flex">Ver Coleção</Link>
      </div>
    );
  }

  const cat = db.cat as { nome: string; descricao: string | null; imagem_url: string | null };
  const produtos = db.produtos;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Banner da categoria */}
      {cat.imagem_url ? (
        <div className="relative h-48 md:h-64 overflow-hidden rounded-sm mb-8">
          <Image src={cat.imagem_url} alt={cat.nome} fill className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-charcoal/50 flex items-end p-6">
            <div>
              <p className="text-[10px] text-gold tracking-[4px] uppercase font-semibold mb-1">Coleção</p>
              <h1 className="font-serif text-3xl text-cream">{cat.nome}</h1>
              {cat.descricao && <p className="text-cream/70 text-sm mt-1">{cat.descricao}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mb-8">
          <p className="text-[10px] text-gold tracking-[4px] uppercase font-semibold mb-1">Coleção</p>
          <h1 className="font-serif text-3xl text-charcoal">{cat.nome}</h1>
          {cat.descricao && <p className="text-charcoal-muted text-sm mt-2">{cat.descricao}</p>}
        </div>
      )}

      <div className="flex items-center justify-end mb-6">
        <p className="text-sm text-charcoal-muted">{produtos.length} produtos</p>
      </div>

      {produtos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-5">
          {produtos.map((p: { id: string; nome: string; slug: string; preco: number; preco_antigo: number | null; produto_imagens?: { url: string; principal: boolean }[] }) => {
            const img = p.produto_imagens?.find(i => i.principal)?.url ?? p.produto_imagens?.[0]?.url;
            return (
              <div key={p.id} className="group bg-white block relative">
                <WishlistButton produtoId={p.id} className="absolute top-2 right-2 z-10 w-9 h-9" size={16} />
                <Link href={`/produtos/${p.slug}`} className="block">
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {img ? (
                    <Image src={img} alt={p.nome} fill sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-cream-dark flex items-center justify-center">
                      <span className="font-display text-charcoal/20 text-center px-4">Sem foto</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-charcoal/90 py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-cream text-xs font-bold tracking-[2px] uppercase">Ver Produto</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-sans font-semibold text-sm text-charcoal leading-tight mb-2 line-clamp-2 group-hover:text-gold transition-colors">{p.nome}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-charcoal">{formatPrice(p.preco)}</span>
                    {p.preco_antigo && <span className="text-charcoal-muted text-xs line-through">{formatPrice(p.preco_antigo)}</span>}
                  </div>
                  <p className="text-[10px] text-charcoal-muted mt-1">6x {formatPrice(p.preco / 6)} sem juros</p>
                </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="font-serif text-2xl text-charcoal mb-3">Em breve</p>
          <p className="text-charcoal-muted text-sm">Produtos desta categoria em breve.</p>
        </div>
      )}
    </div>
  );
}
