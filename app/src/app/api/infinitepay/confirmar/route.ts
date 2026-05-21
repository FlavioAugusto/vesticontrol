import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { checkPayment } from '@/lib/infinitepay';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, transaction_nsu, slug, capture_method, confirmacaoManual } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: 'pedidoId obrigatório' }, { status: 400 });

    const supabase = createClient();
    const lojaId = headers().get('x-loja-id') || '00000000-0000-0000-0000-000000000001';

    // 🟢 CONFIRMAÇÃO MANUAL: cliente diz que já pagou — marca como aguardando validação manual
    // O admin precisa verificar no painel InfinitePay e confirmar realmente.
    if (confirmacaoManual) {
      const { error } = await supabase.from('pedidos').update({
        status_pagamento: 'aguardando_confirmacao_manual',
        status: 'processando',
        observacoes: '⚠️ CLIENTE confirmou que JÁ PAGOU — validar no painel InfinitePay antes de enviar',
        updated_at: new Date().toISOString(),
      }).eq('id', pedidoId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 📦 Debita o estoque agora (reserva os itens enquanto admin valida pagamento)
      const { data: itens } = await supabase
        .from('pedido_itens')
        .select('variante_id, quantidade')
        .eq('pedido_id', pedidoId);

      if (itens && itens.length > 0) {
        for (const item of itens as { variante_id: string | null; quantidade: number }[]) {
          if (!item.variante_id) continue;
          const { data: variante } = await supabase
            .from('produto_variantes')
            .select('estoque')
            .eq('id', item.variante_id)
            .maybeSingle();
          if (variante && typeof (variante as { estoque: number }).estoque === 'number') {
            const novoEstoque = Math.max(0, (variante as { estoque: number }).estoque - item.quantidade);
            await supabase
              .from('produto_variantes')
              .update({ estoque: novoEstoque })
              .eq('id', item.variante_id);
          }
        }
      }

      return NextResponse.json({ ok: true, manual: true, estoque_debitado: true });
    }

    const { data: configHandle } = await supabase.from('configuracoes')
      .select('valor').eq('chave', 'infinitepay_handle').eq('loja_id', lojaId).maybeSingle();
    const handle = configHandle?.valor || process.env.INFINITEPAY_HANDLE;
    if (!handle) return NextResponse.json({ ok: true });

    const result = await checkPayment({
      handle,
      order_nsu: pedidoId,
      transaction_nsu: transaction_nsu || undefined,
      slug: slug || undefined,
    });

    if (result.paid) {
      await supabase.from('pedidos').update({
        status_pagamento: 'approved',
        status: 'pago',
        payment_id: transaction_nsu || slug || null,
        metodo_pagamento: `infinitepay_${capture_method || 'checkout'}`,
        pago_em: new Date().toISOString(),
      }).eq('id', pedidoId);
    }

    return NextResponse.json({ ok: true, paid: result.paid });
  } catch (error: unknown) {
    console.error('[InfinitePay Confirmar]', error);
    return NextResponse.json({ ok: true });
  }
}
