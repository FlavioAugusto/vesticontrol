'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Package, TrendingDown, Search, X, Image as ImageIcon } from 'lucide-react';

interface Variante {
  id: string; tamanho: string; cor: string | null;
  cor_hex: string | null; estoque: number; sku: string | null;
}

interface ProdutoImg { url: string; principal: boolean | null; ordem: number | null }

interface Produto {
  id: string; nome: string; slug: string; preco: number; ativo: boolean; badge: string | null;
  categoria_id: string | null;
  categorias: { id: string; nome: string; slug: string } | null;
  produto_imagens: ProdutoImg[];
  produto_variantes: Variante[];
}

export default function AdminEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'critico' | 'zerado'>('todos');
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null);

  useEffect(() => { carregarEstoque(); }, []);

  async function carregarEstoque() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listar-estoque', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch { toast.error('Erro ao carregar estoque'); }
    finally { setLoading(false); }
  }

  async function salvarEstoque(varianteId: string, novoEstoque: number) {
    if (novoEstoque < 0) { toast.error('Estoque mínimo é 0'); return; }
    setSalvando(varianteId);
    try {
      const res = await fetch('/api/admin/estoque', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variante_id: varianteId, estoque: novoEstoque }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      // Atualiza estado local
      setProdutos(prev => prev.map(p => ({
        ...p,
        produto_variantes: p.produto_variantes.map(v => v.id === varianteId ? { ...v, estoque: novoEstoque } : v),
      })));
      if (produtoModal) {
        setProdutoModal(prev => prev ? {
          ...prev,
          produto_variantes: prev.produto_variantes.map(v => v.id === varianteId ? { ...v, estoque: novoEstoque } : v),
        } : null);
      }
      toast.success('Estoque atualizado');
    } catch (e: any) {
      toast.error(e.message || 'Erro');
    } finally { setSalvando(null); }
  }

  // Categorias únicas a partir dos produtos
  const categorias = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; slug: string }>();
    produtos.forEach(p => {
      if (p.categorias) map.set(p.categorias.id, p.categorias);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos]);

  // Filtragem
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const termo = busca.trim().toLowerCase();
      if (termo) {
        const matchNome = p.nome.toLowerCase().includes(termo);
        const matchSlug = (p.slug || '').toLowerCase().includes(termo);
        const matchCor = p.produto_variantes.some(v => (v.cor || '').toLowerCase().includes(termo));
        if (!matchNome && !matchSlug && !matchCor) return false;
      }
      if (categoriaFiltro && p.categoria_id !== categoriaFiltro) return false;

      // Filtro por estado de estoque
      if (filtro !== 'todos') {
        const variantes = p.produto_variantes;
        if (filtro === 'critico') {
          if (!variantes.some(v => v.estoque > 0 && v.estoque <= 2)) return false;
        }
        if (filtro === 'zerado') {
          if (!variantes.some(v => v.estoque === 0)) return false;
        }
      }
      return true;
    });
  }, [produtos, busca, categoriaFiltro, filtro]);

  // Agrupa por categoria
  const produtosPorCategoria = useMemo(() => {
    const map = new Map<string, Produto[]>();
    produtosFiltrados.forEach(p => {
      const catNome = p.categorias?.nome || 'Sem categoria';
      if (!map.has(catNome)) map.set(catNome, []);
      map.get(catNome)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [produtosFiltrados]);

  // Stats globais
  const stats = useMemo(() => {
    let total = 0, criticos = 0, zerados = 0;
    produtos.forEach(p => {
      p.produto_variantes.forEach(v => {
        total++;
        if (v.estoque === 0) zerados++;
        else if (v.estoque <= 2) criticos++;
      });
    });
    return { total, criticos, zerados };
  }, [produtos]);

  function totalProduto(p: Produto): number {
    return p.produto_variantes.reduce((s, v) => s + v.estoque, 0);
  }

  function imagemProduto(p: Produto): string | null {
    const principal = p.produto_imagens?.find(i => i.principal);
    if (principal) return principal.url;
    const ord = p.produto_imagens?.sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));
    return ord?.[0]?.url || null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-charcoal">Gestão de Estoque</h1>
          <p className="text-charcoal-muted text-sm mt-1">Produtos agrupados por categoria. Clique pra editar variantes.</p>
        </div>
        <button onClick={carregarEstoque} disabled={loading}
          className="px-4 py-2 border border-charcoal text-charcoal text-xs font-semibold uppercase tracking-wider hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50 rounded-lg">
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-sm shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-gold" />
            <p className="text-xs text-charcoal-muted uppercase tracking-wider">Total Variantes</p>
          </div>
          <p className="text-2xl font-bold text-charcoal">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-sm shadow-sm border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-xs text-charcoal-muted uppercase tracking-wider">Estoque Crítico (≤2)</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.criticos}</p>
        </div>
        <div className="bg-white p-4 rounded-sm shadow-sm border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-red-500" />
            <p className="text-xs text-charcoal-muted uppercase tracking-wider">Zerados</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.zerados}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nome, código ou cor..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold transition-colors" />
        </div>

        <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold transition-colors min-w-[180px]">
          <option value="">Todas as categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <div className="flex gap-2">
          {(['todos', 'critico', 'zerado'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors rounded-lg ${filtro === f ? 'bg-charcoal text-white border-charcoal' : 'border-gray-200 text-charcoal hover:border-charcoal'}`}>
              {f === 'todos' ? 'Todos' : f === 'critico' ? '⚠️ Crítico' : '🚨 Zerado'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por categoria */}
      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center text-charcoal-muted">Carregando...</div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center text-charcoal-muted">
          Nenhum produto encontrado com esses filtros.
        </div>
      ) : (
        <div className="space-y-6">
          {produtosPorCategoria.map(([categoria, prods]) => (
            <div key={categoria}>
              <h2 className="text-xs font-bold text-charcoal-muted uppercase tracking-[0.2em] mb-3 pl-1">
                {categoria} <span className="text-charcoal-muted/60 normal-case font-normal tracking-normal">· {prods.length} {prods.length === 1 ? 'produto' : 'produtos'}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {prods.map(p => {
                  const total = totalProduto(p);
                  const img = imagemProduto(p);
                  const temCritico = p.produto_variantes.some(v => v.estoque > 0 && v.estoque <= 2);
                  const temZerado = p.produto_variantes.some(v => v.estoque === 0);

                  return (
                    <button key={p.id} onClick={() => setProdutoModal(p)}
                      className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gold hover:shadow-lg transition-all text-left group">
                      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        {img ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={img} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        {/* Badge de stock */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          {temZerado && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              ESGOTADO
                            </span>
                          )}
                          {!temZerado && temCritico && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              CRÍTICO
                            </span>
                          )}
                          {!p.ativo && (
                            <span className="bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              INATIVO
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-charcoal truncate" title={p.nome}>{p.nome}</p>
                        <p className="text-[11px] text-charcoal-muted font-mono mt-0.5">/{p.slug}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-charcoal-muted">{p.produto_variantes.length} variantes</span>
                          <span className={`text-sm font-bold ${total === 0 ? 'text-red-600' : total <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {total} un.
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL — detalhes do produto */}
      {produtoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
          onClick={() => setProdutoModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-start justify-between gap-4 z-10">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {imagemProduto(produtoModal) && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imagemProduto(produtoModal) || ''} alt={produtoModal.nome}
                    className="w-20 h-24 object-cover rounded-lg shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-1">
                    {produtoModal.categorias?.nome || 'Sem categoria'}
                  </p>
                  <h3 className="font-serif text-xl text-charcoal truncate">{produtoModal.nome}</h3>
                  <p className="text-xs text-charcoal-muted font-mono mt-0.5">/{produtoModal.slug}</p>
                  <p className="text-sm text-charcoal-muted mt-1">
                    R$ {Number(produtoModal.preco).toFixed(2).replace('.', ',')} ·{' '}
                    <a href={`/produtos/${produtoModal.slug}`} target="_blank" rel="noopener" className="text-gold hover:underline">
                      Ver na loja ↗
                    </a>
                  </p>
                </div>
              </div>
              <button onClick={() => setProdutoModal(null)}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Variantes */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm text-charcoal">Variantes ({produtoModal.produto_variantes.length})</h4>
                <span className="text-xs text-charcoal-muted">
                  Total em estoque: <strong className="text-charcoal">{totalProduto(produtoModal)} un.</strong>
                </span>
              </div>

              {produtoModal.produto_variantes.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center text-sm text-amber-700">
                  Nenhuma variante cadastrada. Adicione tamanhos/cores na edição do produto.
                </div>
              ) : (
                <div className="space-y-2">
                  {produtoModal.produto_variantes.map(v => (
                    <div key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      v.estoque === 0 ? 'bg-red-50 border-red-200' :
                      v.estoque <= 2 ? 'bg-amber-50 border-amber-200' :
                      'bg-white border-gray-100'
                    }`}>
                      <span className="w-10 h-10 border border-gray-300 flex items-center justify-center font-bold text-sm bg-white rounded">
                        {v.tamanho}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {v.cor_hex && (
                          <span className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                            style={{ backgroundColor: v.cor_hex }} />
                        )}
                        <span className="text-sm text-charcoal truncate">{v.cor || '—'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-charcoal-muted hidden sm:inline">{v.sku || '—'}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => salvarEstoque(v.id, Math.max(0, v.estoque - 1))}
                          disabled={v.estoque <= 0 || salvando === v.id}
                          className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 rounded font-bold">−</button>
                        <span className={`w-10 text-center font-bold text-lg ${
                          v.estoque === 0 ? 'text-red-600' :
                          v.estoque <= 2 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {v.estoque}
                        </span>
                        <button onClick={() => salvarEstoque(v.id, v.estoque + 1)}
                          disabled={salvando === v.id}
                          className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 rounded font-bold">+</button>
                      </div>
                      {/* Quick add */}
                      <div className="hidden md:flex gap-1">
                        {[5, 10].map(n => (
                          <button key={n} onClick={() => salvarEstoque(v.id, v.estoque + n)}
                            disabled={salvando === v.id}
                            className="text-[10px] px-2 py-1 border border-gray-200 hover:bg-gold hover:text-white hover:border-gold rounded transition-colors">
                            +{n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
