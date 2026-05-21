'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  pedidoId: string;
  tipo: 'pix' | 'cartao';
  onExpirar: () => void;
  minutos?: number;
}

export default function PagamentoTimer({ pedidoId, tipo, onExpirar, minutos = 15 }: Props) {
  const [segundosRestantes, setSegundosRestantes] = useState(minutos * 60);
  const [expirou, setExpirou] = useState(false);

  const cancelarPedido = useCallback(async () => {
    try {
      await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId, motivo: 'timeout_pagamento' }),
      });
    } catch { /* erro silencioso */ }
    setExpirou(true);
    onExpirar();
  }, [pedidoId, onExpirar]);

  useEffect(() => {
    if (segundosRestantes <= 0) {
      cancelarPedido();
      return;
    }
    const t = setInterval(() => setSegundosRestantes((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [segundosRestantes, cancelarPedido]);

  const min = Math.floor(segundosRestantes / 60);
  const sec = segundosRestantes % 60;
  const pct = (segundosRestantes / (minutos * 60)) * 100;
  const urgente = segundosRestantes < 120;

  if (expirou) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-center">
        <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
        <p className="font-semibold text-red-700">Tempo esgotado!</p>
        <p className="text-xs text-red-500 mt-1">Seu pedido foi cancelado. O estoque foi liberado.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-sm p-4 border ${urgente ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className={urgente ? 'text-red-500' : 'text-amber-600'} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${urgente ? 'text-red-700' : 'text-amber-700'}`}>
            {tipo === 'pix' ? 'Aguardando pagamento PIX' : 'Aguardando confirmação'}
          </span>
        </div>
        <span className={`font-mono font-bold text-lg ${urgente ? 'text-red-600' : 'text-amber-700'}`}>
          {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgente ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] mt-2 text-center" style={{ color: urgente ? '#b91c1c' : '#92400e' }}>
        {urgente
          ? '⚠️ Menos de 2 minutos! Finalize agora ou o pedido será cancelado.'
          : `Conclua o pagamento em ${min} min e ${sec} seg para garantir sua peça.`}
      </p>
    </div>
  );
}
