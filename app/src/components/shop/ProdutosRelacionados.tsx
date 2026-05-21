'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';
import type { ProdutoComDetalhes } from '@/types/database';

interface Props {
  produtos: ProdutoComDetalhes[];
}

const BADGE_LABELS: Record<string, string> = { new: 'Novo', sale: 'Oferta', exclusive: 'Exclusivo' };

export default function ProdutosRelacionados({ produtos }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  function addToCart(p: ProdutoComDetalhes) {
    const variante = p.produto_variantes?.[0];
    if (!variante) { toast.error('Selecione um tamanho na página do produto'); return; }
    addItem({
      id: crypto.randomUUID(),
      produto_id: p.id,
      variante_id: variante.id,
      nome: p.nome,
      preco: p.preco,
      tamanho: variante.tamanho,
      quantidade: 1,
      imagem: p.produto_imagens?.find((i) => i.principal)?.url ?? p.produto_imagens?.[0]?.url,
    });
    setOpen(true);
    toast.success('Adicionado ao carrinho!');
  }

  return (
    <section className="bg-gray-50 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-2xl md:text-3xl text-charcoal text-center mb-8">Veja também</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {produtos.map((p) => {
            const img = p.produto_imagens?.find((i) => i.principal)?.url ?? p.produto_imagens?.[0]?.url;
            const desconto = p.preco_antigo ? Math.round((1 - p.preco / p.preco_antigo) * 100) : 0;
            return (
              <div key={p.id} className="bg-white group">
                {/* Imagem */}
                <Link href={`/produtos/${p.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
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
                    <span className="absolute top-2 left-2 bg-gold text-white text-[10px] font-bold px-2 py-0.5">
                      {BADGE_LABELS[p.badge] ?? p.badge}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/produtos/${p.slug}`}>
                    <h3 className="text-xs font-sans font-semibold text-charcoal uppercase tracking-wide leading-snug mb-2 hover:text-gold transition-colors line-clamp-2">
                      {p.nome}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-1">
                    {p.preco_antigo && (
                      <span className="text-xs text-charcoal-muted line-through">{formatPrice(p.preco_antigo)}</span>
                    )}
                    <span className="text-base font-bold text-charcoal">{formatPrice(p.preco)}</span>
                  </div>
                  <p className="text-[10px] text-charcoal-muted mb-3">
                    6X {formatPrice(p.preco / 6)} SEM JUROS
                  </p>
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-center gap-2 bg-charcoal text-white py-2.5 text-[10px] font-bold tracking-[2px] uppercase hover:bg-charcoal-light transition-colors"
                  >
                    <ShoppingBag size={12} />
                    EU QUERO!
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
