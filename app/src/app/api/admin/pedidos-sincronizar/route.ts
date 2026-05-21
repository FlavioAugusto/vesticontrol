import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface ResultadoSync {
  pedido_id: string;
  numero: number;
  status_anterior: string;
  status_novo: string;
  metodo: string;
  atualizado: boolean;
  erro?: string;
}

async function consultarMercadoPago(paymentId: string) {
  try {
    const { MercadoPagoConfig, Payment } = await import('mercadopago');
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return null;
    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const payment = new Payment(mp);
    const result = await payment.get({ id: paymentId });
    return result;
  } catch {
    return null;
  }
}

async function consultarMercadoPagoPorReferencia(pedidoId: string) {
  try {
    const { MercadoPagoConfig, Payment } = await import('mercadopago');
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return null;
    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const payment = new Payment(mp);
    const search = await payment.search({ options: { external_reference: pedidoId } });
    const results = (search?.results ?? []) as Array<{ status: string; id: number | string }>;
    if (results.length === 0) return null;
    // Pega o mais recente com status approved, ou o último
    const approved = results.find(p => p.status === 'approved');
    return approved ?? results[results.length - 1];
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { pedidoIds } = await req.json();
    if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum pedido informado' }, { status: 400 });
    }

    const adminClient = createAdmin();

    const { data: pedidos } = await adminClient
      .from('pedidos')
      .select('id, numero, status, status_pagamento, payment_id, metodo_pagamento')
      .in('id', pedidoIds);

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({ error: 'Pedidos não encontrados' }, { status: 404 });
    }

    const resultados: ResultadoSync[] = [];

    for (const p of pedidos as Array<{ id: string; numero: number; status: string; status_pagamento: string; payment_id: string | null; metodo_pagamento: string | null }>) {
      const resultado: ResultadoSync = {
        pedido_id: p.id,
        numero: p.numero,
        status_anterior: p.status,
        status_novo: p.status,
        metodo: p.metodo_pagamento ?? 'desconhecido',
        atualizado: false,
      };

      // Tenta consultar MercadoPago
      const isMP = p.metodo_pagamento?.includes('mercadopago') ||
                   p.metodo_pagamento === 'pix' ||
                   p.metodo_pagamento === 'cartao' ||
                   p.metodo_pagamento === 'boleto';

      if (isMP) {
        let payment = null;

        // Tenta por payment_id primeiro
        if (p.payment_id && !p.payment_id.includes('-')) { // payment_id puro (não UUID)
          payment = await consultarMercadoPago(p.payment_id);
        }

        // Se não achou, busca pela external_reference (id do pedido)
        if (!payment) {
          payment = await consultarMercadoPagoPorReferencia(p.id);
        }

        if (payment) {
          const statusMap: Record<string, string> = {
            approved: 'pago',
            rejected: 'cancelado',
            pending: 'processando',
            in_process: 'processando',
            cancelled: 'cancelado',
            refunded: 'reembolsado',
          };
          const novoStatus = statusMap[payment.status ?? ''] ?? p.status;

          if (novoStatus !== p.status) {
            const updateData: Record<string, string | null> = {
              status: novoStatus,
              status_pagamento: payment.status ?? p.status_pagamento,
              payment_id: String(payment.id),
            };
            if (payment.status === 'approved') {
              updateData.pago_em = new Date().toISOString();
            }

            await adminClient.from('pedidos').update(updateData).eq('id', p.id);

            // Se ficou pago, debita estoque
            if (payment.status === 'approved') {
              const { data: itens } = await adminClient
                .from('pedido_itens').select('variante_id, quantidade').eq('pedido_id', p.id);
              if (itens) {
                for (const item of itens as Array<{ variante_id: string | null; quantidade: number }>) {
                  if (!item.variante_id) continue;
                  const { data: v } = await adminClient
                    .from('produto_variantes').select('estoque').eq('id', item.variante_id).maybeSingle();
                  if (v) {
                    const novoEstoque = Math.max(0, Number(v.estoque) - item.quantidade);
                    await adminClient.from('produto_variantes')
                      .update({ estoque: novoEstoque })
                      .eq('id', item.variante_id);
                  }
                }
              }
            }

            resultado.status_novo = novoStatus;
            resultado.atualizado = true;
          }
        } else {
          resultado.erro = 'Pagamento não encontrado no gateway';
        }
      } else {
        resultado.erro = 'Método de pagamento sem sincronização disponível';
      }

      resultados.push(resultado);
    }

    return NextResponse.json({
      ok: true,
      total: resultados.length,
      atualizados: resultados.filter(r => r.atualizado).length,
      resultados,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
