'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLojaAdmin } from '@/hooks/useLojaAdmin';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Users, Clock, CheckCircle,
  Truck, XCircle, RefreshCw, Calendar, CreditCard, Activity, Award,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import toast from 'react-hot-toast';

interface Pedido {
  id: string; numero: number; status: string; total: number;
  metodo_pagamento: string | null; created_at: string; pago_em: string | null;
  clientes: { nome: string } | null;
}

const COR_STATUS: Record<string, string> = {
  pendente: '#f59e0b', processando: '#3b82f6', pago: '#10b981',
  separando: '#a855f7', enviado: '#6366f1', entregue: '#14b8a6', cancelado: '#ef4444',
};
const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente', processando: 'Processando', pago: 'Pago',
  separando: 'Separando', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
};

// Counter animado
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(start + (value - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{display.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

export default function DashboardPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'ano' | 'todos'>('30d');

  const { lojaId } = useLojaAdmin();
  useEffect(() => { if (lojaId) carregar(); }, [lojaId]);

  async function carregar() {
    setLoading(true);
    try {
      const s = createClient();
      const { data } = await s
        .from('pedidos')
        .select('id, numero, status, total, metodo_pagamento, created_at, pago_em, clientes(nome)')
        .eq('loja_id', lojaId!)
        .order('created_at', { ascending: false })
        .limit(2000);
      setPedidos((data ?? []) as unknown as Pedido[]);
    } catch { toast.error('Erro ao carregar dashboard'); }
    finally { setLoading(false); }
  }

  // Filtra por período
  const filtrados = useMemo(() => {
    if (periodo === 'todos') return pedidos;
    const dias = { '7d': 7, '30d': 30, '90d': 90, 'ano': 365 }[periodo] ?? 30;
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return pedidos.filter(p => new Date(p.created_at) >= limite);
  }, [pedidos, periodo]);

  // KPIs
  const kpis = useMemo(() => {
    const pagos = filtrados.filter(p => ['pago', 'enviado', 'entregue'].includes(p.status));
    const faturamento = pagos.reduce((s, p) => s + Number(p.total), 0);
    const ticketMedio = pagos.length ? faturamento / pagos.length : 0;
    const conversao = filtrados.length ? (pagos.length / filtrados.length) * 100 : 0;
    return {
      total: filtrados.length,
      faturamento,
      ticketMedio,
      conversao,
      pagos: pagos.length,
      pendentes: filtrados.filter(p => p.status === 'pendente').length,
      cancelados: filtrados.filter(p => p.status === 'cancelado').length,
    };
  }, [filtrados]);

  // Série temporal — pedidos e receita por dia
  const serieDiaria = useMemo(() => {
    const mapa = new Map<string, { data: string; pedidos: number; receita: number; cancelados: number }>();
    filtrados.forEach(p => {
      const d = new Date(p.created_at).toISOString().split('T')[0];
      const atual = mapa.get(d) || { data: d, pedidos: 0, receita: 0, cancelados: 0 };
      atual.pedidos += 1;
      if (['pago', 'enviado', 'entregue'].includes(p.status)) atual.receita += Number(p.total);
      if (p.status === 'cancelado') atual.cancelados += 1;
      mapa.set(d, atual);
    });
    return Array.from(mapa.values())
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(d => ({
        ...d,
        dataFormatada: new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }));
  }, [filtrados]);

  // Status distribuição (pie)
  const distStatus = useMemo(() => {
    const m = new Map<string, number>();
    filtrados.forEach(p => m.set(p.status, (m.get(p.status) || 0) + 1));
    return Array.from(m.entries()).map(([status, count]) => ({
      name: LABEL_STATUS[status] || status,
      value: count,
      cor: COR_STATUS[status] || '#888',
    }));
  }, [filtrados]);

  // Métodos de pagamento (bar)
  const distPagamento = useMemo(() => {
    const m = new Map<string, { count: number; receita: number }>();
    filtrados.forEach(p => {
      const metodo = p.metodo_pagamento || 'não informado';
      const a = m.get(metodo) || { count: 0, receita: 0 };
      a.count += 1;
      if (['pago', 'enviado', 'entregue'].includes(p.status)) a.receita += Number(p.total);
      m.set(metodo, a);
    });
    return Array.from(m.entries())
      .map(([metodo, v]) => ({ metodo: metodo.toUpperCase(), pedidos: v.count, receita: v.receita }))
      .sort((a, b) => b.pedidos - a.pedidos);
  }, [filtrados]);

  // Top clientes
  const topClientes = useMemo(() => {
    const m = new Map<string, { nome: string; pedidos: number; total: number }>();
    filtrados.forEach(p => {
      const nome = p.clientes?.nome || '—';
      const a = m.get(nome) || { nome, pedidos: 0, total: 0 };
      a.pedidos += 1;
      if (['pago', 'enviado', 'entregue'].includes(p.status)) a.total += Number(p.total);
      m.set(nome, a);
    });
    return Array.from(m.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtrados]);

  // Conversão como radial
  const conversaoData = [{ name: 'Conversão', value: Math.round(kpis.conversao), fill: '#10b981' }];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos"
            className="bg-white border border-gray-200 hover:bg-gray-50 p-2 rounded-xl transition-all">
            <ArrowLeft size={18} className="text-charcoal" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-charcoal flex items-center gap-2">
              <Activity className="text-purple-600" size={24} /> Dashboard de Pedidos
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">Análise visual em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'ano', 'todos'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                periodo === p
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white border border-gray-200 text-charcoal hover:bg-gray-50'
              }`}>
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : p === 'ano' ? '1 ano' : 'Tudo'}
            </button>
          ))}
          <button onClick={carregar} className="bg-white border border-gray-200 hover:bg-gray-50 p-2 rounded-lg transition-all">
            <RefreshCw size={14} className="text-charcoal" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Faturamento"
          color="from-emerald-500 to-green-600"
          value={<AnimatedNumber value={kpis.faturamento} prefix="R$ " decimals={2} />}
          subtitle={`${kpis.pagos} pedidos pagos`}
        />
        <KpiCard
          icon={<ShoppingBag size={20} />}
          label="Pedidos"
          color="from-blue-500 to-indigo-600"
          value={<AnimatedNumber value={kpis.total} />}
          subtitle={`${kpis.pendentes} pendentes`}
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Ticket Médio"
          color="from-purple-500 to-fuchsia-600"
          value={<AnimatedNumber value={kpis.ticketMedio} prefix="R$ " decimals={2} />}
          subtitle="Por pedido pago"
        />
        <KpiCard
          icon={<Award size={20} />}
          label="Conversão"
          color="from-amber-500 to-orange-600"
          value={<><AnimatedNumber value={kpis.conversao} decimals={1} />%</>}
          subtitle={`${kpis.cancelados} cancelados`}
        />
      </div>

      {/* Receita ao longo do tempo */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg text-charcoal flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> Evolução da Receita
            </h2>
            <p className="text-xs text-gray-400">Faturamento e pedidos por dia</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={serieDiaria} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPedidos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dataFormatada" tick={{ fontSize: 11 }} stroke="#888" />
            <YAxis tick={{ fontSize: 11 }} stroke="#888" yAxisId="left"
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis tick={{ fontSize: 11 }} stroke="#888" yAxisId="right" orientation="right" />
            <Tooltip
              contentStyle={{ background: '#1e1a16', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(v: number, name: string) => name === 'receita' ? formatPrice(v) : v}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area yAxisId="left" type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2.5}
              fill="url(#gReceita)" name="Receita" animationDuration={1500} animationEasing="ease-out" />
            <Area yAxisId="right" type="monotone" dataKey="pedidos" stroke="#6366f1" strokeWidth={2.5}
              fill="url(#gPedidos)" name="Pedidos" animationDuration={1500} animationBegin={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-serif text-base text-charcoal flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-purple-600" /> Por Status
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={75} innerRadius={45} animationDuration={1200} animationBegin={200}
                label={(e: { name: string; percent?: number }) => `${e.name} ${((e.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {distStatus.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e1a16', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2 max-h-[120px] overflow-y-auto">
            {distStatus.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.cor }} />
                  <span className="text-charcoal">{s.name}</span>
                </div>
                <span className="font-bold text-charcoal">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Taxa Conversão Radial */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 shadow-sm text-white">
          <h2 className="font-serif text-base flex items-center gap-2 mb-3">
            <Award size={16} /> Taxa de Conversão
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={conversaoData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#fff" animationDuration={1500} background={{ fill: 'rgba(255,255,255,0.2)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-[150px] relative pointer-events-none">
            <div className="text-4xl font-bold"><AnimatedNumber value={kpis.conversao} decimals={1} />%</div>
            <p className="text-xs opacity-90 mt-1">{kpis.pagos} de {kpis.total} pedidos</p>
          </div>
          <div className="mt-[80px] space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="opacity-80">Pagos</span><span className="font-bold">{kpis.pagos}</span></div>
            <div className="flex justify-between"><span className="opacity-80">Pendentes</span><span className="font-bold">{kpis.pendentes}</span></div>
            <div className="flex justify-between"><span className="opacity-80">Cancelados</span><span className="font-bold">{kpis.cancelados}</span></div>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-serif text-base text-charcoal flex items-center gap-2 mb-3">
            <Users size={16} className="text-blue-600" /> Top 5 Clientes
          </h2>
          {topClientes.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-8 text-center">Sem dados no período</p>
          ) : (
            <div className="space-y-3">
              {topClientes.map((c, i) => {
                const maxTotal = topClientes[0].total || 1;
                const pct = (c.total / maxTotal) * 100;
                const cores = ['from-amber-400 to-amber-600', 'from-gray-400 to-gray-600', 'from-orange-400 to-orange-600', 'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600'];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-charcoal truncate flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white bg-gradient-to-r ${cores[i]} font-bold`}>#{i + 1}</span>
                        {c.nome}
                      </span>
                      <span className="text-xs font-bold text-charcoal">{formatPrice(c.total)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${cores[i]} rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.pedidos} pedido(s)</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Métodos de pagamento */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-serif text-base text-charcoal flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-indigo-600" /> Métodos de Pagamento
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={distPagamento} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gPag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="metodo" tick={{ fontSize: 11 }} stroke="#888" />
            <YAxis tick={{ fontSize: 11 }} stroke="#888" />
            <Tooltip
              contentStyle={{ background: '#1e1a16', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              formatter={(v: number, name: string) => name === 'receita' ? formatPrice(v) : v}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="pedidos" fill="url(#gPag)" name="Pedidos" radius={[8, 8, 0, 0]}
              animationDuration={1200} animationBegin={100} />
            <Bar dataKey="receita" fill="#10b981" name="Receita (R$)" radius={[8, 8, 0, 0]}
              animationDuration={1200} animationBegin={300} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; subtitle: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 sm:p-5 text-white shadow-lg overflow-hidden relative`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">{icon}</div>
          <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">{label}</p>
        </div>
        <p className="text-2xl sm:text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs opacity-80">{subtitle}</p>
      </div>
    </div>
  );
}
