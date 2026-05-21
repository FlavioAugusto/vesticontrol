'use client';

import { useState } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { X, AlertTriangle } from 'lucide-react';

interface Pedido {
  id: string;
  numero: number;
  status: string;
  total: number;
  frete: number;
  metodo_pagamento: string | null;
  created_at: string;
  codigo_rastreio: string | null;
}

const STATUS_COLORS: Record<string, 'pago' | 'pendente' | 'cancelado' | 'enviado'> = {
  pago: 'pago', enviado: 'enviado', pendente: 'pendente', cancelado: 'cancelado',
  entregue: 'pago', processando: 'pendente', reembolsado: 'cancelado',
};

const STATUS_PODE_CANCELAR = ['pendente', 'processando'];

export default function PedidoCardCliente({ pedido }: { pedido: Pedido }) {
  const [statusAtual, setStatusAtual] = useState(pedido.status);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');

  const podeCancelar = STATUS_PODE_CANCELAR.includes(statusAtual);

  async function cancelarPedido() {
    if (!motivo.trim()) {
      toast.error('Por favor, conta o motivo do cancelamento');
      return;
    }
    setCancelando(true);
    const loadingToast = toast.loading('Cancelando pedido...');
    try {
      const res = await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedido.id, motivo: motivo.trim() }),
      });
      const data = await res.json();
      toast.dismiss(loadingToast);
      if (!res.ok) { toast.error(data.error || 'Erro ao cancelar'); return; }
      setStatusAtual('cancelado');
      setShowConfirm(false);
      setMotivo('');
      toast.success('Pedido cancelado com sucesso. O estoque foi devolvido.', { duration: 5000 });
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setCancelando(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-sm shadow-sm">
        <div className="px-5 py-4 border-b border-cream-darker flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg text-charcoal">Pedido #{pedido.numero}</span>
            <Badge variant={STATUS_COLORS[statusAtual] ?? 'default'}>{statusAtual}</Badge>
          </div>
          <span className="text-xs text-charcoal-muted">{formatDate(pedido.created_at)}</span>
        </div>
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-charcoal-muted mb-0.5">Total</p>
            <p className="font-semibold text-gold">{formatPrice(Number(pedido.total))}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-muted mb-0.5">Pagamento</p>
            <p className="text-charcoal capitalize">{pedido.metodo_pagamento ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-muted mb-0.5">Rastreio</p>
            {pedido.codigo_rastreio ? (
              <a href={`https://www.melhorrastreio.com.br/rastreio/${pedido.codigo_rastreio}`} target="_blank" rel="noopener"
                className="text-gold text-xs hover:underline font-semibold">
                {pedido.codigo_rastreio} 🔍
              </a>
            ) : <p className="text-charcoal-muted">—</p>}
          </div>
        </div>

        {/* Botão de cancelar - só aparece se pode cancelar */}
        {podeCancelar && (
          <div className="px-5 py-3 border-t border-cream-darker bg-amber-50/30">
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5 transition-colors"
            >
              <X size={13} /> Cancelar pedido
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !cancelando && setShowConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg text-charcoal mb-1">Cancelar Pedido #{pedido.numero}?</h3>
                <p className="text-xs text-charcoal-muted">
                  Esta ação não pode ser desfeita. Você precisará fazer um novo pedido se quiser comprar novamente.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider block mb-1.5">
                  Por que está cancelando? <span className="text-red-500">*</span>
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={cancelando}
                  className="w-full border border-cream-darker rounded-sm px-3 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                >
                  <option value="">Selecione um motivo...</option>
                  <option value="Mudei de ideia">Mudei de ideia</option>
                  <option value="Encontrei mais barato em outro lugar">Encontrei mais barato em outro lugar</option>
                  <option value="Erro no pedido (tamanho/cor errados)">Erro no pedido (tamanho/cor errados)</option>
                  <option value="Demora no envio">Demora no envio</option>
                  <option value="Problema no pagamento">Problema no pagamento</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ℹ️ Ao cancelar, o estoque dos produtos é devolvido imediatamente e o admin da loja é notificado.
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={cancelarPedido}
                disabled={cancelando || !motivo}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2.5 rounded-sm text-sm font-semibold transition-colors"
              >
                {cancelando ? 'Cancelando...' : 'Sim, cancelar pedido'}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setMotivo(''); }}
                disabled={cancelando}
                className="px-4 text-sm text-charcoal-muted hover:text-charcoal disabled:opacity-50"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
