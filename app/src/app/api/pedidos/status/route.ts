import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const pedidoId = req.nextUrl.searchParams.get('pedidoId');
    if (!pedidoId) return NextResponse.json({ error: 'pedidoId obrigatório' }, { status: 400 });

    const supabase = createClient();
    const { data } = await supabase
      .from('pedidos')
      .select('id, numero, status, status_pagamento, total, pago_em')
      .eq('id', pedidoId)
      .maybeSingle();

    if (!data) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

    const pago = ['pago', 'enviado', 'entregue', 'separando'].includes((data as { status: string }).status);
    const cancelado = ['cancelado', 'reembolsado'].includes((data as { status: string }).status);

    return NextResponse.json({
      pedido: data,
      pago,
      cancelado,
      em_andamento: !pago && !cancelado,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
