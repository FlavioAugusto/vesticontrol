'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLojaAdmin } from '@/hooks/useLojaAdmin';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Trash2, Eye, Search, Package, AlertTriangle } from 'lucide-react';

interface Produto {
  id: string; nome: string; slug: string; preco: number; ativo: boolean;
  badge: string | null;
  categorias: { nome: string } | null;
  produto_imagens: { url: string; principal: boolean }[];
  produto_variantes: { estoque: number }[];
}

export default function AdminProdutosPage() {
  const { lojaId } = useLojaAdmin();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null);

  useEffect(() => {
    if (lojaId) carregar();
  }, [lojaId]);

  async function carregar() {
    if (!lojaId) return;
    setLoading(true);
    try {
      const s = createClient();
      const { data } = await s.from('produtos')
        .select('id, nome, slug, preco, ativo, badge, categorias(nome), produto_imagens(url, principal), produto_variantes(estoque)')
        .eq('loja_id', lojaId)
        .order('created_at', { ascending: false });
      setProdutos((data ?? []) as Produto[]);
    } catch { toast.error('Erro ao carregar'); }
    finally { setLoading(false); }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setProdutos(p => p.map(x => x.id === id ? { ...x, ativo } : x));
      toast.success(ativo ? 'Ativado' : 'Desativado');
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function excluir(id: string) {
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setProdutos(p => p.filter(x => x.id !== id));
      setConfirmarExclusao(null);
      toast.success('Produto excluído');
    } catch { toast.error('Erro ao excluir'); }
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) || p.slug.includes(busca)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal tracking-tight">Produtos</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{produtos.length} produtos cadastrados</p>
        </div>
        <Link href="/admin/produtos/novo"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-semibold hover:from-gold-600 hover:to-gold-700 transition-all shadow-md shadow-gold/20 w-full sm:w-auto">
          <Plus size={14} /> Novo Produto
        </Link>
      </div>

      {/* Busca */}
      <div className="mb-4 sm:mb-5 relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all shadow-sm" />
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl py-12 text-center border border-gray-100">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-2xl py-12 text-center border border-gray-100">
            <Package size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">{busca ? 'Nenhum resultado' : 'Nenhum produto'}</p>
            {!busca && <Link href="/admin/produtos/novo" className="inline-flex items-center gap-2 text-gold text-xs font-semibold hover:underline mt-2"><Plus size={12} /> Criar produto</Link>}
          </div>
        ) : filtrados.map(p => {
          const img = p.produto_imagens?.find(i => i.principal)?.url ?? p.produto_imagens?.[0]?.url;
          const estoque = p.produto_variantes?.reduce((s, v) => s + v.estoque, 0) ?? 0;
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-3">
              {img ? (
                <div className="relative w-12 h-16 overflow-hidden bg-gray-100 rounded-xl flex-shrink-0">
                  <Image src={img} alt={p.nome} fill className="object-cover" sizes="48px" />
                </div>
              ) : (
                <div className="w-12 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-charcoal text-sm truncate">{p.nome}</p>
                <p className="text-[11px] text-gray-400 font-mono">{p.categorias?.nome ?? '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-gold text-sm">{formatPrice(Number(p.preco))}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${estoque === 0 ? 'text-red-600 bg-red-50' : estoque <= 2 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                    {estoque} un.
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => toggleAtivo(p.id, !p.ativo)}
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 ${p.ativo ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${p.ativo ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
                <div className="flex gap-1">
                  <Link href={`/admin/produtos/${p.id}/editar`} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={12} />
                  </Link>
                  <button onClick={() => setConfirmarExclusao(p.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden sm:block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['', 'Produto', 'Categoria', 'Preço', 'Estoque', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left px-3 sm:px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Carregando produtos...</p>
                </td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Package size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 mb-1 font-medium">{busca ? 'Nenhum resultado' : 'Nenhum produto cadastrado'}</p>
                  {!busca && <Link href="/admin/produtos/novo" className="inline-flex items-center gap-2 text-gold text-xs font-semibold hover:underline mt-2"><Plus size={12} /> Criar primeiro produto</Link>}
                </td></tr>
              ) : filtrados.map(p => {
                const img = p.produto_imagens?.find(i => i.principal)?.url ?? p.produto_imagens?.[0]?.url;
                const estoque = p.produto_variantes?.reduce((s, v) => s + v.estoque, 0) ?? 0;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
                    <td className="px-3 sm:px-5 py-3">
                      {img ? (
                        <div className="relative w-9 h-12 sm:w-11 sm:h-14 overflow-hidden bg-gray-100 rounded-xl">
                          <Image src={img} alt={p.nome} fill className="object-cover" sizes="44px" />
                        </div>
                      ) : (
                        <div className="w-9 h-12 sm:w-11 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Package size={12} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <p className="font-semibold text-charcoal text-[12px] sm:text-[13px] line-clamp-1">{p.nome}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">/{p.slug}</p>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      {p.categorias?.nome ? (
                        <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded-lg font-medium whitespace-nowrap">{p.categorias.nome}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 sm:px-5 py-3 font-bold text-gold text-[12px] sm:text-[13px] whitespace-nowrap">{formatPrice(Number(p.preco))}</td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${estoque === 0 ? 'text-red-600 bg-red-50' : estoque <= 2 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                        {estoque} un.
                      </span>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <button onClick={() => toggleAtivo(p.id, !p.ativo)}
                        className={`relative w-9 h-5 rounded-full transition-all duration-300 ${p.ativo ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${p.ativo ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <a href={`/produtos/${p.slug}`} target="_blank" rel="noopener" title="Ver"
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gold rounded-lg hover:bg-gold/8 transition-all">
                          <Eye size={13} />
                        </a>
                        <Link href={`/admin/produtos/${p.id}/editar`} title="Editar"
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all">
                          <Edit2 size={12} />
                        </Link>
                        <button onClick={() => setConfirmarExclusao(p.id)} title="Excluir"
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                          <Trash2 size={12} />
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

      {/* Modal exclusão */}
      {confirmarExclusao && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmarExclusao(null)}>
          <div className="bg-white border border-gray-100 p-5 sm:p-6 max-w-sm w-full rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-charcoal text-base sm:text-lg mb-2">Excluir Produto</h3>
            <p className="text-sm text-gray-400 mb-5 sm:mb-6">Esta ação não pode ser desfeita. Variantes e imagens também serão removidas.</p>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => excluir(confirmarExclusao)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                Sim, excluir
              </button>
              <button onClick={() => setConfirmarExclusao(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
