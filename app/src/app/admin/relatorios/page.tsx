'use client';

import { useState, useEffect } from 'react';
import { useLojaAdmin } from '@/hooks/useLojaAdmin';
import { formatPrice } from '@/lib/utils';
import { Download, TrendingUp, ShoppingBag, Users, Package, DollarSign, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface Pedido { id: string; total: number; status: string; created_at: string; clientes: { nome: string } | null; pedido_itens: { nome_produto: string; quantidade: number; preco_unitario: number }[] }
interface ProdutoVenda { nome: string; quantidade: number; faturamento: number }

function formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }

export default function AdminRelatoriosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoRapido, setPeriodoRapido] = useState('30d');

  const { lojaId } = useLojaAdmin();

  useEffect(() => { aplicarPeriodo('30d'); }, []);

  function aplicarPeriodo(periodo: string) {
    setPeriodoRapido(periodo);
    const hoje = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (periodo === 'hoje') { setDataInicio(fmt(hoje)); setDataFim(fmt(hoje)); }
    else if (periodo === '7d') { const d = new Date(hoje); d.setDate(d.getDate() - 7); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else if (periodo === '30d') { const d = new Date(hoje); d.setDate(d.getDate() - 30); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else if (periodo === 'mes') { const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else if (periodo === 'ano') { const d = new Date(hoje.getFullYear(), 0, 1); setDataInicio(fmt(d)); setDataFim(fmt(hoje)); }
    else { setDataInicio(''); setDataFim(''); }
  }

  useEffect(() => { if (lojaId && (dataInicio || !dataFim)) carregar(); }, [dataInicio, dataFim, lojaId]);

  async function carregar() {
    if (!lojaId) return;
    setLoading(true);
    try {
      const s = createClient();
      let q = s.from('pedidos').eq('loja_id', lojaId).select('id, total, status, created_at, clientes(nome), pedido_itens(nome_produto, quantidade, preco_unitario)');
      if (dataInicio) q = q.gte('created_at', dataInicio + 'T00:00:00');
      if (dataFim) q = q.lte('created_at', dataFim + 'T23:59:59');
      const { data } = await q.order('created_at', { ascending: false });
      setPedidos((data ?? []) as Pedido[]);
    } catch { toast.error('Erro ao carregar relatórios'); }
    finally { setLoading(false); }
  }

  // Calcular stats
  const pagos = pedidos.filter(p => ['pago','enviado','entregue'].includes(p.status));
  const faturamento = pagos.reduce((s, p) => s + Number(p.total), 0);
  const totalPedidos = pedidos.length;
  const ticketMedio = pagos.length > 0 ? faturamento / pagos.length : 0;
  const cancelados = pedidos.filter(p => p.status === 'cancelado').length;
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;

  // Produtos mais vendidos
  const produtoMap: Record<string, ProdutoVenda> = {};
  pagos.forEach(p => {
    (p.pedido_itens ?? []).forEach(i => {
      if (!produtoMap[i.nome_produto]) produtoMap[i.nome_produto] = { nome: i.nome_produto, quantidade: 0, faturamento: 0 };
      produtoMap[i.nome_produto].quantidade += i.quantidade;
      produtoMap[i.nome_produto].faturamento += i.quantidade * Number(i.preco_unitario);
    });
  });
  const maisVendidos = Object.values(produtoMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);

  // Faturamento por dia
  const porDia: Record<string, number> = {};
  pagos.forEach(p => {
    const dia = p.created_at.split('T')[0];
    porDia[dia] = (porDia[dia] ?? 0) + Number(p.total);
  });
  const diasOrdenados = Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDia = Math.max(...diasOrdenados.map(d => d[1]), 1);

  function exportarPDF() {
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Relatório</title><style>
      body{font-family:sans-serif;padding:20px;font-size:12px}
      h1{font-size:20px;margin-bottom:4px}p{color:#666;margin-bottom:12px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .stat{border:1px solid #ddd;padding:12px;border-radius:8px}
      .stat-val{font-size:20px;font-weight:bold;color:#b89155}
      .stat-label{font-size:10px;color:#666;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase}
      h2{font-size:14px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    </style></head><body>
    <h1>Relatório de Vendas</h1>
    <p>Período: ${dataInicio || 'Todos'} ${dataFim ? `até ${dataFim}` : ''} · Gerado: ${new Date().toLocaleString('pt-BR')}</p>
    <div class="stats">
      <div class="stat"><div class="stat-val">${formatPrice(faturamento)}</div><div class="stat-label">Faturamento</div></div>
      <div class="stat"><div class="stat-val">${pagos.length}</div><div class="stat-label">Pedidos Pagos</div></div>
      <div class="stat"><div class="stat-val">${formatPrice(ticketMedio)}</div><div class="stat-label">Ticket Médio</div></div>
      <div class="stat"><div class="stat-val">${cancelados}</div><div class="stat-label">Cancelados</div></div>
    </div>
    <h2>Produtos Mais Vendidos</h2>
    <table><thead><tr><th>Produto</th><th>Qtd</th><th>Faturamento</th></tr></thead><tbody>
    ${maisVendidos.map(p => `<tr><td>${p.nome}</td><td>${p.quantidade}</td><td>${formatPrice(p.faturamento)}</td></tr>`).join('')}
    </tbody></table>
    <h2>Todos os Pedidos</h2>
    <table><thead><tr><th>#</th><th>Cliente</th><th>Status</th><th>Total</th><th>Data</th></tr></thead><tbody>
    ${pedidos.map(p => `<tr><td>#N/A</td><td>${p.clientes?.nome ?? '—'}</td><td>${p.status}</td><td>${formatPrice(Number(p.total))}</td><td>${formatDate(p.created_at)}</td></tr>`).join('')}
    </tbody></table>
    </body></html>`);
    w.document.close(); w.print();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal">Relatórios</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Análise de vendas e desempenho</p>
        </div>
        <button onClick={exportarPDF} className="inline-flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-charcoal-light">
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {/* Filtros de período */}
      <div className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { key:'hoje', label:'Hoje' }, { key:'7d', label:'7 dias' },
            { key:'30d', label:'30 dias' }, { key:'mes', label:'Este mês' },
            { key:'ano', label:'Este ano' }, { key:'todos', label:'Todos' },
          ].map(p => (
            <button key={p.key} onClick={() => aplicarPeriodo(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${periodoRapido === p.key ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={dataInicio} onChange={e => { setDataInicio(e.target.value); setPeriodoRapido('custom'); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gold/50" />
            <span className="text-gray-400 text-xs">–</span>
            <input type="date" value={dataFim} onChange={e => { setDataFim(e.target.value); setPeriodoRapido('custom'); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gold/50" />
            <button onClick={carregar} className="bg-gold text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gold-600">Aplicar</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { label: 'Faturamento', val: formatPrice(faturamento), icon: DollarSign, cor: 'bg-amber-100 text-gold' },
              { label: 'Pedidos pagos', val: pagos.length, icon: ShoppingBag, cor: 'bg-emerald-100 text-emerald-600' },
              { label: 'Ticket médio', val: formatPrice(ticketMedio), icon: TrendingUp, cor: 'bg-blue-100 text-blue-600' },
              { label: 'Cancelados', val: cancelados, icon: X, cor: 'bg-red-100 text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${s.cor} flex items-center justify-center mb-3`}>
                  <s.icon size={18} strokeWidth={2} />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-charcoal">{s.val}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Gráfico de barras — faturamento por dia */}
          {diasOrdenados.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
              <h3 className="font-semibold text-charcoal text-sm mb-4">Faturamento por dia</h3>
              <div className="flex items-end gap-1 h-32 overflow-x-auto">
                {diasOrdenados.map(([dia, val]) => (
                  <div key={dia} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 32 }}>
                    <div className="relative group flex-shrink-0" style={{ width: 28, height: 112 }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-gold rounded-t-sm transition-all"
                        style={{ height: `${(val / maxDia) * 100}%` }} />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-charcoal text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {formatPrice(val)}
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-400 text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 36 }}>
                      {new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos mais vendidos */}
          {maisVendidos.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
              <h3 className="font-semibold text-charcoal text-sm mb-4">Top 10 — Produtos mais vendidos</h3>
              <div className="space-y-2">
                {maisVendidos.map((p, i) => (
                  <div key={p.nome} className="flex items-center gap-3">
                    <span className="w-5 text-[11px] font-bold text-gray-400 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-charcoal truncate">{p.nome}</p>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-[11px] text-gray-500">{p.quantidade} un.</span>
                          <span className="text-sm font-bold text-gold">{formatPrice(p.faturamento)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${(p.quantidade / maisVendidos[0].quantidade) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo de status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-charcoal text-sm mb-4">Distribuição por status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Pendentes', val: pendentes, cor: 'bg-amber-100 text-amber-700' },
                { label: 'Pagos', val: pagos.filter(p=>p.status==='pago').length, cor: 'bg-emerald-100 text-emerald-700' },
                { label: 'Enviados', val: pedidos.filter(p=>p.status==='enviado').length, cor: 'bg-blue-100 text-blue-700' },
                { label: 'Entregues', val: pedidos.filter(p=>p.status==='entregue').length, cor: 'bg-teal-100 text-teal-700' },
                { label: 'Cancelados', val: cancelados, cor: 'bg-red-100 text-red-600' },
                { label: 'Total pedidos', val: totalPedidos, cor: 'bg-gray-100 text-gray-700' },
              ].map(s => (
                <div key={s.label} className={`p-3 rounded-xl ${s.cor}`}>
                  <p className="text-2xl font-bold">{s.val}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
