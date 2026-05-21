'use client';

import { useState, useEffect } from 'react';
import { useLojaAdmin } from '@/hooks/useLojaAdmin';
import { formatPrice } from '@/lib/utils';
import { Search, Eye, Trash2, Download, Calendar, Package, Clock, CheckCircle, XCircle, Truck, X, Ban, CheckSquare, Square, RefreshCw, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface PedidoItem { id: string; nome_produto: string; tamanho: string; cor: string; quantidade: number; preco_unitario: number; subtotal: number }
interface Pedido {
  id: string; numero: number; status: string; total: number; subtotal: number; frete: number; desconto: number;
  metodo_pagamento: string; created_at: string; pago_em: string | null; enviado_em: string | null;
  codigo_rastreio: string | null; cupom_codigo: string | null; observacoes: string | null;
  melhorenvio_order_id?: string | null;
  melhorenvio_print_url?: string | null;
  clientes: { nome: string; sobrenome: string | null; telefone: string | null } | null;
  pedido_itens?: PedidoItem[];
}

const STATUS_CONFIG: Record<string, { label: string; cor: string; icon: any; bg: string }> = {
  pendente:    { label: 'Pendente',    cor: 'text-amber-700',   icon: Clock,         bg: 'bg-amber-50 border-amber-200' },
  processando: { label: 'Processando', cor: 'text-blue-700',    icon: Clock,         bg: 'bg-blue-50 border-blue-200' },
  pago:        { label: 'Pago',        cor: 'text-emerald-700', icon: CheckCircle,   bg: 'bg-emerald-50 border-emerald-200' },
  separando:   { label: 'Separando',  cor: 'text-purple-700',  icon: Package,       bg: 'bg-purple-50 border-purple-200' },
  enviado:     { label: 'Enviado',     cor: 'text-indigo-700',  icon: Truck,         bg: 'bg-indigo-50 border-indigo-200' },
  entregue:    { label: 'Entregue',   cor: 'text-teal-700',    icon: CheckCircle,   bg: 'bg-teal-50 border-teal-200' },
  cancelado:   { label: 'Cancelado',  cor: 'text-red-700',     icon: XCircle,       bg: 'bg-red-50 border-red-200' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoRapido, setPeriodoRapido] = useState('todos');
  const [pedidoAberto, setPedidoAberto] = useState<Pedido | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [acaoLote, setAcaoLote] = useState<'cancelar' | 'excluir' | null>(null);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [gerandoEtiqueta, setGerandoEtiqueta] = useState(false);

  async function gerarEtiqueta(pedidoId: string) {
    if (gerandoEtiqueta) return;
    if (!confirm('Gerar etiqueta no Melhor Envio?\n\n⚠️ Isso vai debitar créditos da sua conta Melhor Envio.\nContinuar?')) return;
    setGerandoEtiqueta(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/gerar-etiqueta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servico_id: 1, peso_kg: 0.5 }), // PAC, 500g
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar etiqueta');

      toast.success(data.ja_gerada
        ? `Etiqueta já existia — código: ${data.trackingCode || 'aguardando'}`
        : `Etiqueta gerada! Código: ${data.trackingCode || 'aguardando'}`,
        { duration: 6000 });

      // Atualiza UI
      if (pedidoAberto?.id === pedidoId) {
        setPedidoAberto(prev => prev ? {
          ...prev,
          codigo_rastreio: data.trackingCode || prev.codigo_rastreio,
          melhorenvio_order_id: data.melhorenvioOrderId || null,
          melhorenvio_print_url: data.printUrl || null,
        } : prev);
      }
      setPedidos(prev => prev.map(p => p.id === pedidoId ? {
        ...p,
        codigo_rastreio: data.trackingCode || p.codigo_rastreio,
        melhorenvio_order_id: data.melhorenvioOrderId || null,
        melhorenvio_print_url: data.printUrl || null,
      } : p));

      // Abre o PDF da etiqueta automaticamente
      if (data.printUrl) {
        window.open(data.printUrl, '_blank');
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar etiqueta', { duration: 8000 });
    } finally {
      setGerandoEtiqueta(false);
    }
  }

  const { lojaId } = useLojaAdmin();
  useEffect(() => { if (lojaId) carregar(); }, [lojaId]);

  async function carregar() {
    setLoading(true);
    try {
      // API server-side com service role (bypassa RLS)
      const res = await fetch('/api/admin/listar-pedidos', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar pedidos');
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data as Pedido[] : []);
    } catch { toast.error('Erro ao carregar pedidos'); }
    finally { setLoading(false); }
  }

  async function abrirPedido(p: Pedido) {
    setPedidoAberto({ ...p, pedido_itens: [] });
    setLoadingDetalhes(true);
    try {
      const s = createClient();
      const { data } = await s.from('pedido_itens').select('*').eq('pedido_id', p.id);
      setPedidoAberto({ ...p, pedido_itens: (data ?? []) as PedidoItem[] });
    } catch {} finally { setLoadingDetalhes(false); }
  }

  async function excluirPedido(id: string) {
    try {
      const res = await fetch('/api/admin/pedidos-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'excluir', pedidoIds: [id], devolverAoEstoque: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPedidos(prev => prev.filter(p => p.id !== id));
      setConfirmExcluir(null);
      if (pedidoAberto?.id === id) setPedidoAberto(null);
      toast.success(data.itens_devolvidos > 0
        ? `Pedido excluído · ${data.itens_devolvidos} unidades devolvidas ao estoque`
        : 'Pedido excluído'
      );
    } catch { toast.error('Erro ao excluir pedido'); }
  }

  function toggleSelecao(id: string) {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function toggleSelecionarTodos() {
    if (selecionados.size === filtrados.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtrados.map(p => p.id)));
    }
  }

  async function sincronizarPedidos(ids: string[]) {
    if (ids.length === 0) { toast.error('Nenhum pedido para sincronizar'); return; }
    setSincronizando(true);
    const loadingToast = toast.loading(`Verificando ${ids.length} pedido(s) no gateway...`);
    try {
      const res = await fetch('/api/admin/pedidos-sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoIds: ids }),
      });
      const data = await res.json();
      toast.dismiss(loadingToast);
      if (!res.ok) throw new Error(data.error);

      if (data.atualizados > 0) {
        toast.success(`${data.atualizados} pedido(s) atualizado(s) automaticamente!`);
        await carregar();
      } else {
        toast.success(`${data.total} pedido(s) verificados — nenhum mudou de status`);
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : 'Erro ao sincronizar');
    } finally {
      setSincronizando(false);
    }
  }

  async function executarAcaoLote(acao: 'cancelar' | 'excluir') {
    const ids = Array.from(selecionados);
    if (ids.length === 0) { toast.error('Selecione ao menos um pedido'); return; }
    setProcessandoLote(true);
    try {
      const res = await fetch('/api/admin/pedidos-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, pedidoIds: ids, devolverAoEstoque: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (acao === 'excluir') {
        setPedidos(prev => prev.filter(p => !selecionados.has(p.id)));
      } else {
        setPedidos(prev => prev.map(p => selecionados.has(p.id) ? { ...p, status: 'cancelado' } : p));
      }
      setSelecionados(new Set());
      setAcaoLote(null);

      const msg = acao === 'cancelar'
        ? `${data.pedidos_afetados} pedido(s) cancelado(s)`
        : `${data.pedidos_afetados} pedido(s) excluído(s)`;
      const estoqueMsg = data.itens_devolvidos > 0 ? ` · ${data.itens_devolvidos} unidades devolvidas ao estoque` : '';
      toast.success(msg + estoqueMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao processar');
    } finally {
      setProcessandoLote(false);
    }
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    setAtualizandoStatus(true);
    try {
      // Se estiver cancelando, usa a API de lote para devolver estoque
      const statusAtual = pedidos.find(p => p.id === id)?.status;
      if (novoStatus === 'cancelado' && statusAtual !== 'cancelado') {
        const res = await fetch('/api/admin/pedidos-lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acao: 'cancelar', pedidoIds: [id], devolverAoEstoque: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelado' } : p));
        if (pedidoAberto?.id === id) setPedidoAberto(prev => prev ? { ...prev, status: 'cancelado' } : prev);
        toast.success(data.itens_devolvidos > 0
          ? `Pedido cancelado · ${data.itens_devolvidos} unidades devolvidas ao estoque`
          : 'Pedido cancelado'
        );
      } else {
        const s = createClient();
        await s.from('pedidos').update({ status: novoStatus, ...(novoStatus === 'pago' ? { pago_em: new Date().toISOString() } : novoStatus === 'enviado' ? { enviado_em: new Date().toISOString() } : {}) }).eq('id', id).eq('loja_id', lojaId!);
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus } : p));
        if (pedidoAberto?.id === id) setPedidoAberto(prev => prev ? { ...prev, status: novoStatus } : prev);
        toast.success(`Status atualizado para: ${novoStatus}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status');
    }
    finally { setAtualizandoStatus(false); }
  }

  function aplicarPeriodoRapido(periodo: string) {
    setPeriodoRapido(periodo);
    const hoje = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (periodo === 'hoje') { setDataInicio(fmt(hoje)); setDataFim(fmt(hoje)); }
    else if (periodo === '7d') { const d = new Date(hoje); d.setDate(d.getDate() - 7); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else if (periodo === '30d') { const d = new Date(hoje); d.setDate(d.getDate() - 30); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else if (periodo === 'mes') { const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else { setDataInicio(''); setDataFim(''); }
  }

  const filtrados = pedidos.filter(p => {
    const matchBusca = !busca || p.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) || String(p.numero).includes(busca);
    const matchStatus = statusFiltro === 'todos' || p.status === statusFiltro;
    const data = new Date(p.created_at);
    const matchDataInicio = !dataInicio || data >= new Date(dataInicio + 'T00:00:00');
    const matchDataFim = !dataFim || data <= new Date(dataFim + 'T23:59:59');
    return matchBusca && matchStatus && matchDataInicio && matchDataFim;
  });

  // Stats
  const stats = {
    total: filtrados.length,
    pendente: filtrados.filter(p => p.status === 'pendente').length,
    pago: filtrados.filter(p => p.status === 'pago').length,
    enviado: filtrados.filter(p => p.status === 'enviado').length,
    entregue: filtrados.filter(p => p.status === 'entregue').length,
    cancelado: filtrados.filter(p => p.status === 'cancelado').length,
    faturamento: filtrados.filter(p => ['pago','enviado','entregue'].includes(p.status)).reduce((s, p) => s + Number(p.total), 0),
  };

  function imprimirPDF() {
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Pedidos</title><style>
      body{font-family:sans-serif;padding:20px;font-size:12px}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase}
      .badge{padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600}
    </style></head><body>
    <h1>Relatório de Pedidos</h1>
    <p>Período: ${dataInicio || 'Todos'} ${dataFim ? `até ${dataFim}` : ''} · Status: ${statusFiltro} · Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    <table><thead><tr><th>#</th><th>Cliente</th><th>Status</th><th>Total</th><th>Data</th></tr></thead><tbody>
    ${filtrados.map(p => `<tr><td>#${p.numero}</td><td>${p.clientes?.nome ?? '—'}</td><td>${p.status}</td><td>${formatPrice(Number(p.total))}</td><td>${formatDate(p.created_at)}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin-top:16px"><strong>Total de pedidos:</strong> ${filtrados.length} · <strong>Faturamento:</strong> ${formatPrice(stats.faturamento)}</p>
    </body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal">Pedidos</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{filtrados.length} de {pedidos.length} pedidos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/pedidos/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-500/20"
            title="Ver dashboard com gráficos animados">
            <BarChart3 size={14} /> Dashboard
          </Link>
          <button
            onClick={() => {
              const idsParaSincronizar = pedidos
                .filter(p => ['pendente', 'processando'].includes(p.status))
                .map(p => p.id);
              if (idsParaSincronizar.length === 0) {
                toast('Nenhum pedido pendente para sincronizar', { icon: 'ℹ️' });
                return;
              }
              sincronizarPedidos(idsParaSincronizar);
            }}
            disabled={sincronizando}
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
            title="Consulta o gateway de pagamento para atualizar status de pedidos pendentes"
          >
            <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button onClick={imprimirPDF} className="inline-flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-charcoal-light transition-all">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Stats por status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        {[
          { key: 'todos', label: 'Todos', val: stats.total, cor: 'bg-gray-100 text-gray-700' },
          { key: 'pendente', label: 'Pendentes', val: stats.pendente, cor: 'bg-amber-100 text-amber-700' },
          { key: 'pago', label: 'Pagos', val: stats.pago, cor: 'bg-emerald-100 text-emerald-700' },
          { key: 'enviado', label: 'Enviados', val: stats.enviado, cor: 'bg-indigo-100 text-indigo-700' },
          { key: 'entregue', label: 'Entregues', val: stats.entregue, cor: 'bg-teal-100 text-teal-700' },
          { key: 'cancelado', label: 'Cancelados', val: stats.cancelado, cor: 'bg-red-100 text-red-700' },
        ].map(s => (
          <button key={s.key} onClick={() => setStatusFiltro(s.key)}
            className={`p-3 rounded-xl text-left transition-all border-2 ${statusFiltro === s.key ? 'border-gold shadow-sm' : 'border-transparent'} ${s.cor}`}>
            <p className="text-lg font-bold leading-tight">{s.val}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider">{s.label}</p>
          </button>
        ))}
        <div className="p-3 rounded-xl bg-gold/10 text-gold col-span-2 sm:col-span-1">
          <p className="text-sm font-bold leading-tight truncate">{formatPrice(stats.faturamento)}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider">Faturamento</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 mb-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente ou nº do pedido..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold/50 transition-all" />
          </div>
          {/* Período rápido */}
          {['todos','hoje','7d','30d','mes'].map(p => (
            <button key={p} onClick={() => aplicarPeriodoRapido(p)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${periodoRapido === p ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p === 'todos' ? 'Todos' : p === 'hoje' ? 'Hoje' : p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Este mês'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Calendar size={13} className="text-gray-400" />
          <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodoRapido('custom'); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gold/50" />
          <span className="text-gray-400 text-xs">até</span>
          <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodoRapido('custom'); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gold/50" />
          {(dataInicio || dataFim || busca) && (
            <button onClick={() => { setBusca(''); setDataInicio(''); setDataFim(''); setPeriodoRapido('todos'); }}
              className="text-xs text-red-500 hover:underline flex items-center gap-1">
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Barra de ação em lote */}
      {selecionados.size > 0 && (
        <div className="bg-gold/10 border-2 border-gold/30 rounded-2xl p-3 mb-3 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-gold" />
            <span className="text-sm font-semibold text-charcoal">
              {selecionados.size} pedido(s) selecionado(s)
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelecionados(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={() => sincronizarPedidos(Array.from(selecionados))}
              disabled={sincronizando}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={sincronizando ? 'animate-spin' : ''} /> Sincronizar selecionados
            </button>
            <button
              onClick={() => setAcaoLote('cancelar')}
              disabled={processandoLote}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Ban size={12} /> Cancelar selecionados
            </button>
            <button
              onClick={() => setAcaoLote('excluir')}
              disabled={processandoLote}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 size={12} /> Excluir selecionados
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Carregando pedidos...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <Package size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum pedido encontrado com os filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-3 py-3 w-10">
                    <button
                      onClick={toggleSelecionarTodos}
                      className="text-gray-400 hover:text-gold transition-colors"
                      title={selecionados.size === filtrados.length ? 'Desmarcar todos' : 'Marcar todos'}
                    >
                      {selecionados.size === filtrados.length && filtrados.length > 0
                        ? <CheckSquare size={16} className="text-gold" />
                        : <Square size={16} />
                      }
                    </button>
                  </th>
                  {['#', 'Cliente', 'Status', 'Total', 'Data', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => {
                  const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pendente;
                  const Icon = sc.icon;
                  return (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${selecionados.has(p.id) ? 'bg-gold/5' : ''}`}>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleSelecao(p.id)}
                          className="text-gray-400 hover:text-gold transition-colors"
                        >
                          {selecionados.has(p.id)
                            ? <CheckSquare size={16} className="text-gold" />
                            : <Square size={16} />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-charcoal text-sm bg-gray-100 px-2 py-1 rounded-lg">#{p.numero}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal text-sm">{p.clientes?.nome ?? '—'}</p>
                        <p className="text-[11px] text-gray-400">{p.clientes?.telefone ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${sc.bg} ${sc.cor}`}>
                          <Icon size={11} /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gold whitespace-nowrap">{formatPrice(Number(p.total))}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => abrirPedido(p)} title="Ver detalhes"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => setConfirmExcluir(p.id)} title="Excluir pedido"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detalhes do Pedido */}
      {pedidoAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPedidoAberto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-lg text-charcoal">Pedido #{pedidoAberto.numero}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(pedidoAberto.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => sincronizarPedidos([pedidoAberto.id])}
                  disabled={sincronizando}
                  title="Sincronizar status com gateway de pagamento"
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setConfirmExcluir(pedidoAberto.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 size={16} /></button>
                <button onClick={() => setPedidoAberto(null)}
                  className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors"><X size={16} /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Status + alterar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status do pedido</p>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                    🔄 Auto via gateway
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, sc]) => (
                    <button key={key} disabled={atualizandoStatus} onClick={() => atualizarStatus(pedidoAberto.id, key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${pedidoAberto.status === key ? `${sc.bg} ${sc.cor} ring-2 ring-offset-1 ring-gold` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {sc.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  💡 O status é atualizado automaticamente quando o gateway confirma o pagamento. Use o botão ⟳ acima para sincronizar manualmente.
                </p>
              </div>

              {/* Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
                  <p className="font-semibold text-charcoal">{pedidoAberto.clientes?.nome ?? '—'} {pedidoAberto.clientes?.sobrenome ?? ''}</p>
                  <p className="text-xs text-gray-500">{pedidoAberto.clientes?.telefone ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Pagamento</p>
                  <p className="font-semibold text-charcoal capitalize">{pedidoAberto.metodo_pagamento ?? '—'}</p>
                  {pedidoAberto.cupom_codigo && <p className="text-xs text-gold">Cupom: {pedidoAberto.cupom_codigo}</p>}
                </div>
              </div>

              {/* 📦 ETIQUETA MELHOR ENVIO */}
              {['pago', 'separando', 'enviado'].includes(pedidoAberto.status) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">📦 Envio (Melhor Envio)</p>
                    {pedidoAberto.codigo_rastreio && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        ✓ Etiqueta gerada
                      </span>
                    )}
                  </div>

                  {pedidoAberto.codigo_rastreio ? (
                    <>
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Código de Rastreio</p>
                        <p className="font-mono text-sm font-bold text-charcoal break-all">{pedidoAberto.codigo_rastreio}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pedidoAberto.melhorenvio_print_url && (
                          <a href={pedidoAberto.melhorenvio_print_url} target="_blank" rel="noopener"
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center transition-colors">
                            🖨️ Imprimir Etiqueta PDF
                          </a>
                        )}
                        <a href={`https://www.melhorrastreio.com.br/rastreio/${pedidoAberto.codigo_rastreio}`} target="_blank" rel="noopener"
                          className="flex-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-xs font-semibold py-2 px-3 rounded-lg text-center transition-colors">
                          🔍 Rastrear Envio
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-amber-700 mb-3">
                        Gere a etiqueta do Melhor Envio com 1 clique. O sistema vai debitar créditos da sua conta ME e gerar o PDF pra impressão.
                      </p>
                      <button onClick={() => gerarEtiqueta(pedidoAberto.id)}
                        disabled={gerandoEtiqueta}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                        {gerandoEtiqueta ? (
                          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gerando...</>
                        ) : (
                          <>📦 Gerar Etiqueta Melhor Envio</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Itens */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Itens do pedido</p>
                {loadingDetalhes ? (
                  <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" /></div>
                ) : (
                  <div className="space-y-2">
                    {(pedidoAberto.pedido_itens ?? []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-cream/30 border border-cream-darker rounded-xl p-3">
                        <div>
                          <p className="font-semibold text-charcoal text-sm">{item.nome_produto}</p>
                          <p className="text-xs text-gray-500">{item.tamanho}{item.cor ? ` · ${item.cor}` : ''} · {item.quantidade} un.</p>
                        </div>
                        <p className="font-bold text-charcoal">{formatPrice(Number(item.subtotal))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totais */}
              <div className="border-t border-gray-100 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatPrice(Number(pedidoAberto.subtotal))}</span></div>
                {Number(pedidoAberto.frete) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Frete</span><span>{formatPrice(Number(pedidoAberto.frete))}</span></div>}
                {Number(pedidoAberto.desconto) > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-{formatPrice(Number(pedidoAberto.desconto))}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
                  <span>Total</span><span className="text-gold">{formatPrice(Number(pedidoAberto.total))}</span>
                </div>
              </div>

              {/* Rastreio */}
              {pedidoAberto.codigo_rastreio && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Código de rastreio</p>
                  <p className="font-mono text-sm text-charcoal">{pedidoAberto.codigo_rastreio}</p>
                </div>
              )}

              {/* Observações */}
              {pedidoAberto.observacoes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Observações</p>
                  <p className="text-sm text-charcoal">{pedidoAberto.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar ação em lote */}
      {acaoLote && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !processandoLote && setAcaoLote(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${acaoLote === 'cancelar' ? 'bg-amber-50' : 'bg-red-50'}`}>
              {acaoLote === 'cancelar'
                ? <Ban size={20} className="text-amber-500" />
                : <Trash2 size={20} className="text-red-500" />
              }
            </div>
            <h3 className="font-semibold text-charcoal text-lg mb-2">
              {acaoLote === 'cancelar' ? 'Cancelar' : 'Excluir'} {selecionados.size} pedido(s)?
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {acaoLote === 'cancelar'
                ? 'Os pedidos serão marcados como cancelados e permanecerão no histórico.'
                : 'Os pedidos serão removidos permanentemente do sistema.'
              }
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-emerald-700">
                ✓ Os produtos serão devolvidos ao estoque automaticamente
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => executarAcaoLote(acaoLote)}
                disabled={processandoLote}
                className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${acaoLote === 'cancelar' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {processandoLote
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processando...</>
                  : <>{acaoLote === 'cancelar' ? <><Ban size={14} /> Cancelar pedidos</> : <><Trash2 size={14} /> Excluir pedidos</>}</>
                }
              </button>
              <button
                onClick={() => setAcaoLote(null)}
                disabled={processandoLote}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmExcluir && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmExcluir(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-charcoal text-lg mb-2">Excluir pedido?</h3>
            <p className="text-sm text-gray-400 mb-2">Esta ação não pode ser desfeita. O pedido será removido permanentemente.</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5">
              <p className="text-xs font-semibold text-emerald-700">
                ✓ Os produtos serão devolvidos ao estoque automaticamente
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => excluirPedido(confirmExcluir)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600">Excluir</button>
              <button onClick={() => setConfirmExcluir(null)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
