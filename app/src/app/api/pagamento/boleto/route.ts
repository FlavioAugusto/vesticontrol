import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createCheckoutLink } from '@/lib/infinitepay';
import { headers } from 'next/headers';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

async function getCfg(supabase: ReturnType<typeof createClient>, chave: string, lojaId: string) {
  const { data } = await supabase.from('configuracoes')
    .select('valor').eq('chave', chave).eq('loja_id', lojaId).maybeSingle();
  return data?.valor ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, total, cliente, payer, items, endereco } = await req.json();
    const supabase = createClient();
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    const configGateway = await getCfg(supabase, 'gateway_pagamento', lojaId);
    const configIp = await getCfg(supabase, 'infinitepay_ativo', lojaId);
    const configMp = await getCfg(supabase, 'mercadopago_ativo', lojaId);
    const configHandle = await getCfg(supabase, 'infinitepay_handle', lojaId);
    const mpTokenLoja = await getCfg(supabase, 'mercadopago_access_token', lojaId);
    const nomeLoja = await getCfg(supabase, 'loja_nome', lojaId);

    const infinitepayAtivo = configIp === 'true' || configGateway === 'infinitepay';
    const mpAtivo = configMp === 'true' || configGateway === 'mercadopago';
    const infinitepayHandle = configHandle || process.env.INFINITEPAY_HANDLE;
    const mpToken = mpTokenLoja || process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Merge cliente + payer (cliente tem nome/cpf/telefone, payer tem email)
    const dadosCliente = {
      ...(cliente ?? {}),
      ...(payer ?? {}),
      email: payer?.email || cliente?.email || '',
      nome: payer?.nome || cliente?.nome || 'Cliente',
      cpf: payer?.cpf || cliente?.cpf || '',
      telefone: payer?.telefone || cliente?.telefone || '',
    };

    // 1. MercadoPago — Boleto inline com linha digitável real
    if (mpAtivo && mpToken && !mpToken.includes('...')) {
      const idempotencyKey = `boleto-${pedidoId}-${Date.now()}`;

      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          transaction_amount: total,
          description: `Pedido #${pedidoId.slice(0, 8)} - ${nomeLoja || 'Loja'}`,
          payment_method_id: 'bolbradesco',
          payer: {
            email: dadosCliente.email ?? '',
            first_name: (dadosCliente.nome ?? 'Cliente').split(' ')[0],
            last_name: (dadosCliente.nome ?? 'BMM').split(' ').slice(1).join(' ') || 'BMM',
            identification: {
              type: 'CPF',
              number: (dadosCliente.cpf ?? '').replace(/\D/g, ''),
            },
            address: endereco ? {
              zip_code: (endereco.cep ?? '').replace(/\D/g, ''),
              street_name: endereco.rua ?? '',
              street_number: endereco.numero ?? '',
              neighborhood: endereco.bairro ?? '',
              city: endereco.cidade ?? '',
              federal_unit: endereco.estado ?? '',
            } : undefined,
          },
          external_reference: pedidoId,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
        }),
      });

      const result = await mpRes.json();
      if (!mpRes.ok) {
        return NextResponse.json({ error: result.message || 'Erro ao gerar boleto' }, { status: 400 });
      }

      await supabase.from('pedidos').update({
        payment_id: String(result.id),
        metodo_pagamento: 'boleto',
      }).eq('id', pedidoId);

      return NextResponse.json({
        boleto_url: result.transaction_details?.external_resource_url,
        linha_digitavel: result.barcode?.content,
        vencimento: result.date_of_expiration ? new Date(result.date_of_expiration).toLocaleDateString('pt-BR') : null,
        gateway: 'mercadopago',
      });
    }

    // 2. InfinitePay — redirect para checkout
    if (infinitepayAtivo && infinitepayHandle) {
      // Consolida em UM ÚNICO item com o total final (já com frete)
      const checkoutItems = [{
        description: `Pedido By Marcelo Medeiros - Boleto (${(items?.length ?? 1)} ${(items?.length ?? 1) === 1 ? 'peça' : 'peças'})`,
        quantity: 1,
        price: Math.round(Number(total) * 100),
      }];

      if (!dadosCliente.email) {
        return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 });
      }

      const result = await createCheckoutLink({
        handle: infinitepayHandle,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pedido=${pedidoId}`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/infinitepay/webhook`,
        order_nsu: pedidoId,
        items: checkoutItems,
        payment_methods: ['bank_slip'],
        customer: {
          name: dadosCliente.nome,
          email: dadosCliente.email,
          phone_number: (dadosCliente.telefone ?? '').replace(/\D/g, ''),
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
        ? `${result.url}&payment_method=bank_slip`
        : `${result.url}?payment_method=bank_slip`;

      await supabase.from('pedidos').update({
        payment_url: urlComMetodo,
        metodo_pagamento: 'boleto',
      }).eq('id', pedidoId);

      return NextResponse.json({
        checkout_url: urlComMetodo,
        gateway: 'infinitepay',
      });
    }

    return NextResponse.json({ error: 'Nenhum gateway configurado para Boleto' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro boleto' }, { status: 500 });
  }
}
