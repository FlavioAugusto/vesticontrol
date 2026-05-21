import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutLink } from '@/lib/infinitepay';
import { createClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, items, customer, endereco } = await req.json();

    const supabase = createClient();
    const lojaId = headers().get('x-loja-id') || '00000000-0000-0000-0000-000000000001';
    const { data: configHandle } = await supabase.from('configuracoes')
      .select('valor').eq('chave', 'infinitepay_handle').eq('loja_id', lojaId).maybeSingle();
    const handle = configHandle?.valor || process.env.INFINITEPAY_HANDLE;
    if (!handle) {
      return NextResponse.json({ error: 'InfiniteTag não configurada. Vá em Admin → Configurações → Pagamento.' }, { status: 500 });
    }

    const result = await createCheckoutLink({
      handle,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pedido=${pedidoId}`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/infinitepay/webhook`,
      order_nsu: pedidoId,
      items: items.map((item: { nome: string; quantidade: number; preco: number }) => ({
        description: item.nome,
        quantity: item.quantidade,
        price: Math.round(item.preco * 100),
      })),
      customer: {
        name: customer.nome,
        email: customer.email,
        phone_number: (customer.telefone ?? '').replace(/\D/g, ''),
      },
      address: endereco ? {
        cep: (endereco.cep ?? '').replace(/\D/g, ''),
        street: endereco.rua,
        neighborhood: endereco.bairro,
        number: endereco.numero,
        city: endereco.cidade,
        state: endereco.estado,
        complement: endereco.complemento ?? undefined,
      } : undefined,
    });

    await supabase.from('pedidos').update({
      payment_url: result.url,
      metodo_pagamento: 'infinitepay',
    }).eq('id', pedidoId);

    return NextResponse.json({ checkout_url: result.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro InfinitePay';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
