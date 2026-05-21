import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { getLojaId } from '@/lib/tenant';
import WishlistButton from '@/components/shop/WishlistButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Coleção Completa' };
export const dynamic = 'force-dynamic';

const BADGE_LABELS: Record<string, string> = {
  lancamento: 'Lançamento', bestseller: 'Best-Seller', maisvendidos: 'Mais Vendidos',
};
const BADGE_COLORS: Record<string, string> = {
  lancamento: 'bg-gold text-white', bestseller: 'bg-rose text-white', maisvendidos: 'bg-charcoal text-cream',
};

async function getProdutosDB(lojaId: string, categoriaSlug?: string, badge?: string, busca?: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    let query = supabase
      .from('produtos')
      .select('*, categorias(*), produto_imagens(*), produto_variantes(*)')
      .eq('loja_id', lojaId)
      .eq('ativo', true);

    if (badge) query = query.eq('badge', badge);
    if (categoriaSlug) {
      const { data: cat } = await supabase.from('categorias').select('id').eq('slug', categoriaSlug).eq('loja_id', lojaId).single();
      if (cat) {
        const catId = (cat as { id: string }).id;
        query = query.or(`categoria_id.eq.${catId},categorias_extras.cs.["${catId}"]`);
      }
    }

    // 🔍 BUSCA por nome OU código/slug (ex: "vestido", "77824", "atenas")
    if (busca && busca.trim().length > 0) {
      const termo = busca.trim().replace(/[%_]/g, ''); // escape de wildcards SQL
      query = query.or(`nome.ilike.%${termo}%,slug.ilike.%${termo}%`);
    }

    const { data } = await query.order('created_at', { ascending: false });
    return data ?? [];
  } catch { return []; }
}

async function getCategoriasDB(lojaId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data } = await supabase
      .from('categorias').select('nome, slug').eq('loja_id', lojaId).eq('ativo', true).order('ordem');
    return (data ?? []) as { nome: string; slug: string }[];
  } catch { return []; }
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; badge?: string; ordem?: string; q?: string };
}) {
  const lojaId = getLojaId();
  const busca = searchParams.q ?? '';
  const [produtos, categorias] = await Promise.all([
    getProdutosDB(lojaId, searchParams.categoria, searchParams.badge, busca),
    getCategoriasDB(lojaId),
  ]);

  const categoriaAtual = searchParams.categoria ?? '';
  const badgeAtual = searchParams.badge ?? '';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="text-center mb-5 sm:mb-8">
        {/* nome da loja vem do config */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal">
          {busca
            ? `Resultados para "${busca}"`
            : categoriaAtual
            ? categorias.find((c) => c.slug === categoriaAtual)?.nome ?? 'Coleção'
            : badgeAtual
            ? BADGE_LABELS[badgeAtual] ?? 'Coleção'
            : 'Coleção Completa'}
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1 sm:mt-2">
          {produtos.length} {produtos.length === 1 ? 'peça encontrada' : 'peças encontradas'}
          {busca && produtos.length === 0 && ' — tente buscar por outro termo'}
        </p>
      </div>

      {/* Filtros por categoria — scroll horizontal no mobile */}
      <div className="flex overflow-x-auto snap-x gap-1.5 sm:gap-2 mb-5 sm:mb-8 pb-1 sm:pb-0 sm:flex-wrap sm:justify-center scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        <Link href="/produtos"
          className={`flex-none snap-start px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold tracking-widest uppercase border transition-colors whitespace-nowrap ${!categoriaAtual && !badgeAtual ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-charcoal hover:border-charcoal'}`}>
          Todos
        </Link>
        {categorias.map((cat) => (
          <Link key={cat.slug} href={`/produtos?categoria=${cat.slug}`}
            className={`flex-none snap-start px-3 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold tracking-widest uppercase border transition-colors whitespace-nowrap ${categoriaAtual === cat.slug ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-charcoal hover:border-charcoal'}`}>
            {cat.nome}
          </Link>
        ))}
      </div>

      {/* Grid de produtos */}
      {produtos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-5">
          {produtos.map((p) => {
            const img = 'imagens' in p
              ? (p as { imagens: { url: string }[] }).imagens[0]?.url
              : (p as { produto_imagens?: { url: string }[] }).produto_imagens?.[0]?.url;
            const desconto = p.preco_antigo ? Math.round((1 - p.preco / p.preco_antigo) * 100) : 0;
            const cat = 'categoria' in p ? (p as { categoria: string }).categoria : (p as { categorias?: { nome: string } }).categorias?.nome;
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
                  {desconto > 0 && (
                    <span className="absolute top-2 left-2 bg-rose text-white text-[10px] font-bold px-2 py-0.5">
                      {desconto}% OFF
                    </span>
                  )}
                  {p.badge && !desconto && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 ${BADGE_COLORS[p.badge] ?? 'bg-gray-200'}`}>
                      {BADGE_LABELS[p.badge] ?? p.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-charcoal/90 py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-cream text-xs font-bold tracking-[2px] uppercase">Ver Produto</span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-4">
                  {cat && <p className="text-[9px] sm:text-[10px] text-charcoal-muted uppercase tracking-widest mb-0.5 sm:mb-1">{cat}</p>}
                  <h3 className="font-sans font-semibold text-xs sm:text-sm text-charcoal leading-tight mb-1 sm:mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                    {p.nome}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-bold text-charcoal text-sm sm:text-base">{formatPrice(p.preco)}</span>
                    {p.preco_antigo && <span className="text-charcoal-muted text-[10px] sm:text-xs line-through">{formatPrice(p.preco_antigo)}</span>}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-charcoal-muted mt-0.5 sm:mt-1">6x {formatPrice(p.preco / 6)} s/ juros</p>
                </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="font-serif text-2xl text-charcoal mb-3">Nenhuma peça encontrada</p>
          <Link href="/produtos" className="btn-gold inline-flex mt-2">Ver Coleção Completa</Link>
        </div>
      )}
    </div>
  );
}
