'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import WishlistButton from '@/components/shop/WishlistButton';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import type { ProdutoComDetalhes } from '@/types/database';

interface ProductCardProps {
  produto: ProdutoComDetalhes;
}

export default function ProductCard({ produto }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const imagem = produto.produto_imagens?.find((i) => i.principal) ?? produto.produto_imagens?.[0];
  const imagemHover = produto.produto_imagens?.[1];
  const variante = produto.produto_variantes?.[0];
  const emEstoque = produto.produto_variantes?.some((v) => v.estoque > 0);

  function addToCart() {
    if (!variante) { toast.error('Selecione um tamanho'); return; }
    addItem({
      id: crypto.randomUUID(),
      produto_id: produto.id,
      variante_id: variante.id,
      nome: produto.nome,
      preco: produto.preco,
      tamanho: variante.tamanho,
      cor: variante.cor ?? undefined,
      cor_hex: variante.cor_hex ?? undefined,
      quantidade: 1,
      imagem: imagem?.url,
    });
    setOpen(true);
    toast.success(`${produto.nome} adicionado ao carrinho`);
  }

  return (
    <div
      className="group relative bg-white card-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge */}
      {produto.badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant={produto.badge as 'lancamento' | 'bestseller' | 'maisvendidos'}>
            {produto.badge === 'lancamento' ? 'Lançamento' : produto.badge === 'bestseller' ? 'Best-Seller' : 'Mais Vendidos'}
          </Badge>
        </div>
      )}

      {/* Wishlist */}
      <WishlistButton produtoId={produto.id} className="absolute top-3 right-3 z-10 w-8 h-8" size={14} />

      {/* Imagem */}
      <Link href={`/produtos/${produto.slug}`} className="block overflow-hidden aspect-[3/4] bg-cream-dark relative">
        {imagem ? (
          <>
            <Image
              src={imagem.url}
              alt={imagem.alt ?? produto.nome}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-500 ${hovered && imagemHover ? 'opacity-0' : 'opacity-100'}`}
            />
            {imagemHover && (
              <Image
                src={imagemHover.url}
                alt={produto.nome}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={`object-cover transition-opacity duration-500 absolute inset-0 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-charcoal/20 text-lg text-center px-4">Sem foto</span>
          </div>
        )}

        {/* Add to cart hover */}
        {emEstoque && (
          <div className={`absolute bottom-0 left-0 right-0 bg-charcoal text-cream text-xs font-sans font-semibold tracking-widest uppercase py-3 text-center transition-transform duration-300 ${hovered ? 'translate-y-0' : 'translate-y-full'}`}>
            <button onClick={addToCart} className="flex items-center justify-center gap-2 w-full">
              <ShoppingBag size={14} /> Adicionar
            </button>
          </div>
        )}

        {!emEstoque && (
          <div className="absolute bottom-0 left-0 right-0 bg-charcoal/80 text-cream/60 text-xs font-sans text-center py-2">
            Esgotado
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3">
        {produto.categorias && (
          <p className="text-[10px] text-charcoal-muted uppercase tracking-widest mb-0.5">{produto.categorias.nome}</p>
        )}
        <Link href={`/produtos/${produto.slug}`}>
          <h3 className="font-sans font-semibold text-sm text-charcoal truncate hover:text-gold transition-colors">{produto.nome}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gold font-semibold text-sm">{formatPrice(produto.preco)}</span>
          {produto.preco_antigo && (
            <span className="text-charcoal-muted text-xs line-through">{formatPrice(produto.preco_antigo)}</span>
          )}
        </div>
        {produto.produto_variantes && produto.produto_variantes.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {produto.produto_variantes.slice(0, 4).map((v) => (
              <span key={v.id} className="text-[10px] border border-cream-darker px-1.5 py-0.5 text-charcoal-muted">
                {v.tamanho}
              </span>
            ))}
            {produto.produto_variantes.length > 4 && (
              <span className="text-[10px] text-charcoal-muted">+{produto.produto_variantes.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
