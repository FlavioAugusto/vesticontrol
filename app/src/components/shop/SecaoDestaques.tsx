import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import WishlistButton from '@/components/shop/WishlistButton';
import { ArrowRight } from 'lucide-react';

const BADGE_LABELS: Record<string, string> = { lancamento: 'Lançamento', bestseller: 'Best-Seller', maisvendidos: 'Mais Vendidos' };
const BADGE_COLORS: Record<string, string> = { lancamento: 'bg-gold text-white', bestseller: 'bg-rose text-white', maisvendidos: 'bg-charcoal text-cream' };

interface Props {
  titulo: string; subtitulo: string; btnTexto: string; btnLink: string;
  produtos: { id: string; nome: string; slug: string; preco: number; preco_antigo?: number | null; badge?: string | null; categorias?: { nome: string } | null; produto_imagens?: { url: string; principal: boolean }[] }[];
}

export default function SecaoDestaques({ titulo, subtitulo, btnTexto, btnLink, produtos }: Props) {
  const lista = produtos;

  // Não renderiza a seção se não houver produtos reais
  if (lista.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 md:py-16 px-4 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6 sm:mb-8 md:mb-10">
          <div>
            <p className="text-[10px] sm:text-xs text-charcoal-muted font-sans font-semibold tracking-[3px] sm:tracking-[4px] uppercase mb-1 sm:mb-2">{subtitulo}</p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal">{titulo}</h2>
          </div>
          <Link href={btnLink} className="flex items-center gap-1.5 text-[10px] sm:text-xs font-sans font-semibold tracking-widest uppercase text-charcoal-muted hover:text-gold transition-colors">
            {btnTexto} <ArrowRight size={10} className="sm:hidden" /><ArrowRight size={12} className="hidden sm:block" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {lista.slice(0, 8).map((p) => {
            const img = p.produto_imagens?.find(i => i.principal)?.url ?? p.produto_imagens?.[0]?.url;
            return (
              <div key={p.id} className="group bg-white block relative">
                <WishlistButton produtoId={p.id} className="absolute top-2 right-2 z-10 w-8 h-8 sm:w-9 sm:h-9" size={14} />
                <Link href={`/produtos/${p.slug}`} className="block">
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  {img ? (
                    <Image src={img} alt={p.nome} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-cream-dark flex items-center justify-center">
                      <span className="font-display text-charcoal/20 text-center px-4 text-sm">Sem foto</span>
                    </div>
                  )}
                  {p.badge && (
                    <span className={`absolute top-2 left-2 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 ${BADGE_COLORS[p.badge] ?? 'bg-gray-200'}`}>
                      {BADGE_LABELS[p.badge] ?? p.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-charcoal/90 py-2 sm:py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <span className="text-cream text-[10px] sm:text-xs font-bold tracking-[2px] uppercase">Ver Produto</span>
                  </div>
                </div>
                <div className="p-2.5 sm:p-4">
                  {p.categorias?.nome && <p className="text-[9px] sm:text-[10px] text-charcoal-muted uppercase tracking-widest mb-0.5 sm:mb-1">{p.categorias.nome}</p>}
                  <h3 className="font-sans font-semibold text-xs sm:text-sm text-charcoal leading-tight mb-1 sm:mb-2 line-clamp-2 group-hover:text-gold transition-colors">{p.nome}</h3>
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
        <div className="text-center mt-8 sm:mt-10">
          <Link href={btnLink} className="btn-outline text-xs sm:text-sm px-6 py-3">{btnTexto}</Link>
        </div>
      </div>
    </section>
  );
}
