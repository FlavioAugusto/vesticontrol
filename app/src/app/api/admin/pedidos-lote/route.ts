import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

interface PedidoItem {
  variante_id: string | null;
  produto_id: string | null;
  quantidade: number;
}

async function devolverEstoque(adminClient: ReturnType<typeof createAdmin>, pedidoIds: string[]) {
  // Busca todos os itens dos pedidos
  const { data: itens, error: itensErr } = await adminClient
    .from('pedido_itens')
    .select('variante_id, produto_id, quantidade, pedido_id')
    .in('pedido_id', pedidoIds);

  if (itensErr) throw new Error('Erro ao buscar itens: ' + itensErr.message);
  if (!itens || itens.length === 0) return { devolvidos: 0 };

  // Agrupa quantidade por variante_id para devolver estoque
  const porVariante = new Map<string, number>();
  for (const item of itens as (PedidoItem & { pedido_id: string })[]) {
    if (!item.variante_id) continue;
    porVariante.set(item.variante_id, (porVariante.get(item.variante_id) ?? 0) + Number(item.quantidade));
  }

  let devolvidos = 0;
  for (const [varianteId, qtd] of porVariante.entries()) {
    // Busca estoque atual e incrementa
    const { data: v, error: vErr } = await adminClient
      .from('produto_variantes')
      .select('estoque')
      .eq('id', varianteId)
      .maybeSingle();

    if (vErr || !v) continue;

    const novoEstoque = (Number(v.estoque) || 0) + qtd;
    await adminClient
      .from('produto_variantes')
      .update({ estoque: novoEstoque })
      .eq('id', varianteId);

    devolvidos += qtd;
  }

  return { devolvidos };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { acao, pedidoIds, devolverAoEstoque = true } = await req.json();

    if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum pedido selecionado' }, { status: 400 });
    }

    if (!['cancelar', 'excluir'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const adminClient = createAdmin();

    // Verifica status atuais — só devolve estoque de pedidos que NÃO estavam já cancelados
    const { data: pedidos } = await adminClient
      .from('pedidos')
      .select('id, status')
      .in('id', pedidoIds);

    const pedidosParaDevolver = (pedidos ?? [])
      .filter((p) => p.status !== 'cancelado')
      .map((p) => p.id);

    let resultadoEstoque = { devolvidos: 0 };
    if (devolverAoEstoque && pedidosParaDevolver.length > 0) {
      resultadoEstoque = await devolverEstoque(adminClient, pedidosParaDevolver);
    }

    if (acao === 'cancelar') {
      const { error } = await adminClient
        .from('pedidos')
        .update({ status: 'cancelado', updated_at: new Date().toISOString() })
        .in('id', pedidoIds);
      if (error) return NextResponse.json({ error: 'Erro ao cancelar: ' + error.message }, { status: 500 });
    } else {
      // Excluir — primeiro itens, depois pedidos (FK)
      await adminClient.from('pedido_itens').delete().in('pedido_id', pedidoIds);
      const { error } = await adminClient.from('pedidos').delete().in('id', pedidoIds);
      if (error) return NextResponse.json({ error: 'Erro ao excluir: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      acao,
      pedidos_afetados: pedidoIds.length,
      itens_devolvidos: resultadoEstoque.devolvidos,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
