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
    const { pedidoId, total, email, payer, items, endereco } = await req.json();
    const supabase = createClient();
    const lojaId = headers().get('x-loja-id') || LOJA_DEFAULT;

    const configGateway = await getCfg(supabase, 'gateway_pagamento', lojaId);
    const configIp = await getCfg(supabase, 'infinitepay_ativo', lojaId);
    const configMp = await getCfg(supabase, 'mercadopago_ativo', lojaId);
    const configHandle = await getCfg(supabase, 'infinitepay_handle', lojaId);
    const mpTokenLoja = await getCfg(supabase, 'mercadopago_access_token', lojaId);

    const infinitepayAtivo = configIp === 'true' || configGateway === 'infinitepay';
    const mpAtivo = configMp === 'true' || configGateway === 'mercadopago';
    const infinitepayHandle = configHandle || process.env.INFINITEPAY_HANDLE;
    // 🛡️ Multi-tenant: token MP da loja → fallback pro env
    const mpToken = mpTokenLoja || process.env.MERCADOPAGO_ACCESS_TOKEN;

    // 1. MercadoPago — PIX inline com QR Code real
    if (mpAtivo && mpToken && !mpToken.includes('...')) {
      const { MercadoPagoConfig, Payment } = await import('mercadopago');
      const mp = new MercadoPagoConfig({ accessToken: mpToken });
      const payment = new Payment(mp);
      const result = await payment.create({
        body: {
          transaction_amount: total,
          description: 'By Marcelo Medeiros',
          payment_method_id: 'pix',
          payer: { email },
          external_reference: pedidoId,
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
        },
      });

      await supabase.from('pedidos').update({
        payment_id: String(result.id),
        metodo_pagamento: 'pix',
      }).eq('id', pedidoId);

      return NextResponse.json({
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: result.id,
        gateway: 'mercadopago',
      });
    }

    // 2. InfinitePay — redirect para checkout com PIX
    if (infinitepayAtivo && infinitepayHandle) {
      // Consolida em UM ÚNICO item com o total final (já com frete + descontos PIX)
      const checkoutItems = [{
        description: `Pedido By Marcelo Medeiros - PIX (${(items?.length ?? 1)} ${(items?.length ?? 1) === 1 ? 'peça' : 'peças'})`,
        quantity: 1,
        price: Math.round(Number(total) * 100),
      }];

      const emailFinal = payer?.email || email || '';
      if (!emailFinal) {
        return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 });
      }

      const result = await createCheckoutLink({
        handle: infinitepayHandle,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pedido=${pedidoId}`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/infinitepay/webhook`,
        order_nsu: pedidoId,
        items: checkoutItems,
        payment_methods: ['pix'],
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

      // Tenta forçar PIX via query string (caso InfinitePay aceite)
      const urlComMetodo = result.url.includes('?')
        ? `${result.url}&payment_method=pix`
        : `${result.url}?payment_method=pix`;

      await supabase.from('pedidos').update({
        payment_url: urlComMetodo,
        metodo_pagamento: 'pix',
      }).eq('id', pedidoId);

      return NextResponse.json({
        checkout_url: urlComMetodo,
        gateway: 'infinitepay',
      });
    }

    return NextResponse.json({ error: 'Nenhum gateway configurado para PIX' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro PIX' }, { status: 500 });
  }
}
