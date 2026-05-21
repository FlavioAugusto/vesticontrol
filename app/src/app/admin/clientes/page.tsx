'use client';

import { useState, useEffect } from 'react';
import { useLojaAdmin } from '@/hooks/useLojaAdmin';
import { formatPrice } from '@/lib/utils';
import { Search, Download, Users, TrendingUp, X, Eye, ShoppingBag, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

interface Pedido { id: string; numero: number; total: number; status: string; created_at: string; pedido_itens: { nome_produto: string; quantidade: number }[] }
interface Cliente {
  id: string; nome: string; sobrenome: string | null; cpf: string | null; telefone: string | null;
  whatsapp: string | null; newsletter: boolean; vip: boolean; created_at: string;
  pedidos: Pedido[];
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR'); }
function formatDateTime(d: string) { return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos'|'ativos'|'inativos'|'vip'>('todos');
  const [clienteAberto, setClienteAberto] = useState<Cliente | null>(null);

  const { lojaId } = useLojaAdmin();
  useEffect(() => { if (lojaId) carregar(); }, [lojaId]);

  async function carregar() {
    setLoading(true);
    try {
      // Usa API server-side (bypassa RLS) — admin vê TODOS os clientes da loja
      const res = await fetch('/api/admin/listar-clientes', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar clientes');
      const data = await res.json();
      setClientes(Array.isArray(data) ? data as Cliente[] : []);
    } catch { toast.error('Erro ao carregar clientes'); }
    finally { setLoading(false); }
  }

  function totalGasto(c: Cliente) {
    return c.pedidos.filter(p => ['pago','enviado','entregue'].includes(p.status)).reduce((s, p) => s + Number(p.total), 0);
  }

  function primCompra(c: Cliente) {
    const datas = c.pedidos.map(p => new Date(p.created_at)).sort((a, b) => a.getTime() - b.getTime());
    return datas[0] ? formatDate(datas[0].toISOString()) : '—';
  }

  function ultCompra(c: Cliente) {
    const datas = c.pedidos.map(p => new Date(p.created_at)).sort((a, b) => b.getTime() - a.getTime());
    return datas[0] ? formatDate(datas[0].toISOString()) : '—';
  }

  function isAtivo(c: Cliente) { return c.pedidos.length > 0; }

  const filtrados = clientes.filter(c => {
    const matchBusca = !busca || `${c.nome} ${c.sobrenome ?? ''}`.toLowerCase().includes(busca.toLowerCase()) || (c.telefone ?? '').includes(busca);
    const matchFiltro = filtroAtivo === 'todos' || (filtroAtivo === 'ativos' && isAtivo(c)) || (filtroAtivo === 'inativos' && !isAtivo(c)) || (filtroAtivo === 'vip' && c.vip);
    return matchBusca && matchFiltro;
  });

  const stats = {
    total: clientes.length,
    ativos: clientes.filter(isAtivo).length,
    inativos: clientes.filter(c => !isAtivo(c)).length,
    vip: clientes.filter(c => c.vip).length,
    faturamento: clientes.reduce((s, c) => s + totalGasto(c), 0),
  };

  function exportarPDF() {
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Clientes</title><style>
      body{font-family:sans-serif;padding:20px;font-size:12px}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase}
      h2{font-size:14px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    </style></head><body>
    <h1>Relatório de Clientes</h1>
    <p>Total: ${filtrados.length} clientes · Faturamento: ${formatPrice(stats.faturamento)} · Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    <table><thead><tr><th>Nome</th><th>Telefone</th><th>Cadastro</th><th>1ª Compra</th><th>Última Compra</th><th>Nº Pedidos</th><th>Total Gasto</th></tr></thead><tbody>
    ${filtrados.map(c => `<tr><td>${c.nome} ${c.sobrenome ?? ''}${c.vip ? ' ⭐VIP' : ''}</td><td>${c.telefone ?? '—'}</td><td>${formatDate(c.created_at)}</td><td>${primCompra(c)}</td><td>${ultCompra(c)}</td><td>${c.pedidos.length}</td><td>${formatPrice(totalGasto(c))}</td></tr>`).join('')}
    </tbody></table>
    ${clienteAberto ? `<h2>Histórico — ${clienteAberto.nome}</h2>
    <table><thead><tr><th>#</th><th>Status</th><th>Total</th><th>Data</th></tr></thead><tbody>
    ${clienteAberto.pedidos.map(p => `<tr><td>#${p.numero}</td><td>${p.status}</td><td>${formatPrice(Number(p.total))}</td><td>${formatDate(p.created_at)}</td></tr>`).join('')}
    </tbody></table>` : ''}
    </body></html>`);
    w.document.close(); w.print();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal">Clientes</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{filtrados.length} de {clientes.length} clientes</p>
        </div>
        <button onClick={exportarPDF} className="inline-flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-charcoal-light">
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { key:'todos', label:'Total', val: stats.total, cor:'bg-blue-100 text-blue-700' },
          { key:'ativos', label:'Compraram', val: stats.ativos, cor:'bg-emerald-100 text-emerald-700' },
          { key:'inativos', label:'Sem compra', val: stats.inativos, cor:'bg-gray-100 text-gray-600' },
          { key:'vip', label:'VIP', val: stats.vip, cor:'bg-gold/20 text-gold' },
        ].map(s => (
          <button key={s.key} onClick={() => setFiltroAtivo(s.key as any)}
            className={`p-3 sm:p-4 rounded-2xl text-left border-2 transition-all ${filtroAtivo === s.key ? 'border-gold shadow-sm' : 'border-transparent'} ${s.cor}`}>
            <p className="text-xl sm:text-2xl font-bold">{s.val}</p>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gold/50 bg-white shadow-sm" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
          <Users size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Cliente','Cadastro','1ª Compra','Última Compra','Pedidos','Total Gasto',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                          {c.nome[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-charcoal text-[13px]">{c.nome} {c.sobrenome ?? ''}</p>
                            {c.vip && <span className="text-[9px] bg-gold text-white px-1.5 py-0.5 rounded font-bold">VIP</span>}
                          </div>
                          <p className="text-xs text-gray-400">{c.telefone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{primCompra(c)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{ultCompra(c)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-charcoal">{c.pedidos.length}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gold whitespace-nowrap">{formatPrice(totalGasto(c))}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setClienteAberto(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal histórico do cliente */}
      {clienteAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setClienteAberto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-bold text-lg">
                  {clienteAberto.nome[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">{clienteAberto.nome} {clienteAberto.sobrenome ?? ''} {clienteAberto.vip && <span className="text-[10px] bg-gold text-white px-1.5 py-0.5 rounded font-bold ml-1">VIP</span>}</h3>
                  <p className="text-xs text-gray-400">{clienteAberto.telefone ?? '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={exportarPDF} className="text-xs bg-charcoal text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-charcoal-light">
                  <Download size={12} /> PDF
                </button>
                <button onClick={() => setClienteAberto(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl"><X size={16} /></button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Stats do cliente */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Cadastro', val: formatDate(clienteAberto.created_at), icon: Calendar },
                  { label: '1ª Compra', val: primCompra(clienteAberto), icon: ShoppingBag },
                  { label: 'Última Compra', val: ultCompra(clienteAberto), icon: TrendingUp },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <s.icon size={16} className="text-gold mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                    <p className="text-xs font-bold text-charcoal mt-0.5">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{clienteAberto.pedidos.length}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Pedidos</p>
                </div>
                <div className="bg-gold/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gold">{formatPrice(totalGasto(clienteAberto))}</p>
                  <p className="text-[10px] text-gold font-semibold uppercase tracking-wider">Total Gasto</p>
                </div>
              </div>

              {/* Histórico de pedidos */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Histórico de pedidos</p>
                {clienteAberto.pedidos.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl py-8 text-center">
                    <ShoppingBag size={24} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Nenhuma compra realizada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clienteAberto.pedidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded-lg font-bold flex-shrink-0">#{p.numero}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 truncate">{p.pedido_itens?.map(i => i.nome_produto).join(', ')}</p>
                          <p className="text-[10px] text-gray-400">{formatDateTime(p.created_at)}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0 ${p.status === 'pago' || p.status === 'entregue' ? 'bg-emerald-100 text-emerald-700' : p.status === 'cancelado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                        <span className="font-bold text-charcoal text-sm flex-shrink-0">{formatPrice(Number(p.total))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dados cadastrais */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados cadastrais</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">CPF:</span> <span className="font-medium text-charcoal">{clienteAberto.cpf ?? '—'}</span></div>
                  <div><span className="text-gray-400">WhatsApp:</span> <span className="font-medium text-charcoal">{clienteAberto.whatsapp ?? clienteAberto.telefone ?? '—'}</span></div>
                  <div><span className="text-gray-400">Newsletter:</span> <span className="font-medium text-charcoal">{clienteAberto.newsletter ? '✅ Sim' : '❌ Não'}</span></div>
                  <div><span className="text-gray-400">VIP:</span> <span className="font-medium text-charcoal">{clienteAberto.vip ? '⭐ Sim' : 'Não'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
