import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import { createClient as createServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { pedidoId, motivo } = await req.json();
    if (!pedidoId) return NextResponse.json({ error: 'pedidoId obrigatório' }, { status: 400 });

    // 🔐 Valida que o pedido pertence ao usuário logado
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const supabase = createClient();

    // Busca pedido e valida dono
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, cliente_id, status, numero, loja_id')
      .eq('id', pedidoId)
      .maybeSingle();

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (pedido.cliente_id !== user.id) {
      return NextResponse.json({ error: 'Você não tem permissão para cancelar este pedido' }, { status: 403 });
    }

    // 🛡️ Só pode cancelar se ainda não foi pago/enviado
    if (!['pendente', 'processando'].includes(pedido.status)) {
      return NextResponse.json({
        error: `Pedido com status "${pedido.status}" não pode mais ser cancelado. Entre em contato com o suporte.`,
      }, { status: 400 });
    }

    // Buscar itens do pedido pra devolver estoque
    const { data: itens } = await supabase
      .from('pedido_itens')
      .select('variante_id, quantidade')
      .eq('pedido_id', pedidoId);

    let unidadesDevolvidas = 0;
    if (itens && itens.length > 0) {
      for (const item of itens) {
        if (!item.variante_id) continue;
        const { data: variante } = await supabase
          .from('produto_variantes')
          .select('estoque')
          .eq('id', item.variante_id)
          .maybeSingle();
        if (variante) {
          await supabase
            .from('produto_variantes')
            .update({ estoque: (variante as { estoque: number }).estoque + item.quantidade })
            .eq('id', item.variante_id);
          unidadesDevolvidas += item.quantidade;
        }
      }
    }

    // Cancela o pedido + registra motivo + data
    const dataAgora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const notaInterna = `🚫 Cancelado pelo cliente em ${dataAgora}\nMotivo: ${motivo || 'Não informado'}\nUnidades devolvidas ao estoque: ${unidadesDevolvidas}`;

    await supabase
      .from('pedidos')
      .update({
        status: 'cancelado',
        nota_interna: notaInterna,
        observacoes: `Cancelado pelo cliente - ${motivo || 'sem motivo informado'}`,
      })
      .eq('id', pedidoId);

    return NextResponse.json({
      ok: true,
      mensagem: 'Pedido cancelado com sucesso',
      motivo,
      unidades_devolvidas: unidadesDevolvidas,
      pedido_numero: pedido.numero,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro',
    }, { status: 500 });
  }
}
