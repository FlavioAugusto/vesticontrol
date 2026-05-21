'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Heart, Truck, ChevronDown, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import type { ProdutoComDetalhes, ProdutoVariante } from '@/types/database';

interface Props { produto: ProdutoComDetalhes }

const PARCELAS = 6;

// Ícone WhatsApp inline
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.55 4.104 1.513 5.833L.057 23.891a.5.5 0 0 0 .611.611l6.058-1.456A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.93 0-3.73-.527-5.27-1.44l-.376-.224-3.898.937.953-3.798-.245-.39A9.796 9.796 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
    </svg>
  );
}

export default function ProdutoDetalhes({ produto }: Props) {
  const imagens = produto.produto_imagens ?? [];
  const variantes = produto.produto_variantes ?? [];

  const cores = useMemo(() => {
    const map = new Map<string, ProdutoVariante>();
    variantes.forEach((v) => { if (v.cor && !map.has(v.cor)) map.set(v.cor, v); });
    return Array.from(map.values());
  }, [variantes]);

  const [corSelecionada, setCorSelecionada] = useState<string | null>(cores[0]?.cor ?? null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  // Seleções por cor: { [cor]: { tamanho: string|null, quantidade: number } }
  const [selecoesPorCor, setSelecoesPorCor] = useState<Record<string, { tamanho: string | null; quantidade: number }>>(
    () => Object.fromEntries(cores.map(c => [c.cor!, { tamanho: null, quantidade: 1 }]))
  );
  const [imgIdx, setImgIdx] = useState(0);
  const [wishlist, setWishlist] = useState(false);
  const [cep, setCep] = useState('');
  const [descOpen, setDescOpen] = useState(true);
  const [medOpen, setMedOpen] = useState(false);
  const [videoAberto, setVideoAberto] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zoomAtivo, setZoomAtivo] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const [freteOpcoes, setFreteOpcoes] = useState<{ id: number; nome: string; preco: number; prazo: string }[]>([]);
  const [freteBuscando, setFreteBuscando] = useState(false);
  const [freteErro, setFreteErro] = useState('');

  // Carrega guia de tamanhos do banco (admin pode editar)
  const [guiaMedidas, setGuiaMedidas] = useState<{ label: string; P: string; M: string; G: string }[]>([]);
  useEffect(() => {
    fetch('/api/guia-tamanhos', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((d) => {
        if (Array.isArray(d) && d.length > 0 && d[0]?.medidas) {
          setGuiaMedidas(d[0].medidas);
        } else if (Array.isArray(d?.medidas)) {
          setGuiaMedidas(d.medidas);
        }
      })
      .catch(() => {});
  }, []);

  const addItem = useCartStore((s) => s.addItem);
  const setOpen = useCartStore((s) => s.setOpen);

  const [stickyVisible, setStickyVisible] = useState(false);
  const produtoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    if (produtoRef.current) observer.observe(produtoRef.current);
    return () => observer.disconnect();
  }, []);

  const tamanhosDaCor = variantes.filter((v) => v.cor === corSelecionada || !corSelecionada);
  const tamanhos = [...new Set(tamanhosDaCor.map((v) => v.tamanho))];
  const varianteSelecionada = variantes.find((v) => v.cor === corSelecionada && v.tamanho === tamanhoSelecionado);
  const emEstoque = variantes.some((v) => v.estoque > 0);

  // Total de itens selecionados (qtd × tamanho selecionado por cor)
  const totalItensSelecionados = Object.values(selecoesPorCor)
    .filter(s => s.tamanho)
    .reduce((sum, s) => sum + s.quantidade, 0);

  const imgPrincipal = imagens.find((i) => i.principal) ?? imagens[0];
  const imagemAtual = imagens[imgIdx] ?? imgPrincipal;
  const parcela = formatPrice(produto.preco / PARCELAS);

  // Video URL da configuração extra (se existir)
  const videoUrl = (produto as ProdutoComDetalhes & { video_url?: string }).video_url;

  // Zoom do mouse na imagem
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  function handleAddCart() {
    // Coleta todas as cores que têm tamanho selecionado e quantidade > 0
    const selecoesValidas = Object.entries(selecoesPorCor).filter(
      ([, s]) => s.tamanho && s.quantidade > 0
    );
    if (selecoesValidas.length === 0) {
      toast.error('Selecione pelo menos um tamanho');
      return;
    }
    let adicionados = 0;
    let estoqueInsuficiente = false;
    for (const [cor, sel] of selecoesValidas) {
      const v = variantes.find((x) => x.cor === cor && x.tamanho === sel.tamanho);
      if (!v) continue;
      if (v.estoque < sel.quantidade) { estoqueInsuficiente = true; continue; }
      const corVar = variantes.find((x) => x.cor === cor);
      addItem({
        id: crypto.randomUUID(),
        produto_id: produto.id,
        variante_id: v.id,
        nome: produto.nome,
        slug: produto.slug,
        preco: produto.preco,
        tamanho: sel.tamanho!,
        cor,
        cor_hex: corVar?.cor_hex ?? undefined,
        quantidade: sel.quantidade,
        imagem: (corVar as { foto_url?: string })?.foto_url ?? imgPrincipal?.url,
      });
      adicionados++;
    }
    if (estoqueInsuficiente) toast.error('Algumas peças estão com estoque insuficiente');
    if (adicionados > 0) {
      setOpen(true);
      toast.success(adicionados === 1 ? 'Adicionado ao carrinho!' : `${adicionados} peças adicionadas!`);
    }
  }

  function setSelecaoCor(cor: string, patch: Partial<{ tamanho: string | null; quantidade: number }>) {
    setSelecoesPorCor(prev => ({
      ...prev,
      [cor]: { tamanho: prev[cor]?.tamanho ?? null, quantidade: prev[cor]?.quantidade ?? 1, ...patch }
    }));
  }

  async function calcularFrete() {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) { setFreteErro('CEP inválido'); return; }
    setFreteBuscando(true);
    setFreteErro('');
    setFreteOpcoes([]);
    try {
      const res = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: digits,
          produtos: [{ id: produto.id, quantidade: quantidade, preco_unitario: produto.preco, peso_gramas: produto.peso_gramas }],
        }),
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setFreteOpcoes(data);
      } else {
        setFreteErro('Nenhuma opção de frete encontrada para este CEP.');
      }
    } catch {
      setFreteErro('Erro ao calcular frete. Tente novamente.');
    } finally {
      setFreteBuscando(false);
    }
  }

  function compartilharWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const texto = encodeURIComponent(`Olha que lindo! *${produto.nome}* por apenas *${formatPrice(produto.preco)}* na Sem foto 👗✨\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  }

  return (
    <>
    <div ref={produtoRef} className="grid md:grid-cols-2 gap-4 sm:gap-8 md:gap-10 lg:gap-16">

      {/* ─── GALERIA ─── */}
      <div className="flex gap-2 sm:gap-3">
        {/* Miniaturas */}
        {imagens.length > 1 && (
          <div className="flex flex-col gap-1.5 sm:gap-2 w-12 sm:w-16 shrink-0">
            {imagens.map((img, idx) => (
              <button key={img.id} onClick={() => setImgIdx(idx)}
                className={`relative aspect-[3/4] overflow-hidden border-2 transition-colors ${idx === imgIdx ? 'border-charcoal' : 'border-transparent hover:border-gray-300'}`}>
                <Image src={img.url} alt={img.alt ?? produto.nome} fill className="object-cover" sizes="64px" />
              </button>
            ))}
            {/* Miniatura de vídeo */}
            {videoUrl && (
              <button onClick={() => setVideoAberto(true)}
                className="relative aspect-[3/4] overflow-hidden border-2 border-transparent hover:border-charcoal bg-charcoal flex items-center justify-center transition-colors">
                <Play size={16} className="text-white fill-white" />
              </button>
            )}
          </div>
        )}

        {/* Imagem principal com zoom */}
        <div className="flex-1">
          <div
            ref={imgRef}
            className="relative overflow-hidden bg-gray-50 cursor-crosshair"
            style={{ aspectRatio: '3/4' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setZoomAtivo(true)}
            onMouseLeave={() => setZoomAtivo(false)}
          >
            {imagemAtual ? (
              <Image
                src={imagemAtual.url}
                alt={imagemAtual.alt ?? produto.nome}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top"
                priority
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: zoomAtivo ? 'scale(2)' : 'scale(1)',
                  transition: zoomAtivo ? 'none' : 'transform 0.3s ease',
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cream-dark">
                <span className="font-display text-charcoal/20 text-2xl text-center px-6">Sem foto</span>
              </div>
            )}

            {/* Badge */}
            {produto.badge && (
              <div className="absolute top-3 left-3 z-10">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${produto.badge === 'lancamento' ? 'bg-gold text-white' : produto.badge === 'bestseller' ? 'bg-rose text-white' : 'bg-charcoal text-cream'}`}>
                  {produto.badge === 'lancamento' ? 'Lançamento' : produto.badge === 'bestseller' ? 'Best-Seller' : 'Mais Vendidos'}
                </span>
              </div>
            )}

            {/* Desconto */}
            {produto.preco_antigo && (
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-rose text-white text-[10px] font-bold px-2 py-1">
                  -{Math.round((1 - produto.preco / produto.preco_antigo) * 100)}% OFF
                </span>
              </div>
            )}

            {/* Setas */}
            {imagens.length > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + imagens.length) % imagens.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white z-10">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setImgIdx((i) => (i + 1) % imagens.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white z-10">
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Botão vídeo sobre a imagem */}
            {videoUrl && (
              <button onClick={() => setVideoAberto(true)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-charcoal/80 hover:bg-charcoal text-white text-[10px] font-semibold px-3 py-2 rounded-sm backdrop-blur-sm transition-colors">
                <Play size={11} className="fill-white" /> Ver Vídeo
              </button>
            )}
          </div>

          {/* Dots */}
          {imagens.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {imagens.map((_, idx) => (
                <button key={idx} onClick={() => setImgIdx(idx)}
                  className={`rounded-full transition-all ${idx === imgIdx ? 'w-5 h-1.5 bg-charcoal' : 'w-1.5 h-1.5 bg-gray-300'}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── INFORMAÇÕES ─── */}
      <div className="flex flex-col gap-5">
        {/* Nome e categoria — centralizados */}
        <div className="text-center">
          {produto.categorias && (
            <p className="text-[10px] text-charcoal-muted uppercase tracking-[3px] font-sans font-semibold mb-2">
              {produto.categorias.nome}
            </p>
          )}
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-charcoal leading-snug">{produto.nome}</h1>
        </div>

        {/* Preço — centralizado */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-charcoal">{formatPrice(produto.preco)}</span>
            {produto.preco_antigo && (
              <span className="text-charcoal-muted text-base line-through">{formatPrice(produto.preco_antigo)}</span>
            )}
          </div>
          <p className="text-sm text-charcoal-muted mt-1">
            EM ATÉ <strong className="text-charcoal">{PARCELAS}X</strong> DE{' '}
            <strong className="text-charcoal">{parcela}</strong> SEM JUROS
          </p>
        </div>

        {/* Grid de cores: foto + tamanhos + quantidade por linha */}
        {cores.length > 0 && (
          <div className="border border-gray-100 rounded-sm overflow-hidden">
            <div className="bg-cream-dark/40 px-4 py-2.5 border-b border-gray-100">
              <p className="text-[11px] font-semibold text-charcoal uppercase tracking-wider">
                Selecione cor, tamanho e quantidade
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {cores.map((v) => {
                const fotoUrl = (v as { cor_hex?: string; foto_url?: string }).foto_url ?? imgPrincipal?.url;
                const sel = selecoesPorCor[v.cor!] ?? { tamanho: null, quantidade: 1 };
                const tamanhosDestaCor = [...new Set(variantes.filter(x => x.cor === v.cor).map(x => x.tamanho))];
                const ativa = !!sel.tamanho;
                return (
                  <div key={v.id}
                    className={`flex items-center gap-3 px-3 py-3 transition-colors ${ativa ? 'bg-gold/5' : 'hover:bg-gray-50'}`}>
                    {/* Foto + nome */}
                    <button
                      onClick={() => {
                        setCorSelecionada(v.cor);
                        if (fotoUrl) { const idx = imagens.findIndex((i) => i.url === fotoUrl); if (idx >= 0) setImgIdx(idx); }
                      }}
                      className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`relative overflow-hidden border-2 transition-all ${corSelecionada === v.cor ? 'border-charcoal' : 'border-gray-200'}`}
                        style={{ width: 56, height: 64 }}>
                        {fotoUrl ? (
                          <Image src={fotoUrl} alt={v.cor ?? ''} fill className="object-cover object-top" sizes="56px" />
                        ) : (
                          <div className="w-full h-full" style={{ backgroundColor: v.cor_hex ?? '#ccc' }} />
                        )}
                      </div>
                      <span className="text-[10px] text-charcoal leading-tight text-center max-w-[56px] truncate">{v.cor}</span>
                    </button>

                    {/* Tamanhos */}
                    <div className="flex flex-wrap gap-1.5 flex-1 justify-center">
                      {tamanhosDestaCor.map((tam) => {
                        const variante = variantes.find((x) => x.cor === v.cor && x.tamanho === tam);
                        const semEstoque = !variante || variante.estoque === 0;
                        const selecionado = sel.tamanho === tam;
                        return (
                          <button key={tam} disabled={semEstoque}
                            onClick={() => setSelecaoCor(v.cor!, { tamanho: tam })}
                            className={`min-w-[40px] h-10 px-2.5 border text-xs font-semibold transition-all
                              ${selecionado ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-charcoal hover:border-charcoal'}
                              ${semEstoque ? 'opacity-40 cursor-not-allowed line-through' : ''}`}>
                            {tam}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => setSelecaoCor(v.cor!, { quantidade: Math.max(1, sel.quantidade - 1) })}
                        className="w-8 h-9 border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-9 h-9 border-y border-gray-200 flex items-center justify-center text-sm font-semibold">
                        {sel.quantidade}
                      </span>
                      <button
                        onClick={() => setSelecaoCor(v.cor!, { quantidade: sel.quantidade + 1 })}
                        className="w-8 h-9 border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button onClick={handleAddCart} disabled={!emEstoque || totalItensSelecionados === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-charcoal text-white py-4 text-xs font-bold tracking-[2px] uppercase hover:bg-charcoal-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95">
            <ShoppingBag size={16} />
            {!emEstoque ? 'ESGOTADO' :
             totalItensSelecionados === 0 ? 'SELECIONE UM TAMANHO' :
             `EU QUERO! (${totalItensSelecionados} ${totalItensSelecionados === 1 ? 'PEÇA' : 'PEÇAS'})`}
          </button>
          <button onClick={() => { setWishlist(!wishlist); toast.success(wishlist ? 'Removido dos desejos' : 'Adicionado aos desejos'); }}
            className={`w-14 h-14 border flex items-center justify-center transition-all ${wishlist ? 'border-rose bg-rose/5 text-rose' : 'border-gray-200 text-charcoal-muted hover:border-rose hover:text-rose'}`}>
            <Heart size={18} fill={wishlist ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Guia de Tamanhos & Medidas — sempre aberto, logo abaixo dos botões */}
        <div className="border border-gray-100 p-4">
          <p className="text-sm font-semibold text-charcoal mb-3 tracking-wider uppercase">Guia de Tamanhos e Medidas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-charcoal text-cream">
                  {['Medida', 'P', 'M', 'G'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(guiaMedidas.length > 0 ? guiaMedidas : [
                  { label: 'Busto', P: '90 cm', M: '94 cm', G: '98 cm' },
                  { label: 'Cintura', P: '72 cm', M: '76 cm', G: '80 cm' },
                  { label: 'Quadril', P: '96 cm', M: '100 cm', G: '104 cm' },
                  { label: 'Comprimento', P: '102 cm', M: '104 cm', G: '106 cm' },
                ]).map((m, i) => (
                  <tr key={m.label} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
                    <td className="px-3 py-2.5 font-semibold text-charcoal border-b border-gray-100">{m.label}</td>
                    <td className="px-3 py-2.5 text-center text-charcoal-muted border-b border-gray-100">{m.P}</td>
                    <td className="px-3 py-2.5 text-center text-charcoal-muted border-b border-gray-100">{m.M}</td>
                    <td className="px-3 py-2.5 text-center text-charcoal-muted border-b border-gray-100">{m.G}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-2">* Medidas aproximadas. Em caso de dúvida, prefira o tamanho maior.</p>
        </div>

        {/* Calcular frete */}
        <div className="border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={15} className="text-charcoal-muted" />
            <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">Frete e prazo</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={cep}
              onChange={(e) => { setCep(e.target.value.replace(/\D/g, '').slice(0, 8)); setFreteOpcoes([]); setFreteErro(''); }}
              onKeyDown={(e) => e.key === 'Enter' && calcularFrete()}
              placeholder="00000-000"
              maxLength={8}
              className="flex-1 border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-charcoal transition-colors"
            />
            <button
              onClick={calcularFrete}
              disabled={freteBuscando}
              className="px-4 py-2.5 border border-charcoal text-xs font-semibold uppercase tracking-wider hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50"
            >
              {freteBuscando ? '...' : 'Calcular'}
            </button>
          </div>
          <a href="https://buscacepinter.correios.com.br" target="_blank" rel="noopener"
            className="text-[11px] text-gold hover:underline mt-1.5 inline-block">
            Não sei meu CEP
          </a>
          {freteErro && <p className="text-xs text-red-500 mt-2">{freteErro}</p>}
          {freteOpcoes.length > 0 && (
            <div className="mt-3 space-y-2">
              {freteOpcoes.map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-cream p-2.5 rounded-sm">
                  <div>
                    <p className="text-xs font-semibold text-charcoal">{o.nome}</p>
                    <p className="text-[10px] text-charcoal-muted">{o.prazo}</p>
                  </div>
                  <span className="text-xs font-bold text-gold">
                    {o.preco === 0 ? 'Grátis' : `R$ ${o.preco.toFixed(2).replace('.', ',')}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compartilhar via WhatsApp */}
        <button onClick={compartilharWhatsApp}
          className="flex items-center justify-center gap-2 border border-green-500 text-green-600 py-2.5 text-xs font-semibold tracking-wider uppercase hover:bg-green-500 hover:text-white transition-colors">
          <WhatsAppIcon size={15} />
          Compartilhar no WhatsApp
        </button>

        {/* Acordeão */}
        <div className="border-t border-gray-100 pt-4 space-y-1">
          {/* Descrição */}
          <div className="border-b border-gray-100">
            <button onClick={() => setDescOpen(!descOpen)}
              className="w-full flex items-center justify-between py-4 text-sm font-semibold text-charcoal hover:text-gold transition-colors">
              Descrição
              <ChevronDown size={16} className={`transition-transform ${descOpen ? 'rotate-180' : ''}`} />
            </button>
            {descOpen && (
              <div className="pb-5 text-sm text-charcoal-muted leading-relaxed space-y-3">
                <p>{produto.descricao ?? 'Peça de alta costura. Confeccionada com tecidos selecionados.'}</p>
                <ul className="space-y-1.5 text-xs">
                  <li><span className="font-semibold text-charcoal">Composição:</span> Tricoline 100% Algodão</li>
                  {produto.categorias?.nome && (
                    <li><span className="font-semibold text-charcoal">Coleção:</span> {produto.categorias.nome}</li>
                  )}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>

    {/* Modal de Vídeo */}
    {videoAberto && videoUrl && (
      <div className="fixed inset-0 z-50 bg-charcoal/85 flex items-center justify-center p-4"
        onClick={() => setVideoAberto(false)}>
        <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <div className="aspect-video bg-black">
            <iframe
              src={videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
                ? videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1'
                : videoUrl}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <button onClick={() => setVideoAberto(false)}
            className="absolute -top-10 right-0 text-white text-sm font-semibold hover:text-gold transition-colors">
            ✕ Fechar vídeo
          </button>
        </div>
      </div>
    )}

    {/* Barra sticky */}
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ${stickyVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="relative w-14 h-16 shrink-0 overflow-hidden bg-gray-100 hidden sm:block">
          {imgPrincipal && <Image src={imgPrincipal.url} alt={produto.nome} fill className="object-cover object-top" sizes="56px" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-sm text-charcoal truncate">{produto.nome}</p>
          <p className="text-xs text-charcoal-muted mt-0.5">
            {totalItensSelecionados > 0
              ? `${totalItensSelecionados} ${totalItensSelecionados === 1 ? 'peça selecionada' : 'peças selecionadas'}`
              : 'Selecione tamanho e cor'}
          </p>
        </div>
        <div className="hidden md:block text-right shrink-0">
          <p className="font-bold text-lg text-charcoal">{formatPrice(produto.preco)}</p>
          <p className="text-[11px] text-charcoal-muted">{PARCELAS}x de {parcela} sem juros</p>
        </div>
        <button onClick={handleAddCart} disabled={!emEstoque || totalItensSelecionados === 0}
          className="flex items-center justify-center gap-2 bg-charcoal text-white px-6 py-3 text-xs font-bold tracking-[2px] uppercase hover:bg-charcoal-light transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap">
          <ShoppingBag size={14} /> EU QUERO!
        </button>
      </div>
    </div>
    </>
  );
}
