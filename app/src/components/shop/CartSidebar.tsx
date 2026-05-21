'use client';

import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

export default function CartSidebar() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, total } = useCartStore();

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <aside className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white flex flex-col shadow-xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-darker">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-gold" />
            <span className="font-serif text-lg text-charcoal">Carrinho</span>
            {items.length > 0 && (
              <span className="text-xs bg-gold text-white rounded-full w-5 h-5 flex items-center justify-center">{items.length}</span>
            )}
          </div>
          <button onClick={() => setOpen(false)} className="text-charcoal-muted hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={48} className="text-cream-darker" />
              <div>
                <p className="font-sans font-semibold text-charcoal mb-1">Carrinho vazio</p>
                <p className="text-sm text-charcoal-muted">Adicione produtos para continuar</p>
              </div>
              <Button onClick={() => setOpen(false)} variant="outline" size="sm">
                Ver Coleção
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variante_id} className="flex gap-3 pb-4 border-b border-cream-darker last:border-0">
                {item.imagem ? (
                  <div className="relative w-16 h-20 shrink-0 bg-cream-dark overflow-hidden">
                    <Image src={item.imagem} alt={item.nome} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="w-16 h-20 shrink-0 bg-cream-dark flex items-center justify-center">
                    <ShoppingBag size={16} className="text-charcoal-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-sm text-charcoal truncate">{item.nome}</p>
                  <p className="text-xs text-charcoal-muted mt-0.5">
                    {item.tamanho}{item.cor ? ` · ${item.cor}` : ''}
                  </p>
                  <p className="text-gold font-semibold text-sm mt-1">{formatPrice(item.preco)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item.variante_id, item.quantidade - 1)}
                      className="w-6 h-6 border border-cream-darker flex items-center justify-center hover:border-gold transition-colors">
                      <Minus size={10} />
                    </button>
                    <span className="text-sm w-5 text-center">{item.quantidade}</span>
                    <button onClick={() => updateQuantity(item.variante_id, item.quantidade + 1)}
                      className="w-6 h-6 border border-cream-darker flex items-center justify-center hover:border-gold transition-colors">
                      <Plus size={10} />
                    </button>
                    <button onClick={() => removeItem(item.variante_id)} className="ml-auto text-charcoal-muted hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-cream-darker px-5 py-5 space-y-3">
            <div className="flex justify-between text-sm font-sans">
              <span className="text-charcoal-muted">Subtotal</span>
              <span className="font-semibold text-charcoal">{formatPrice(total())}</span>
            </div>
            {total() < 399 && (
              <p className="text-xs text-charcoal-muted bg-cream-dark px-3 py-2 rounded-sm">
                Falta <strong className="text-gold">{formatPrice(399 - total())}</strong> para frete grátis
              </p>
            )}
            <Link href="/checkout" onClick={() => setOpen(false)}>
              <Button className="w-full">Finalizar Compra</Button>
            </Link>
            <button onClick={() => setOpen(false)} className="w-full text-xs text-charcoal-muted hover:text-charcoal text-center py-1 transition-colors">
              Continuar comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
