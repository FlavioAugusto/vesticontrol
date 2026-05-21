import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoPayment } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/admin';
import { notificarCliente, PedidoInfo } from '@/lib/whatsapp';
import crypto from 'crypto';

function verificarAssinaturaMercadoPago(req: NextRequest, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? process.env.WEBHOOK_SECRET;
  if (!secret) return true; // Se não configurado, permite (dev)

  const signature = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';

  if (!signature) return false;

  const parts: Record<string, string> = {};
  signature.split(',').forEach(part => {
    const [key, val] = part.split('=');
    if (key && val) parts[key.trim()] = val.trim();
  });

  const ts = parts['ts'] ?? '';
  const v1 = parts['v1'] ?? '';

  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return expected === v1;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verificar assinatura para evitar webhooks falsos
    if (!verificarAssinaturaMercadoPago(req, rawBody)) {
      console.warn('[Webhook MP] Assinatura inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const supabase = createClient();

    if (body.type === 'payment') {
      const payment = await getMercadoPagoPayment(String(body.data.id));
      const statusMap: Record<string, string> = {
        approved: 'pago', rejected: 'cancelado',
        pending: 'processando', in_process: 'processando',
      };
      const newStatus = statusMap[payment.status ?? ''] ?? 'processando';

      // external_reference é o ID interno do pedido (definido no checkout)
      const pedidoId = payment.external_reference ?? '';
      if (!pedidoId) {
        console.warn('[Webhook MP] external_reference vazio — payment.id:', payment.id);
        return NextResponse.json({ received: true });
      }

      const { data: pedidoAtualizado } = await supabase
        .from('pedidos')
        .update({
          status_pagamento: payment.status ?? 'aguardando',
          status: newStatus,
          payment_id: String(payment.id), // garante que o payment_id real do MP fica salvo
          pago_em: payment.status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', pedidoId)
        .select('*, clientes(nome, telefone, whatsapp), pedido_itens(nome_produto, tamanho, cor, quantidade)')
        .single();

      // Incrementar uso do cupom se pagamento aprovado
      if (payment.status === 'approved' && pedidoAtualizado) {
        const p = pedidoAtualizado as { id: string; cupom_codigo?: string | null; numero: number; total: number; clientes: { nome: string; telefone: string | null; whatsapp: string | null } | null; pedido_itens: { nome_produto: string; tamanho: string | null; cor: string | null; quantidade: number }[] };

        // Debita estoque das variantes vendidas (somente quando pagamento é confirmado)
        const { data: itensComVariante } = await supabase
          .from('pedido_itens').select('variante_id, quantidade').eq('pedido_id', p.id);
        if (itensComVariante) {
          for (const item of itensComVariante as { variante_id: string | null; quantidade: number }[]) {
            if (!item.variante_id) continue;
            const { data: vAtual } = await supabase
              .from('produto_variantes').select('estoque').eq('id', item.variante_id).single();
            if (vAtual) {
              await supabase.from('produto_variantes')
                .update({ estoque: Math.max(0, (vAtual as { estoque: number }).estoque - item.quantidade) })
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

        // WhatsApp notification
        const telefone = p.clientes?.whatsapp ?? p.clientes?.telefone ?? '';
        if (telefone) {
          const info: PedidoInfo = {
            numero: p.numero, total: Number(p.total), status: 'pago',
            cliente_nome: p.clientes?.nome ?? 'Cliente',
            cliente_telefone: telefone,
            itens: p.pedido_itens.map(i => ({ nome: i.nome_produto, tamanho: i.tamanho ?? '', cor: i.cor ?? undefined, quantidade: i.quantidade })),
          };
          notificarCliente('pedido_confirmado', info);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
