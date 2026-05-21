'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, DollarSign, Users, Package, Clock, ArrowUpRight,
  AlertTriangle, TrendingDown, TrendingUp, Activity, ShoppingBag,
  Zap, BarChart3, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

interface DashData {
  loja: string;
  faturamento: { total: number; ultimos30d: number; ultimos7d: number; ticketMedio: number };
  pedidos: {
    total: number; pagos: number; pendentes: number; processando: number; cancelados: number;
    ultimos30d: number;
    recentes: any[];
    statusBreakdown: Record<string, number>;
  };
  clientes: { total: number; ultimos30d: number };
  produtos: { total: number; ativos: number };
  estoque: {
    totalVariantes: number; totalUnidades: number;
    critico: number; zerado: number; ok: number;
    criticoLista: any[]; zeradoLista: any[];
  };
  vendaPorDia: { dia: string; valor: number; pedidos: number }[];
}

const COLORS = {
  pago: '#10b981',
  pendente: '#f59e0b',
  processando: '#3b82f6',
  separando: '#a855f7',
  enviado: '#6366f1',
  entregue: '#059669',
  cancelado: '#ef4444',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-sm text-charcoal-muted">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const temAlerta = data.estoque.critico > 0 || data.estoque.zerado > 0;

  const statusData = Object.entries(data.pedidos.statusBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    fill: (COLORS as any)[key] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Sistema online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-charcoal tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Visão geral da {data.loja} — atualizado em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-gold/10 to-amber-50 border border-gold/20 px-3 py-2 rounded-xl">
            <p className="text-[10px] uppercase tracking-wider text-gold font-bold">HOJE</p>
            <p className="text-sm font-bold text-charcoal">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* ⚠️ ALERTAS DE ESTOQUE (piscando se crítico) */}
      {temAlerta && (
        <div className={`rounded-2xl border-2 p-4 sm:p-5 ${data.estoque.zerado > 0 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 animate-pulse' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'}`}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${data.estoque.zerado > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className={`font-bold text-lg ${data.estoque.zerado > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                ⚠️ Alerta de Estoque — Reposição Necessária!
              </h3>
              <p className="text-sm text-charcoal-muted mt-1">
                {data.estoque.zerado > 0 && <span className="font-bold text-red-600">{data.estoque.zerado} variante(s) ZERADA(S)</span>}
                {data.estoque.zerado > 0 && data.estoque.critico > 0 && ' · '}
                {data.estoque.critico > 0 && <span className="font-bold text-amber-700">{data.estoque.critico} variante(s) CRÍTICA(S)</span>}
                {' precisam de atenção.'}
              </p>
            </div>
            <Link href="/admin/estoque" className={`px-4 py-2 rounded-lg text-white text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 ${data.estoque.zerado > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
              <Zap size={14} /> Reabastecer
            </Link>
          </div>

          {/* Lista resumida */}
          {(data.estoque.zeradoLista.length > 0 || data.estoque.criticoLista.length > 0) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.estoque.zeradoLista.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                    🚨 ZERADO ({data.estoque.zeradoLista.length})
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {data.estoque.zeradoLista.slice(0, 4).map((v: any) => (
                      <div key={v.id} className="flex justify-between items-center text-charcoal">
                        <span className="truncate">{v.produtos?.nome ?? '—'} <span className="text-gray-400">· {v.tamanho}{v.cor ? '/'+v.cor : ''}</span></span>
                        <span className="font-bold text-red-600 ml-2">0 un.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.estoque.criticoLista.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                    ⚠️ CRÍTICO ({data.estoque.criticoLista.length})
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {data.estoque.criticoLista.slice(0, 4).map((v: any) => (
                      <div key={v.id} className="flex justify-between items-center text-charcoal">
                        <span className="truncate">{v.produtos?.nome ?? '—'} <span className="text-gray-400">· {v.tamanho}{v.cor ? '/'+v.cor : ''}</span></span>
                        <span className="font-bold text-amber-600 ml-2">{v.estoque} un.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Faturamento Total"
          value={formatPrice(data.faturamento.total)}
          subtitle={`${formatPrice(data.faturamento.ultimos30d)} nos últimos 30d`}
          icon={<DollarSign className="text-emerald-600" size={20} />}
          gradient="from-emerald-500/10 to-emerald-50 border-emerald-200"
          trend={data.faturamento.ultimos7d > 0 ? 'up' : null}
        />
        <KPICard
          title="Pedidos Totais"
          value={String(data.pedidos.total)}
          subtitle={`${data.pedidos.pagos} pagos · ${data.pedidos.pendentes} pendentes`}
          icon={<ShoppingCart className="text-blue-600" size={20} />}
          gradient="from-blue-500/10 to-blue-50 border-blue-200"
        />
        <KPICard
          title="Clientes"
          value={String(data.clientes.total)}
          subtitle={`+${data.clientes.ultimos30d} novos em 30d`}
          icon={<Users className="text-purple-600" size={20} />}
          gradient="from-purple-500/10 to-purple-50 border-purple-200"
        />
        <KPICard
          title="Produtos Ativos"
          value={String(data.produtos.ativos)}
          subtitle={`${data.estoque.totalUnidades} un. em estoque`}
          icon={<Package className="text-rose-600" size={20} />}
          gradient="from-rose-500/10 to-rose-50 border-rose-200"
        />
      </div>

      {/* Gráfico de vendas + Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vendas últimos 30 dias */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Activity size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal text-sm">Vendas — Últimos 30 dias</h3>
                <p className="text-[11px] text-gray-400">{formatPrice(data.faturamento.ultimos30d)} faturados</p>
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={10} /> {data.pedidos.ultimos30d} pedidos
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.vendaPorDia}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$ ${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }}
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'valor') return [formatPrice(Number(value)), 'Faturamento'];
                    return [value, 'Pedidos'];
                  }}
                />
                <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2.5} fill="url(#colorValor)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status dos pedidos (Pizza) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <BarChart3 size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-sm">Status dos Pedidos</h3>
              <p className="text-[11px] text-gray-400">Distribuição</p>
            </div>
          </div>
          {statusData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Nenhum pedido ainda</p>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} innerRadius={40}
                    animationDuration={1500} label={(e: any) => e.value > 0 ? e.value : ''}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12, color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Ticket médio + Estoque saúde */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniKPI title="Ticket Médio" value={formatPrice(data.faturamento.ticketMedio)} icon={<ShoppingBag size={16} />} color="amber" />
        <MiniKPI title="Variantes Totais" value={String(data.estoque.totalVariantes)} icon={<Package size={16} />} color="blue" />
        <MiniKPI title="Saúde do Estoque" value={`${data.estoque.totalVariantes > 0 ? Math.round((data.estoque.ok / data.estoque.totalVariantes) * 100) : 0}%`} icon={<Sparkles size={16} />} color={data.estoque.ok / Math.max(data.estoque.totalVariantes, 1) > 0.7 ? 'green' : 'amber'} />
      </div>

      {/* Pedidos Recentes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-sm">Pedidos Recentes</h3>
              <p className="text-[11px] text-gray-400">Últimas {data.pedidos.recentes.length} transações</p>
            </div>
          </div>
          <Link href="/admin/pedidos" className="flex items-center gap-1 text-xs text-gold font-bold hover:text-gold-600 transition-colors">
            Ver todos <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data.pedidos.recentes.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum pedido ainda</p>
            </div>
          ) : data.pedidos.recentes.map((p: any) => {
            const cor = (COLORS as any)[p.status] || '#94a3b8';
            return (
              <Link key={p.id} href={`/admin/pedidos`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-charcoal text-xs bg-gray-100 px-2 py-1 rounded-lg shrink-0">#{p.numero}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-charcoal text-sm truncate">
                      {p.clientes?.nome ?? '—'} {p.clientes?.sobrenome ?? ''}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 capitalize" style={{ background: cor + '15', color: cor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-bold text-charcoal text-sm">{formatPrice(Number(p.total))}</p>
                  <p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, gradient, trend }: {
  title: string; value: string; subtitle: string;
  icon: React.ReactNode; gradient: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend === 'up' && <TrendingUp size={16} className="text-emerald-600" />}
        {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
      </div>
      <p className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-charcoal mb-1">{value}</p>
      <p className="text-[11px] text-charcoal-muted truncate">{subtitle}</p>
    </div>
  );
}

function MiniKPI({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: 'amber'|'blue'|'green' }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <div className={`${colors[color]} border rounded-xl p-3 flex items-center gap-3`}>
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{title}</p>
        <p className="text-base font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
