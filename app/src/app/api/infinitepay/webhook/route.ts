import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { notificarCliente, PedidoInfo } from '@/lib/whatsapp';
import type { InfinitePayWebhookPayload } from '@/lib/infinitepay';

export async function POST(req: NextRequest) {
  try {
    const payload: InfinitePayWebhookPayload = await req.json();
    const supabase = createClient();

    // 🔍 LOG: registra todo webhook recebido (ajuda a debugar)
    console.log('[InfinitePay Webhook] RECEBIDO:', JSON.stringify(payload));

    const pedidoId = payload.order_nsu;
    if (!pedidoId) {
      console.warn('[InfinitePay Webhook] Sem order_nsu, ignorando');
      return NextResponse.json({ received: true, warning: 'no order_nsu' });
    }

    const pago = payload.paid_amount >= payload.amount;

    const { data: pedidoAtualizado } = await supabase
      .from('pedidos')
      .update({
        status_pagamento: pago ? 'approved' : 'pending',
        status: pago ? 'pago' : 'processando',
        payment_id: payload.transaction_nsu || payload.invoice_slug,
        metodo_pagamento: `infinitepay_${payload.capture_method || 'checkout'}`,
        pago_em: pago ? new Date().toISOString() : null,
      })
      .eq('id', pedidoId)
      .select('*, clientes(nome, telefone, whatsapp), pedido_itens(nome_produto, tamanho, cor, quantidade)')
      .single();

    if (pago && pedidoAtualizado) {
      const p = pedidoAtualizado as {
        cupom_codigo?: string | null;
        numero: number;
        total: number;
        clientes: { nome: string; telefone: string | null; whatsapp: string | null } | null;
        pedido_itens: { nome_produto: string; tamanho: string | null; cor: string | null; quantidade: number }[];
      };

      // Debita estoque das variantes vendidas (somente quando pagamento é confirmado)
      const { data: itensComVariante } = await supabase
        .from('pedido_itens')
        .select('variante_id, quantidade')
        .eq('pedido_id', pedidoId);

      if (itensComVariante) {
        for (const item of itensComVariante as { variante_id: string | null; quantidade: number }[]) {
          if (!item.variante_id) continue;
          const { data: vAtual } = await supabase
            .from('produto_variantes').select('estoque').eq('id', item.variante_id).single();
          if (vAtual) {
            const novoEstoque = Math.max(0, (vAtual as { estoque: number }).estoque - item.quantidade);
            await supabase.from('produto_variantes')
              .update({ estoque: novoEstoque })
              .eq('id', item.variante_id);
          }
        }
      }

      if (p.cupom_codigo) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cupons/validar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: p.cupom_codigo }),
        }).catch(() => {});
      }

      const telefone = p.clientes?.whatsapp ?? p.clientes?.telefone ?? '';
      if (telefone) {
        const info: PedidoInfo = {
          numero: p.numero,
          total: Number(p.total),
          status: 'pago',
          cliente_nome: p.clientes?.nome ?? 'Cliente',
          cliente_telefone: telefone,
          itens: p.pedido_itens.map(i => ({
            nome: i.nome_produto,
            tamanho: i.tamanho ?? '',
            cor: i.cor ?? undefined,
            quantidade: i.quantidade,
          })),
        };
        notificarCliente('pedido_confirmado', info);
      }
    }

    console.log(`[InfinitePay Webhook] Processado pedido ${pedidoId} — pago: ${pago}`);
    return NextResponse.json({ received: true, pedidoId, pago });
  } catch (error: unknown) {
    console.error('[InfinitePay Webhook] ERRO:', error);
    return NextResponse.json({ received: true, error: String(error) });
  }
}

// Permite GET pra teste de conexão (admin verifica se a URL está acessível)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook InfinitePay ativo. POST aqui pra registrar pagamentos.',
    timestamp: new Date().toISOString(),
  });
}
