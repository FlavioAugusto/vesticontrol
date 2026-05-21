import { NextResponse } from 'next/server';
import { createClient as createServer } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@/lib/supabase/admin';

const LOJA_DEFAULT = '00000000-0000-0000-0000-000000000001';

/**
 * Dashboard completo com todos os stats da loja
 */
export async function GET() {
  try {
    const server = createServer();
    const { data: { user } } = await server.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const admin = createAdmin();
    const { data: adminRow } = await admin.from('admins').select('loja_id').eq('id', user.id).maybeSingle();
    const { data: superRow } = await admin.from('super_admins').select('id').eq('id', user.id).maybeSingle();
    if (!adminRow && !superRow) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    const lojaId = adminRow?.loja_id || LOJA_DEFAULT;
    const hoje = new Date();
    const dia30 = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dia7 = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Tudo em paralelo
    const [
      pedidosResult,
      clientesResult,
      produtosResult,
      variantesResult,
      lojaInfoResult,
    ] = await Promise.all([
      admin.from('pedidos').select('id, total, status, status_pagamento, numero, created_at, pago_em, cliente_id, clientes(nome, sobrenome)').eq('loja_id', lojaId).order('created_at', { ascending: false }),
      admin.from('clientes').select('id, nome, created_at').eq('loja_id', lojaId),
      admin.from('produtos').select('id, nome, slug, preco, ativo').eq('loja_id', lojaId),
      admin.from('produto_variantes').select('id, produto_id, tamanho, cor, estoque, sku, produtos(nome, slug)').eq('loja_id', lojaId),
      admin.from('lojas').select('nome').eq('id', lojaId).maybeSingle(),
    ]);

    const pedidos = (pedidosResult.data ?? []) as any[];
    const clientes = (clientesResult.data ?? []) as any[];
    const produtos = (produtosResult.data ?? []) as any[];
    const variantes = (variantesResult.data ?? []) as any[];

    // Faturamento
    const pedidosPagos = pedidos.filter(p => ['pago', 'enviado', 'entregue', 'separando'].includes(p.status));
    const faturamentoTotal = pedidosPagos.reduce((s, p) => s + Number(p.total), 0);
    const faturamento30d = pedidosPagos.filter(p => new Date(p.created_at) >= dia30).reduce((s, p) => s + Number(p.total), 0);
    const faturamento7d = pedidosPagos.filter(p => new Date(p.created_at) >= dia7).reduce((s, p) => s + Number(p.total), 0);
    const ticketMedio = pedidosPagos.length > 0 ? faturamentoTotal / pedidosPagos.length : 0;

    // Status breakdown
    const statusCount: Record<string, number> = {};
    pedidos.forEach(p => { statusCount[p.status] = (statusCount[p.status] || 0) + 1; });

    // Faturamento por dia (últimos 30 dias)
    const vendaPorDia: { dia: string; valor: number; pedidos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const diaStr = d.toISOString().split('T')[0];
      const labelDia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const pedidosDoDia = pedidosPagos.filter(p => {
        const data = (p.pago_em || p.created_at) as string;
        return data.startsWith(diaStr);
      });
      vendaPorDia.push({
        dia: labelDia,
        valor: pedidosDoDia.reduce((s, p) => s + Number(p.total), 0),
        pedidos: pedidosDoDia.length,
      });
    }

    // Estoque
    const estoqueCritico = variantes.filter(v => v.estoque > 0 && v.estoque <= 2);
    const estoqueZerado = variantes.filter(v => v.estoque === 0);
    const estoqueOk = variantes.filter(v => v.estoque > 2);
    const totalEstoque = variantes.reduce((s, v) => s + (v.estoque ?? 0), 0);

    // Clientes
    const clientes30d = clientes.filter(c => new Date(c.created_at) >= dia30).length;

    return NextResponse.json({
      loja: lojaInfoResult.data?.nome || 'Sua Loja',
      faturamento: {
        total: faturamentoTotal,
        ultimos30d: faturamento30d,
        ultimos7d: faturamento7d,
        ticketMedio,
      },
      pedidos: {
        total: pedidos.length,
        pagos: pedidosPagos.length,
        pendentes: pedidos.filter(p => p.status === 'pendente').length,
        processando: pedidos.filter(p => p.status === 'processando').length,
        cancelados: pedidos.filter(p => p.status === 'cancelado').length,
        ultimos30d: pedidos.filter(p => new Date(p.created_at) >= dia30).length,
        recentes: pedidos.slice(0, 8),
        statusBreakdown: statusCount,
      },
      clientes: {
        total: clientes.length,
        ultimos30d: clientes30d,
      },
      produtos: {
        total: produtos.length,
        ativos: produtos.filter(p => p.ativo).length,
      },
      estoque: {
        totalVariantes: variantes.length,
        totalUnidades: totalEstoque,
        critico: estoqueCritico.length,
        zerado: estoqueZerado.length,
        ok: estoqueOk.length,
        criticoLista: estoqueCritico.slice(0, 10),
        zeradoLista: estoqueZerado.slice(0, 10),
      },
      vendaPorDia,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}
