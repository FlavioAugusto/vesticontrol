import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createCheckoutLink } from '@/lib/infinitepay';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

function getLojaIdFromRequest(): string {
  try {
    const h = headers();
    return h.get('x-loja-id') || LOJA_DEFAULT;
  } catch { return LOJA_DEFAULT; }
}

async function getConfig(supabase: ReturnType<typeof createClient>, chave: string, lojaId: string): Promise<string | null> {
  const { data } = await supabase.from('configuracoes')
    .select('valor').eq('chave', chave).eq('loja_id', lojaId).maybeSingle();
  return data?.valor ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pedidoId, total, parcelas, payer, items, endereco, token, payment_method_id } = body;

    const supabase = createClient();
    const lojaId = getLojaIdFromRequest();

    // 🛡️ Multi-tenant: busca config DA LOJA do request
    const configGateway = await getConfig(supabase, 'gateway_pagamento', lojaId);
    const configIp = await getConfig(supabase, 'infinitepay_ativo', lojaId);
    const configHandle = await getConfig(supabase, 'infinitepay_handle', lojaId);
    const mpTokenLoja = await getConfig(supabase, 'mercadopago_access_token', lojaId);
    const nomeLoja = await getConfig(supabase, 'loja_nome', lojaId);
    const infinitepayAtivo = configIp === 'true' || configGateway === 'infinitepay';
    const infinitepayHandle = configHandle || process.env.INFINITEPAY_HANDLE;
    const mpToken = mpTokenLoja || process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Se tem token, é fluxo nativo via MercadoPago
    if (token && payment_method_id) {
      if (!mpToken || mpToken.includes('...')) {
        return NextResponse.json({
          error: 'MercadoPago não configurado para esta loja',
          hint: 'Configure no admin → Configurações → Pagamento → Mercado Pago',
        }, { status: 500 });
      }

      const idempotencyKey = `pedido-${pedidoId}-${Date.now()}`;

      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: Number(Number(total).toFixed(2)),
          token,
          description: `Pedido #${pedidoId.slice(0, 8)} - ${nomeLoja || 'Loja'}`,
          installments: parcelas || 1,
          payment_method_id,
          external_reference: pedidoId,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
          payer: {
            email: payer.email,
            first_name: payer.nome?.split(' ')[0] ?? 'Cliente',
            last_name: payer.nome?.split(' ').slice(1).join(' ') || 'BMM',
            identification: {
              type: 'CPF',
              number: (payer.cpf ?? '').replace(/\D/g, ''),
            },
          },
        }),
      });

      const result = await mpRes.json();
      if (!mpRes.ok) {
        return NextResponse.json({
          error: result.message || result.error || 'Erro ao processar pagamento',
        }, { status: 400 });
      }

      const statusMap: Record<string, string> = {
        approved: 'pago', rejected: 'cancelado', pending: 'processando',
        in_process: 'processando', authorized: 'processando',
      };
      await supabase.from('pedidos').update({
        payment_id: String(result.id),
        status_pagamento: result.status,
        status: statusMap[result.status] || 'processando',
        metodo_pagamento: 'cartao',
        pago_em: result.status === 'approved' ? new Date().toISOString() : null,
      }).eq('id', pedidoId);

      return NextResponse.json({
        ok: true,
        status: result.status,
        status_detail: result.status_detail,
        payment_id: String(result.id),
        message:
          result.status === 'approved' ? 'Pagamento aprovado!' :
          result.status === 'rejected' ? `Pagamento recusado: ${result.status_detail}` :
          'Pagamento em análise',
      });
    }

    // Fluxo InfinitePay (redirect para o checkout deles)
    if (infinitepayAtivo && infinitepayHandle) {
      // Consolida em UM ÚNICO item com o total final (já com frete + descontos)
      const checkoutItems = [{
        description: `Pedido By Marcelo Medeiros (${(items?.length ?? 1)} ${(items?.length ?? 1) === 1 ? 'peça' : 'peças'})`,
        quantity: 1,
        price: Math.round(Number(total) * 100),
      }];

      const emailFinal = payer?.email || '';
      if (!emailFinal) {
        return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 });
      }

      const result = await createCheckoutLink({
        handle: infinitepayHandle,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pedido=${pedidoId}`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/infinitepay/webhook`,
        order_nsu: pedidoId,
        items: checkoutItems,
        payment_methods: ['credit_card'],
        customer: {
          name: payer?.nome ?? 'Cliente',
          email: emailFinal,
          phone_number: (payer?.telefone ?? '').replace(/\D/g, ''),
        },
        address: endereco ? {
          cep: (endereco.cep ?? '').replace(/\D/g, ''),
          street: endereco.rua ?? '',
          neighborhood: endereco.bairro ?? '',
          number: endereco.numero ?? '',
          city: endereco.cidade ?? '',
          state: endereco.estado ?? '',
          complement: endereco.complemento ?? undefined,
        } : undefined,
      });

      const urlComMetodo = result.url.includes('?')
        ? `${result.url}&payment_method=credit_card`
        : `${result.url}?payment_method=credit_card`;

      await supabase.from('pedidos').update({
        payment_url: urlComMetodo,
        metodo_pagamento: 'infinitepay',
      }).eq('id', pedidoId);

      return NextResponse.json({ checkout_url: urlComMetodo, gateway: 'infinitepay' });
    }

    return NextResponse.json({ error: 'Nenhum gateway de pagamento configurado' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro ao processar cartão',
    }, { status: 500 });
  }
}
