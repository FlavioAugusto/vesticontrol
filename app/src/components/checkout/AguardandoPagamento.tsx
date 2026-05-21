'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink, Clock, AlertTriangle, ShoppingBag } from 'lucide-react';
import PagamentoTimer from './PagamentoTimer';

interface Props {
  pedidoId: string;
  numero?: number;
  total: number;
  metodo: 'cartao' | 'pix' | 'boleto';
  checkoutUrl: string;
  onCancelar?: () => void;
}

function formatPrice(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }

export default function AguardandoPagamento({ pedidoId, numero, total, metodo, checkoutUrl, onCancelar }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'aguardando' | 'pago' | 'cancelado'>('aguardando');
  const [tentativas, setTentativas] = useState(0);
  const [confirmando, setConfirmando] = useState(false);

  // Polling a cada 4 segundos para verificar se o pagamento foi confirmado
  useEffect(() => {
    if (status !== 'aguardando') return;
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/status?pedidoId=${pedidoId}`);
        const data = await res.json();
        setTentativas(t => t + 1);

        if (data.pago) {
          setStatus('pago');
          setTimeout(() => {
            router.push(`/checkout/sucesso?pedido=${pedidoId}${numero ? `&numero=${numero}` : ''}`);
          }, 1500);
        } else if (data.cancelado) {
          setStatus('cancelado');
        }
      } catch { /* silencioso */ }
    }, 4000);
    return () => clearInterval(intervalo);
  }, [pedidoId, status, router, numero]);

  function reabrirCheckout() {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  }

  // Confirma manualmente — quando o cliente já pagou e o sistema não detectou automaticamente
  async function confirmarManual() {
    if (confirmando) return;
    if (!confirm('Você confirma que já pagou esse pedido na InfinitePay?\n\nA equipe vai validar o pagamento no painel da InfinitePay.')) return;
    setConfirmando(true);
    try {
      const res = await fetch('/api/infinitepay/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, confirmacaoManual: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('pago');
        setTimeout(() => {
          router.push(`/checkout/sucesso?pedido=${pedidoId}${numero ? `&numero=${numero}` : ''}`);
        }, 1500);
      } else {
        alert(data.error || 'Erro ao confirmar. Aguarde a validação automática ou contate o suporte.');
      }
    } catch {
      alert('Erro de conexão. Tente novamente em alguns instantes.');
    } finally {
      setConfirmando(false);
    }
  }

  if (status === 'pago') {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5 animate-pulse">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Pagamento confirmado! 🎉</h1>
          <p className="text-charcoal-muted text-sm">Redirecionando para confirmação do pedido...</p>
          <div className="mt-4 w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (status === 'cancelado') {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Pedido cancelado</h1>
          <p className="text-charcoal-muted text-sm mb-6">O pagamento não foi confirmado a tempo.</p>
          <button onClick={() => router.push('/produtos')}
            className="bg-charcoal text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-charcoal-light">
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag size={28} className="text-gold" />
        </div>
        <h1 className="font-serif text-2xl text-charcoal">Pedido #{numero ?? pedidoId.slice(0, 8)}</h1>
        <p className="text-charcoal-muted text-sm">Total: <strong>{formatPrice(total)}</strong></p>
      </div>

      <div className="mb-5">
        <PagamentoTimer
          pedidoId={pedidoId}
          tipo={metodo === 'pix' ? 'pix' : 'cartao'}
          onExpirar={() => { setStatus('cancelado'); onCancelar?.(); }}
        />
      </div>

      {/* Card explicativo */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <ExternalLink size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-charcoal text-sm">Aguardando pagamento na InfinitePay</p>
            <p className="text-[11px] text-charcoal-muted">A página de pagamento foi aberta em outra aba</p>
          </div>
        </div>

        {/* Aviso destacado de qual método escolher */}
        <div className={`border-2 rounded-sm p-4 mb-4 ${
          metodo === 'pix' ? 'border-emerald-300 bg-emerald-50' :
          metodo === 'boleto' ? 'border-blue-300 bg-blue-50' :
          'border-purple-300 bg-purple-50'
        }`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5"
             style={{ color: metodo === 'pix' ? '#047857' : metodo === 'boleto' ? '#1e40af' : '#6b21a8' }}>
            ⚠️ Importante!
          </p>
          <p className="text-sm text-charcoal font-semibold">
            Na tela da InfinitePay, escolha <span className={`px-2 py-0.5 rounded font-bold ${
              metodo === 'pix' ? 'bg-emerald-200 text-emerald-900' :
              metodo === 'boleto' ? 'bg-blue-200 text-blue-900' :
              'bg-purple-200 text-purple-900'
            }`}>
              {metodo === 'pix' ? 'Pix' : metodo === 'boleto' ? 'Boleto' : 'Crédito'}
            </span> {' '}
            (ignore os outros métodos).
          </p>
        </div>

        <div className="bg-cream/50 border border-cream-darker rounded-sm p-4 mb-4">
          <ol className="text-xs text-charcoal space-y-2 list-decimal list-inside">
            <li>Volte para a aba da <strong>InfinitePay</strong></li>
            <li>Selecione <strong>{metodo === 'pix' ? 'Pix' : metodo === 'boleto' ? 'Boleto' : 'Crédito'}</strong> e conclua o pagamento</li>
            <li>Quando o pagamento for confirmado, esta página atualiza sozinha 🎉</li>
          </ol>
        </div>

        <button onClick={reabrirCheckout}
          className="w-full bg-charcoal text-white py-3 text-xs font-bold tracking-wider uppercase hover:bg-charcoal-light transition-colors flex items-center justify-center gap-2">
          <ExternalLink size={14} /> Reabrir página de pagamento
        </button>
      </div>

      {/* Botão "Já paguei" — aparece sempre, mais visível após 30s */}
      <div className={`mb-4 ${tentativas >= 8 ? 'animate-pulse' : ''}`}>
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-sm p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
            ✅ Já fez o pagamento?
          </p>
          <p className="text-xs text-emerald-700 mb-3">
            Se você concluiu o pagamento na InfinitePay e essa página não atualizou automaticamente, clique no botão abaixo:
          </p>
          <button onClick={confirmarManual} disabled={confirmando}
            className="w-full bg-emerald-600 text-white py-3 text-xs font-bold tracking-wider uppercase hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm">
            {confirmando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirmando...</>
            ) : (
              <><CheckCircle size={14} /> Já paguei — confirmar pedido</>
            )}
          </button>
          <p className="text-[10px] text-emerald-600/70 mt-2 text-center">
            Nossa equipe valida o pagamento no painel InfinitePay
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-charcoal-muted bg-cream/50 p-3 rounded-sm">
        <Clock size={12} className="animate-pulse" />
        <span>Verificando pagamento automaticamente... ({tentativas} tentativas)</span>
      </div>

      <button onClick={() => router.push('/')}
        className="w-full text-center text-xs text-charcoal-muted hover:text-charcoal mt-6 py-2">
        Cancelar e voltar para a loja
      </button>
    </div>
  );
}
