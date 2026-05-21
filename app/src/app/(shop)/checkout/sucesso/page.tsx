'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import AvaliacaoModal from '@/components/shop/AvaliacaoModal';

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pedidoId = searchParams.get('pedidoId') || searchParams.get('pedido') || searchParams.get('order_nsu');
  const numero = searchParams.get('numero');
  const pendente = searchParams.get('pendente') === 'true';
  const transactionNsu = searchParams.get('transaction_nsu');
  const slug = searchParams.get('slug');
  const captureMethod = searchParams.get('capture_method');

  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
  const [produtosPedido, setProdutosPedido] = useState<{ id: string; nome: string; imagem?: string }[]>([]);

  useEffect(() => {
    if (!pedidoId) return;

    if (transactionNsu || slug || captureMethod) {
      fetch('/api/infinitepay/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, transaction_nsu: transactionNsu, slug, capture_method: captureMethod }),
      }).catch(() => {});
    }

    fetch(`/api/pedidos/${pedidoId}/itens`)
      .then(r => r.json())
      .then(d => {
        if (d.itens?.length > 0) {
          setProdutosPedido(d.itens);
          setTimeout(() => setMostrarAvaliacao(true), 2000);
        }
      })
      .catch(() => {});
  }, [pedidoId, transactionNsu, slug, captureMethod]);

  return (
    <>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className={pendente ? 'text-yellow-500' : 'text-green-500'} />
          </div>

          <h1 className="font-serif text-3xl text-charcoal mb-3">
            {pendente ? 'Pagamento em Análise' : 'Pedido Confirmado! 🎉'}
          </h1>

          {numero && (
            <p className="text-gold font-semibold text-lg mb-3">Pedido #{numero}</p>
          )}

          <p className="text-charcoal-muted text-sm mb-8 leading-relaxed">
            {pendente
              ? 'Seu pagamento está sendo processado. Você receberá um e-mail assim que confirmado.'
              : 'Obrigada pela sua compra! Você receberá um e-mail com os detalhes e o rastreio assim que enviarmos.'}
          </p>

          <div className="bg-cream-dark p-5 rounded-sm text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Package size={16} className="text-gold shrink-0" />
              <span className="text-charcoal">Seu pedido será preparado com todo cuidado</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageCircle size={16} className="text-gold shrink-0" />
              <span className="text-charcoal">Você receberá atualizações por e-mail e WhatsApp</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/minha-conta/pedidos">
              <Button className="w-full">Ver Meus Pedidos</Button>
            </Link>
            <Link href="/produtos">
              <Button variant="outline" className="w-full">Continuar Comprando</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de avaliação pós-compra */}
      {mostrarAvaliacao && produtosPedido.length > 0 && (
        <AvaliacaoModal
          pedidoId={pedidoId ?? ''}
          produtos={produtosPedido}
          onFechar={() => setMostrarAvaliacao(false)}
        />
      )}
    </>
  );
}

export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-charcoal-muted">Carregando...</p>
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
