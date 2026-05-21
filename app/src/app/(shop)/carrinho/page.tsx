'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function CarrinhoPage() {
  const { items, total, removeItem, updateQuantity, clearCart } = useCartStore();
  const [cupom, setCupom] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [aplicandoCupom, setAplicandoCupom] = useState(false);

  async function aplicarCupom() {
    if (!cupom.trim()) return;
    setAplicandoCupom(true);
    try {
      const res = await fetch('/api/cupons/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cupom, total: total() }),
      });
      const d = await res.json();
      if (d.valido) {
        if (desconto > 0) {
          toast.success(`Cupom substituído! Apenas 1 cupom por pedido. ${d.desconto > 0 ? `-${formatPrice(d.desconto)}` : 'Frete grátis no checkout'}`, { duration: 4000 });
        } else {
          toast.success(d.mensagem ?? `Cupom aplicado!${d.desconto > 0 ? ` -${formatPrice(d.desconto)}` : ''}`);
        }
        setDesconto(d.desconto);
      } else {
        toast.error(d.mensagem ?? 'Cupom inválido');
      }
    } catch { toast.error('Erro ao validar cupom'); }
    setAplicandoCupom(false);
  }

  const subtotal = total();
  const totalFinal = subtotal - desconto;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={56} className="text-cream-darker mx-auto mb-5" />
        <h1 className="font-serif text-2xl text-charcoal mb-3">Seu carrinho está vazio</h1>
        <p className="text-charcoal-muted text-sm mb-6">Explore nossa coleção e adicione peças incríveis</p>
        <Link href="/produtos" className="btn-gold inline-flex">Ver Coleção</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/produtos" className="text-charcoal-muted hover:text-charcoal transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-serif text-2xl text-charcoal flex items-center gap-2">
          <ShoppingBag size={20} className="text-gold" />
          Carrinho
          <span className="text-sm font-sans text-charcoal-muted font-normal">{items.length} {items.length === 1 ? 'produto' : 'produtos'}</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Itens do carrinho */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.variante_id} className="bg-white border border-cream-darker rounded-sm p-4 flex items-center gap-4">
              {/* Imagem */}
              <div className="relative w-16 h-20 shrink-0 overflow-hidden bg-cream-dark">
                {item.imagem ? (
                  <Image src={item.imagem} alt={item.nome} fill className="object-cover object-top" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-charcoal-muted" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-sans font-semibold text-sm text-charcoal truncate">{item.nome}</h3>
                <p className="text-[11px] text-charcoal-muted mt-0.5">
                  {item.cor && `${item.cor} / `}{item.tamanho}
                </p>
                <p className="text-gold font-semibold text-sm mt-1">{formatPrice(item.preco)}</p>
              </div>

              {/* Quantidade */}
              <div className="flex items-center border border-cream-darker">
                <button onClick={() => updateQuantity(item.variante_id, item.quantidade - 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors text-charcoal">
                  <Minus size={12} />
                </button>
                <span className="w-9 h-8 flex items-center justify-center text-sm font-semibold border-x border-cream-darker">
                  {item.quantidade}
                </span>
                <button onClick={() => updateQuantity(item.variante_id, item.quantidade + 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-cream transition-colors text-charcoal">
                  <Plus size={12} />
                </button>
              </div>

              {/* Total do item */}
              <p className="font-semibold text-charcoal text-sm w-20 text-right shrink-0">
                {formatPrice(item.preco * item.quantidade)}
              </p>

              {/* Remover */}
              <button onClick={() => { removeItem(item.variante_id); toast.success('Item removido'); }}
                className="text-charcoal-muted hover:text-red-500 transition-colors ml-1 shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {/* Selos de segurança */}
          <div className="flex items-center justify-start gap-4 pt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-charcoal">SITE 100%</p>
                <p className="text-[10px] font-bold text-charcoal -mt-0.5">SEGURO</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-charcoal">GOOGLE</p>
                <p className="text-[10px] font-bold text-charcoal -mt-0.5">SITE SEGURO</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-charcoal">LET&apos;S</p>
                <p className="text-[10px] font-bold text-charcoal -mt-0.5">ENCRYPT SSL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-cream-darker rounded-sm p-5 sticky top-24">
            <h2 className="font-serif text-lg text-charcoal mb-4">Resumo</h2>

            {/* Itens */}
            <div className="space-y-2 mb-4 pb-4 border-b border-cream-darker">
              {items.map((item) => (
                <div key={item.variante_id} className="flex justify-between text-sm">
                  <span className="text-charcoal-muted truncate flex-1 mr-2">
                    {item.nome} × {item.quantidade}
                  </span>
                  <span className="font-semibold shrink-0">{formatPrice(item.preco * item.quantidade)}</span>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-charcoal-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>

              {/* Cupom */}
              <div className="flex gap-2">
                <input value={cupom} onChange={e => setCupom(e.target.value.toUpperCase())}
                  placeholder="Inserir cupom"
                  className="flex-1 border border-cream-darker px-3 py-2 text-xs focus:outline-none focus:border-gold transition-colors"
                  onKeyDown={e => e.key === 'Enter' && aplicarCupom()} />
                <button onClick={aplicarCupom} disabled={aplicandoCupom}
                  className="border border-charcoal text-charcoal px-3 text-xs font-semibold hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50">
                  {aplicandoCupom ? '...' : 'OK'}
                </button>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm text-green-600 items-center">
                  <span className="flex items-center gap-1.5">
                    Desconto
                    <button onClick={() => { setDesconto(0); setCupom(''); toast.success('Cupom removido'); }}
                      className="text-[10px] text-green-400 hover:text-red-500 underline">remover</button>
                  </span>
                  <span>-{formatPrice(desconto)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-charcoal-muted">Frete</span>
                <span className="text-charcoal-muted text-xs">Calculado no checkout</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between font-semibold text-lg border-t border-cream-darker pt-3 mb-4">
              <span>Total</span>
              <span className="text-gold">{formatPrice(totalFinal)}</span>
            </div>

            <p className="text-[11px] text-charcoal-muted mb-3 text-center">
              ou 6x de {formatPrice(totalFinal / 6)} sem juros
            </p>

            <Link href="/checkout"
              className="w-full flex items-center justify-center bg-gold hover:bg-gold-600 text-white py-3.5 font-semibold text-sm tracking-wider uppercase transition-colors rounded-sm">
              Finalizar a compra
            </Link>

            <Link href="/produtos"
              className="w-full text-center text-xs text-charcoal-muted hover:text-charcoal mt-3 block transition-colors py-2">
              Continuar comprando
            </Link>
          </div>
        </aside>

      </div>
    </div>
  );
}
