import { NextRequest, NextResponse } from 'next/server';
import { createMercadoPagoPreference } from '@/lib/mercadopago';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, items, payer, frete } = await req.json();

    const preference = await createMercadoPagoPreference({
      items: items.map((item: { produto_id: string; nome_produto: string; quantidade: number; preco_unitario: number }) => ({
        id: item.produto_id,
        title: item.nome_produto,
        quantity: item.quantidade,
        unit_price: Number(item.preco_unitario),
      })),
      payer: {
        name: payer.nome,
        email: payer.email,
        identification: { type: 'CPF', number: payer.cpf.replace(/\D/g, '') },
      },
      shipments: frete ? { cost: frete, mode: 'not_specified' } : undefined,
      external_reference: pedidoId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?erro=pagamento`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso?pendente=true`,
      },
    });

    const supabase = createClient();
    await supabase.from('pedidos').update({
      payment_id: preference.id,
      payment_url: preference.init_point,
      metodo_pagamento: 'mercadopago',
    }).eq('id', pedidoId);

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
