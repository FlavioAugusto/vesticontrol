'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import { Plus, Trash2, ArrowLeft, Upload, X, Sparkles } from 'lucide-react';
import GuiaTamanhosSelector from '@/components/admin/GuiaTamanhosSelector';
import ColorDropdown, { CORES_PREDEFINIDAS } from '@/components/admin/ColorDropdown';
import { slugify } from '@/lib/utils';

interface Categoria { id: string; nome: string; slug: string }
interface Variante { tamanho: string; cor: string; cor_hex: string; foto_url: string; estoque: number; peso: number }
interface ImagemItem { url: string; alt: string; file?: File; preview?: string }
interface Cartela { cor: string; cor_hex: string; foto_url: string; tamanhos: { tamanho: string; estoque: number }[] }

const TAMANHOS_PADRAO = ['P', 'M', 'G'];

export default function NovoProdutoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [gerandoDesc, setGerandoDesc] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criandoCat, setCriandoCat] = useState(false);

  // Dados do produto
  const [guiaId, setGuiaId] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: String(Math.floor(10000 + Math.random() * 90000)),
    nome: '',
    descricao: '',
    preco: '',
    precoAntigo: '',
    mostrarPrecoAntigo: false,
    categoriaId: '',
    composicao: 'Tricoline 100% Algodão',
    composicaoCustom: false,
    tecido: '',
    lavagem: '',
    ativo: true,
    destaque: false,
    peso: '500',
    largura: '30',
    altura: '10',
    comprimento: '20',
    estrelas: 0,
  });

  // Imagens (até 6)
  const [imagens, setImagens] = useState<ImagemItem[]>([]);
  const [uploadando, setUploadando] = useState(false);

  // Cartelas de variantes (cada cartela = 1 cor com vários tamanhos)
  const [cartelas, setCartelas] = useState<Cartela[]>([
    { cor: '', cor_hex: '#000000', foto_url: '', tamanhos: TAMANHOS_PADRAO.map(t => ({ tamanho: t, estoque: 0 })) }
  ]);
  const [visualizacaoCor, setVisualizacaoCor] = useState<'hex' | 'foto'>('hex');
  const [novoTamanhoGlobal, setNovoTamanhoGlobal] = useState('');

  // Categorias extras (multi-select)
  const [categoriasExtras, setCategoriasExtras] = useState<string[]>([]);
  function toggleCategoriaExtra(id: string) {
    setCategoriasExtras(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Cores personalizadas (carregadas do banco)
  const [coresCustom, setCoresCustom] = useState<{ nome: string; hex: string }[]>([]);
  const [novaCorNome, setNovaCorNome] = useState('');
  const [novaCorHex, setNovaCorHex] = useState('#B89155');
  const [salvandoCor, setSalvandoCor] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cores').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCoresCustom(d);
    }).catch(() => {});
  }, []);

  async function adicionarCorCustom() {
    const nome = novaCorNome.trim();
    if (!nome) return;
    setSalvandoCor(true);
    try {
      const res = await fetch('/api/admin/cores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, hex: novaCorHex }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return; }
      setCoresCustom(data.cores);
      setNovaCorNome('');
      setNovaCorHex('#B89155');
      toast.success(`Cor "${nome}" adicionada!`);
    } catch { toast.error('Erro ao salvar cor'); }
    finally { setSalvandoCor(false); }
  }

  // Converter cartelas para variantes flat (para salvar)
  const variantes: Variante[] = cartelas.flatMap(c =>
    c.tamanhos.map(t => ({
      tamanho: t.tamanho, cor: c.cor, cor_hex: c.cor_hex,
      foto_url: c.foto_url, estoque: t.estoque, peso: parseInt(form.peso) || 500,
    }))
  );

  // Persistir rascunho no localStorage
  const DRAFT_KEY = 'by-marcelo-novo-produto-draft';

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.form) setForm(draft.form);
        if (draft.cartelas) setCartelas(draft.cartelas);
        if (draft.imagens) setImagens(draft.imagens);
        if (draft.visualizacaoCor) setVisualizacaoCor(draft.visualizacaoCor);
        if (draft.guiaId) setGuiaId(draft.guiaId);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        form, cartelas, imagens: imagens.map(i => ({ url: i.url, alt: i.alt })),
        visualizacaoCor, guiaId,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [form, cartelas, imagens, visualizacaoCor, guiaId]);

  function limparRascunho() {
    localStorage.removeItem(DRAFT_KEY);
  }

  useEffect(() => {
    (async () => {
      // 🛡️ Filtra categorias por loja_id do admin
      const lojaRes = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
      if (!lojaRes.ok) return;
      const { loja_id } = await lojaRes.json();
      if (!loja_id) return;

      const s = createClient();
      const { data } = await s.from('categorias')
        .select('id, nome, slug')
        .eq('loja_id', loja_id)
        .eq('ativo', true)
        .order('ordem');
      setCategorias((data ?? []) as Categoria[]);
    })();
  }, []);

  function setF(k: keyof typeof form, v: string | boolean | number) {
    setForm((p) => ({ ...p, [k]: v }));
    // Auto-gerar slug a partir do nome se ainda não foi alterado
    if (k === 'nome' && typeof v === 'string') {
      setForm((p) => ({ ...p, nome: v }));
    }
  }

  // Upload de imagens
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (imagens.length + files.length > 6) { toast.error('Máximo 6 imagens por produto'); return; }

    const oversized = files.filter((f) => f.size > 2 * 1024 * 1024);
    if (oversized.length) { toast.error(`Arquivo(s) acima de 2MB: ${oversized.map(f => f.name).join(', ')}`); return; }

    setUploadando(true);
    const novas: ImagemItem[] = [];

    for (const file of files) {
      const preview = URL.createObjectURL(file);
      // Upload para Supabase Storage
      const fd = new FormData();
      fd.append('file', file);
      fd.append('pasta', 'produtos');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const d = await res.json();
        novas.push({ url: d.url ?? preview, alt: form.nome || file.name, preview, file });
      } catch {
        novas.push({ url: preview, alt: file.name, preview, file });
      }
    }

    setImagens((prev) => [...prev, ...novas]);
    setUploadando(false);
    e.target.value = '';
  }

  function removerImagem(idx: number) {
    setImagens((prev) => prev.filter((_, i) => i !== idx));
  }

  // Cartela helpers
  function addCartela() {
    const tamanhosDaPrimeira = cartelas[0]?.tamanhos.map(t => t.tamanho) ?? TAMANHOS_PADRAO;
    setCartelas(prev => [...prev, {
      cor: '', cor_hex: '#000000', foto_url: '',
      tamanhos: tamanhosDaPrimeira.map(t => ({ tamanho: t, estoque: 0 })),
    }]);
  }

  function removeCartela(idx: number) {
    if (cartelas.length <= 1) { toast.error('Precisa de ao menos uma cartela'); return; }
    setCartelas(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCartelaCor(idx: number, nome: string, hex: string) {
    setCartelas(prev => prev.map((c, i) => i === idx ? { ...c, cor: nome, cor_hex: hex } : c));
  }

  function updateCartelaFoto(idx: number, url: string) {
    setCartelas(prev => prev.map((c, i) => i === idx ? { ...c, foto_url: url } : c));
  }

  function updateEstoque(cartelaIdx: number, tamanhoIdx: number, estoque: number) {
    setCartelas(prev => prev.map((c, ci) =>
      ci === cartelaIdx ? { ...c, tamanhos: c.tamanhos.map((t, ti) =>
        ti === tamanhoIdx ? { ...t, estoque } : t
      ) } : c
    ));
  }

  function addTamanhoGlobal() {
    if (!novoTamanhoGlobal.trim()) return;
    const novo = novoTamanhoGlobal.toUpperCase().trim();
    if (cartelas[0]?.tamanhos.some(t => t.tamanho === novo)) { toast.error('Tamanho já existe'); return; }
    setCartelas(prev => prev.map(c => ({
      ...c, tamanhos: [...c.tamanhos, { tamanho: novo, estoque: 0 }]
    })));
    setNovoTamanhoGlobal('');
  }

  function removeTamanhoGlobal(tamanho: string) {
    const tamanhosRestantes = cartelas[0]?.tamanhos.filter(t => t.tamanho !== tamanho);
    if (!tamanhosRestantes?.length) { toast.error('Precisa de ao menos um tamanho'); return; }
    setCartelas(prev => prev.map(c => ({
      ...c, tamanhos: c.tamanhos.filter(t => t.tamanho !== tamanho)
    })));
  }

  // Criar categoria
  async function criarCategoria() {
    if (!novaCategoria.trim()) return;
    setCriandoCat(true);
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novaCategoria }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao criar categoria'); return; }
      setCategorias((prev) => [...prev, data as Categoria]);
      setF('categoriaId', (data as Categoria).id);
      setNovaCategoria('');
      toast.success('Categoria criada!');
    } catch { toast.error('Erro ao criar categoria'); }
    finally { setCriandoCat(false); }
  }

  // Gerar descrição com IA
  async function gerarDescricao() {
    if (!form.nome) { toast.error('Informe o nome do produto primeiro'); return; }
    setGerandoDesc(true);
    try {
      const res = await fetch('/api/admin/gerar-descricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          categoria: categorias.find(c => c.id === form.categoriaId)?.nome,
          composicao: form.composicao,
          tecido: form.tecido || null,
          // Se já tem texto, IA COMPLEMENTA. Senão gera do zero.
          textoExistente: form.descricao || null,
        }),
      });
      const d = await res.json();
      if (d.descricao) {
        // Se já tinha texto, junta o existente com o gerado pela IA
        if (form.descricao && form.descricao.trim().length > 10) {
          setF('descricao', form.descricao.trim() + '\n\n' + d.descricao);
          toast.success('IA complementou sua descrição!');
        } else {
          setF('descricao', d.descricao);
          toast.success('Descrição gerada pela IA!');
        }
      }
    } catch { toast.error('Erro ao gerar descrição'); }
    finally { setGerandoDesc(false); }
  }

  function badgeFromEstrelas(e: number) {
    if (e === 5) return 'lancamento';
    if (e === 4) return 'bestseller';
    if (e >= 1) return 'maisvendidos';
    return null;
  }

  async function salvar() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return; }
    if (!form.preco) { toast.error('Preço é obrigatório'); return; }
    if (!form.peso || !form.largura || !form.altura || !form.comprimento) { toast.error('Peso e medidas são obrigatórios para o cálculo de frete'); return; }
    if (variantes.length === 0) { toast.error('Adicione ao menos uma variante'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto: {
            nome: form.nome,
            slug: form.slug,
            descricao: form.descricao || null,
            preco: parseFloat(form.preco),
            preco_antigo: form.mostrarPrecoAntigo && form.precoAntigo ? parseFloat(form.precoAntigo) : null,
            categoria_id: form.categoriaId || null,
            categorias_extras: categoriasExtras,
            badge: badgeFromEstrelas(form.estrelas),
            ativo: form.ativo,
            destaque: form.destaque,
            peso_gramas: parseInt(form.peso),
            composicao: form.composicao || 'Tricoline 100% Algodão',
            tecido: form.tecido || null,
            lavagem: form.lavagem || null,
          },
          imagens: imagens.map((img) => ({ url: img.url, alt: img.alt || form.nome })),
          variantes: variantes.map((v) => ({
            tamanho: v.tamanho,
            cor: v.cor || null,
            cor_hex: v.cor_hex || null,
            foto_url: v.foto_url || null,
            estoque: v.estoque,
            sku: `${form.slug}-${v.tamanho}${v.cor ? '-' + v.cor.slice(0, 3).toUpperCase() : ''}`,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

      await fetch('/api/revalidar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paths: ['/', '/produtos'] }) });

      limparRascunho();
      toast.success('Produto criado com sucesso!');
      router.push('/admin/produtos');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-charcoal-muted hover:text-charcoal"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-serif text-charcoal">Novo Produto</h1>
        <span className="ml-auto text-xs text-charcoal-muted">Nº {form.slug}</span>
      </div>

      <div className="space-y-5">

        {/* ── 1. DADOS BÁSICOS ── */}
        <div className="bg-white rounded-sm shadow-sm p-6 space-y-4">
          <h2 className="font-serif text-lg text-charcoal">1. Informações Básicas</h2>

          <Input label="Nome do Produto *" value={form.nome} onChange={(e) => setF('nome', e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Número do Produto (Slug) *
              </label>
              <input value={form.slug} onChange={(e) => setF('slug', e.target.value.replace(/\D/g, ''))}
                className="input-field font-mono" placeholder="77820" maxLength={6} />
              <p className="text-[10px] text-charcoal-muted mt-1">Número único do produto (auto-gerado)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Categoria principal</label>
              <div className="flex gap-2">
                <select className="input-field" value={form.categoriaId} onChange={(e) => setF('categoriaId', e.target.value)}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {/* Criar nova categoria inline */}
              <div className="flex gap-2 mt-2">
                <input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="+ Nova categoria" className="input-field text-xs flex-1" />
                <button onClick={criarCategoria} disabled={criandoCat}
                  className="px-3 text-xs border border-gold text-gold hover:bg-gold hover:text-white transition-colors rounded-sm">
                  {criandoCat ? '...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>

          {/* Categorias adicionais (checkboxes) */}
          {categorias.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Categorias adicionais <span className="text-[10px] font-normal text-charcoal-muted normal-case">(o produto também aparece nessas)</span>
              </label>
              <div className="flex flex-wrap gap-2 border border-cream-darker rounded-sm p-3 bg-cream/30">
                {categorias.filter(c => c.id !== form.categoriaId).map((c) => {
                  const checked = categoriasExtras.includes(c.id);
                  return (
                    <label key={c.id} className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm cursor-pointer transition-all text-xs ${checked ? 'border-gold bg-gold/10 text-gold font-semibold' : 'border-gray-200 text-charcoal-muted hover:border-gold/50'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleCategoriaExtra(c.id)} className="accent-gold" />
                      {c.nome}
                    </label>
                  );
                })}
                {categorias.filter(c => c.id !== form.categoriaId).length === 0 && (
                  <p className="text-xs text-charcoal-muted py-1">Nenhuma outra categoria disponível</p>
                )}
              </div>
            </div>
          )}

          {/* Composição */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Composição</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Tricoline 100% Algodão', 'Viscose', 'Linho', 'Seda', 'Poliéster', 'Crepe', 'Cetim'].map((comp) => (
                <button key={comp} type="button"
                  onClick={() => setF('composicao', comp)}
                  className={`px-3 py-1.5 text-xs border rounded-sm transition-all ${form.composicao === comp && !form.composicaoCustom ? 'bg-gold text-white border-gold' : 'border-gray-200 text-charcoal-muted hover:border-gold'}`}>
                  {comp}
                </button>
              ))}
              <button type="button"
                onClick={() => { setForm(p => ({ ...p, composicaoCustom: !p.composicaoCustom })); }}
                className={`px-3 py-1.5 text-xs border rounded-sm transition-all ${form.composicaoCustom ? 'bg-gold text-white border-gold' : 'border-gray-200 text-charcoal-muted hover:border-gold'}`}>
                Outra...
              </button>
            </div>
            {form.composicaoCustom && (
              <input value={form.composicao} onChange={(e) => setF('composicao', e.target.value)}
                placeholder="Ex: 70% Algodão 30% Poliéster" className="input-field text-sm" />
            )}
            {!form.composicaoCustom && (
              <p className="text-[10px] text-charcoal-muted">Composição: <strong>{form.composicao}</strong></p>
            )}
          </div>

          {/* Descrição com IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Descrição</label>
              <button onClick={gerarDescricao} disabled={gerandoDesc}
                className="flex items-center gap-1.5 text-xs text-gold hover:underline disabled:opacity-50">
                <Sparkles size={12} />
                {gerandoDesc ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>
            <textarea rows={12} className="input-field min-h-[280px] resize-y leading-relaxed" value={form.descricao}
              onChange={(e) => setF('descricao', e.target.value)}
              placeholder="Descreva o produto (introdução, características, conforto, ocasiões de uso, etc) — ou digite uma intro e clique em 'Gerar com IA' pra COMPLETAR o resto" />
            <p className="text-[10px] text-charcoal-muted mt-1.5">
              💡 <strong>Dica:</strong> digite uma introdução personalizada do produto. A IA vai COMPLETAR com benefícios, ocasiões de uso, condições de pagamento.
            </p>
          </div>

          {/* Guia de Tamanhos */}
          <GuiaTamanhosSelector value={guiaId} onChange={setGuiaId} />

          {/* Preços */}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$) *" type="number" step="0.01" value={form.preco} onChange={(e) => setF('preco', e.target.value)} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <input type="checkbox" id="mostrarPrecoAntigo" checked={form.mostrarPrecoAntigo}
                  onChange={(e) => setF('mostrarPrecoAntigo', e.target.checked)} className="accent-gold w-4 h-4" />
                <label htmlFor="mostrarPrecoAntigo" className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
                  Mostrar preço antigo (riscado)
                </label>
              </div>
              {form.mostrarPrecoAntigo && (
                <Input label="Preço Antigo (R$)" type="number" step="0.01" value={form.precoAntigo}
                  onChange={(e) => setF('precoAntigo', e.target.value)} />
              )}
            </div>
          </div>

          {/* Classificação (estrelas) */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">Classificação do Produto</label>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { n: 0, label: 'Sem badge' },
                { n: 3, label: '⭐⭐⭐ Mais Vendidos' },
                { n: 4, label: '⭐⭐⭐⭐ Best-Seller' },
                { n: 5, label: '⭐⭐⭐⭐⭐ Lançamento' },
              ].map(({ n, label }) => (
                <button key={n} type="button" onClick={() => setF('estrelas', n === form.estrelas ? 0 : n)}
                  className={`px-3 py-1.5 text-xs font-semibold border transition-all rounded-sm ${form.estrelas === n && n > 0 ? 'bg-gold text-white border-gold' : 'border-gray-200 text-charcoal-muted hover:border-gold'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-6">
            <Toggle label="Produto Ativo (visível na loja)" checked={form.ativo} onChange={(v) => setF('ativo', v)} />
            <Toggle label="Destaque na Home" checked={form.destaque} onChange={(v) => setF('destaque', v)} />
          </div>
        </div>

        {/* ── 2. PESO E MEDIDAS (obrigatório para frete) ── */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-serif text-lg text-charcoal">2. Peso e Medidas</h2>
            <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Obrigatório para frete</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Peso (gramas) *</label>
              <input type="number" value={form.peso} onChange={(e) => setF('peso', e.target.value)}
                className="input-field" placeholder="500" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Comprimento (cm) *</label>
              <input type="number" value={form.comprimento} onChange={(e) => setF('comprimento', e.target.value)}
                className="input-field" placeholder="30" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Largura (cm) *</label>
              <input type="number" value={form.largura} onChange={(e) => setF('largura', e.target.value)}
                className="input-field" placeholder="20" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Altura (cm) *</label>
              <input type="number" value={form.altura} onChange={(e) => setF('altura', e.target.value)}
                className="input-field" placeholder="5" required />
            </div>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-2">Medidas da embalagem para cálculo preciso de frete (Melhor Envio / Correios)</p>
        </div>

        {/* ── 3. IMAGENS (até 6) ── */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg text-charcoal">3. Imagens ({imagens.length}/6)</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">Máx. 6 imagens · 2MB cada · JPG, PNG, WEBP</p>
            </div>
            {imagens.length < 6 && (
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadando}
                className="flex items-center gap-2 text-xs border border-gold text-gold px-3 py-2 hover:bg-gold hover:text-white transition-colors disabled:opacity-50">
                <Upload size={12} /> {uploadando ? 'Enviando...' : 'Adicionar Imagens'}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileUpload} />

          {imagens.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cream-darker p-12 text-center cursor-pointer hover:border-gold transition-colors">
              <Upload size={24} className="text-charcoal-muted mx-auto mb-2" />
              <p className="text-sm text-charcoal-muted">Clique para adicionar imagens do produto</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {imagens.map((img, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-[3/4] overflow-hidden bg-cream-dark relative">
                    <img src={img.preview ?? img.url} alt={img.alt} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold text-white text-[9px] text-center py-0.5 font-semibold">PRINCIPAL</span>
                    )}
                  </div>
                  <button onClick={() => removerImagem(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {imagens.length < 6 && (
                <div onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] border-2 border-dashed border-cream-darker flex items-center justify-center cursor-pointer hover:border-gold transition-colors">
                  <Plus size={20} className="text-charcoal-muted" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. VARIANTES (Cartelas: Cor + Tamanhos + Estoque) ── */}
        <div className="bg-white rounded-sm shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-lg text-charcoal">4. Variantes (Cor · Tamanhos · Estoque)</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-charcoal-muted">Exibir cor na loja como:</span>
              <button onClick={() => setVisualizacaoCor('hex')}
                className={`flex items-center gap-1 px-2 py-1 border rounded-sm transition-colors ${visualizacaoCor === 'hex' ? 'border-gold text-gold' : 'border-gray-200 text-charcoal-muted'}`}>
                <div className="w-3 h-3 rounded-full bg-gray-400" /> Bolinha
              </button>
              <button onClick={() => setVisualizacaoCor('foto')}
                className={`flex items-center gap-1 px-2 py-1 border rounded-sm transition-colors ${visualizacaoCor === 'foto' ? 'border-gold text-gold' : 'border-gray-200 text-charcoal-muted'}`}>
                <Upload size={11} /> Foto
              </button>
            </div>
          </div>

          {/* Tamanhos globais */}
          <div className="bg-cream/50 border border-cream-darker rounded-sm p-4 mb-5">
            <label className="text-[10px] text-charcoal-muted uppercase font-semibold tracking-wider block mb-2">
              Tamanhos disponíveis (aplicado a todas as cores)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(cartelas[0]?.tamanhos ?? []).map((t) => (
                <span key={t.tamanho} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-sm font-semibold text-charcoal rounded-sm">
                  {t.tamanho}
                  <button type="button" onClick={() => removeTamanhoGlobal(t.tamanho)} className="text-red-400 hover:text-red-600 ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG', '36', '38', '40', '42', '44', '46', 'U'].map(t => {
                const jaExiste = cartelas[0]?.tamanhos.some(x => x.tamanho === t);
                if (jaExiste) return null;
                return (
                  <button key={t} type="button"
                    onClick={() => { setCartelas(prev => prev.map(c => ({ ...c, tamanhos: [...c.tamanhos, { tamanho: t, estoque: 0 }] }))); }}
                    className="px-2 py-1 text-[10px] border border-dashed border-gray-300 text-charcoal-muted hover:border-gold hover:text-gold rounded-sm transition-colors">
                    + {t}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input value={novoTamanhoGlobal} onChange={(e) => setNovoTamanhoGlobal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTamanhoGlobal())}
                placeholder="Outro tamanho personalizado..." className="input-field text-sm flex-1 max-w-xs" />
              <button type="button" onClick={addTamanhoGlobal}
                className="px-3 py-2 border border-gold text-gold text-xs font-semibold hover:bg-gold hover:text-white transition-colors rounded-sm">
                <Plus size={12} className="inline mr-1" /> Adicionar
              </button>
            </div>
            <p className="text-[10px] text-charcoal-muted mt-2">Para adicionar cores, use o botão "Adicionar outra cor" abaixo das cartelas</p>
          </div>

          {/* Cartelas (cada cor) */}
          <div className="space-y-4">
            {cartelas.map((cartela, cIdx) => (
              <div key={cIdx} className="border border-cream-darker rounded-sm overflow-hidden">
                {/* Header da cartela */}
                <div className="bg-cream-dark/50 px-4 py-3 flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: cartela.cor_hex === '#RAINBOW' ? undefined : (cartela.cor_hex || '#ccc'),
                      background: cartela.cor_hex === '#RAINBOW' ? 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' : undefined }} />
                  <span className="font-semibold text-sm text-charcoal">
                    {cartela.cor || `Cartela ${cIdx + 1}`}
                  </span>
                  <span className="text-[10px] text-charcoal-muted uppercase tracking-wider">
                    {cartela.tamanhos.length} tamanhos · {cartela.tamanhos.reduce((s, t) => s + t.estoque, 0)} un. total
                  </span>
                  <button type="button" onClick={() => removeCartela(cIdx)}
                    className="ml-auto text-red-400 hover:text-red-600 transition-colors" title="Remover cartela">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Cor selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-charcoal-muted uppercase font-semibold block mb-1.5">Cor</label>
                      <ColorDropdown value={cartela.cor} hexValue={cartela.cor_hex}
                        onChange={(nome, hex) => updateCartelaCor(cIdx, nome, hex)} />
                    </div>

                    {/* Foto da cor (modo foto) */}
                    {visualizacaoCor === 'foto' && (
                      <div>
                        <label className="text-[10px] text-charcoal-muted uppercase font-semibold block mb-1.5">Foto da peça nessa cor</label>
                        <div className="flex gap-2 items-start flex-wrap">
                          {/* Fotos já cadastradas do produto */}
                          {imagens.length > 0 && (
                            <div className="flex gap-1.5">
                              {imagens.map((img, imgIdx) => (
                                <button key={imgIdx} type="button"
                                  onClick={() => updateCartelaFoto(cIdx, img.url || img.preview || '')}
                                  className={`relative w-12 h-16 overflow-hidden border-2 rounded-sm transition-colors ${cartela.foto_url === (img.url || img.preview) ? 'border-gold' : 'border-gray-200 hover:border-gold/50'}`}>
                                  <img src={img.preview ?? img.url} alt="" className="w-full h-full object-cover" />
                                  {cartela.foto_url === (img.url || img.preview) && (
                                    <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Upload nova foto */}
                          <label className="flex items-center gap-1.5 cursor-pointer border border-dashed border-gray-300 hover:border-gold px-3 py-2 text-xs text-charcoal-muted hover:text-gold transition-colors rounded-sm h-16">
                            <Upload size={12} />
                            <span className="whitespace-nowrap">{cartela.foto_url ? 'Outra' : 'Upload'}</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 2 * 1024 * 1024) { toast.error(`${file.name} excede 2MB`); e.target.value = ''; return; }
                                const fd = new FormData();
                                fd.append('file', file);
                                fd.append('pasta', 'cores');
                                try {
                                  const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                  const d = await res.json();
                                  if (d.url) updateCartelaFoto(cIdx, d.url);
                                  else toast.error('Erro ao enviar foto');
                                } catch { toast.error('Erro ao enviar foto'); }
                                e.target.value = '';
                              }} />
                          </label>
                          {cartela.foto_url && !imagens.some(img => (img.url || img.preview) === cartela.foto_url) && (
                            <div className="relative">
                              <img src={cartela.foto_url} alt="" className="w-12 h-16 object-cover border-2 border-gold rounded-sm" />
                              <button type="button" onClick={() => updateCartelaFoto(cIdx, '')}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px]">✕</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tamanhos + Estoque em tabela */}
                  <div>
                    <label className="text-[10px] text-charcoal-muted uppercase font-semibold block mb-2">Estoque por tamanho</label>
                    <div className="flex flex-wrap gap-3">
                      {cartela.tamanhos.map((t, tIdx) => (
                        <div key={t.tamanho} className="flex items-center gap-2 bg-cream/30 border border-cream-darker rounded-sm px-3 py-2">
                          <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 font-bold text-xs text-charcoal rounded-sm">{t.tamanho}</span>
                          <input type="number" min="0" value={t.estoque}
                            onChange={(e) => updateEstoque(cIdx, tIdx, parseInt(e.target.value) || 0)}
                            className="w-16 text-center text-sm border border-gray-200 rounded-sm py-1 focus:border-gold focus:outline-none" />
                          <span className="text-[10px] text-charcoal-muted">un.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botão adicionar cartela */}
          <button type="button" onClick={addCartela}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-cream-darker text-charcoal-muted hover:border-gold hover:text-gold transition-colors text-sm font-semibold rounded-sm">
            <Plus size={16} /> Adicionar outra cor (nova cartela)
          </button>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pb-8">
          <Button onClick={salvar} loading={loading} className="px-8">Salvar Produto</Button>
          <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
