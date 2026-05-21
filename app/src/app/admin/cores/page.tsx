'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Palette, Check, Camera, X, Pipette, Search } from 'lucide-react';
import { CORES_PREDEFINIDAS } from '@/components/admin/ColorDropdown';

interface Cor { nome: string; hex: string }

function isRainbow(hex: string) { return hex === '#RAINBOW'; }
function corStyle(hex: string): React.CSSProperties {
  if (isRainbow(hex)) return { background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' };
  return { backgroundColor: hex };
}

// ─── Componente: Seletor de cor por imagem ──────────────────────────────────
function ColorPickerImagem({ onSelectColor }: { onSelectColor: (hex: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const desenharImagem = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      const maxW = 400, maxH = 300;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }, []);

  useEffect(() => {
    if (imageSrc) desenharImagem(imageSrc);
  }, [imageSrc, desenharImagem]);

  function getColorAtPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    setHoverColor(getColorAtPoint(e));
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const hex = getColorAtPoint(e);
    if (hex) {
      onSelectColor(hex);
      toast.success(`Cor ${hex} selecionada! Adicione o nome abaixo.`);
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Pipette size={14} className="text-gold" />
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Capturar da foto</p>
      </div>

      {!imageSrc ? (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gold hover:bg-gold/5 transition-all">
          <Camera size={22} className="text-gray-400" />
          <p className="text-xs text-gray-500 text-center">Envie uma foto do tecido ou produto<br />e clique na cor desejada</p>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-gray-200 cursor-crosshair">
            <canvas
              ref={canvasRef}
              className="w-full"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverColor(null)}
              onClick={handleClick}
            />
            {/* Hover preview */}
            {hoverColor && (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/95 rounded-lg px-2.5 py-1.5 shadow-lg text-xs font-bold">
                <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: hoverColor }} />
                {hoverColor}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1"><Pipette size={11} /> Clique na cor desejada</span>
            <button onClick={() => setImageSrc(null)} className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <X size={11} /> Remover foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────
export default function AdminCoresPage() {
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState('');
  const [novoHex, setNovoHex] = useState('#B89155');
  const [salvando, setSalvando] = useState(false);
  const [lojaId, setLojaId] = useState<string>('');
  const [nomeLoja, setNomeLoja] = useState<string>('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    (async () => {
      // Pega loja_id ANTES de carregar (sem race condition)
      let lid = '';
      try {
        const r = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          lid = d.loja_id || '';
          setLojaId(lid);
          setNomeLoja(d.loja?.nome || '');
        }
      } catch {}
      carregar(lid);
    })();
  }, []);

  async function carregar(lid?: string) {
    setLoading(true);
    try {
      const id = lid || lojaId;
      const url = id ? `/api/admin/cores?loja_id=${encodeURIComponent(id)}` : '/api/admin/cores';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setCores(Array.isArray(data) ? data : []);
    } catch { toast.error('Erro ao carregar cores'); }
    finally { setLoading(false); }
  }

  // Filtragem por busca (nome ou hex)
  const coresFiltradas = cores.filter(c => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return c.nome.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q);
  });

  async function adicionar() {
    const nome = novoNome.trim();
    if (!nome) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/admin/cores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, hex: novoHex, loja_id: lojaId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return; }
      setCores(data.cores);
      setNovoNome('');
      setNovoHex('#B89155');
      toast.success(`Cor "${nome}" adicionada!`);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  async function remover(nome: string) {
    try {
      const res = await fetch('/api/admin/cores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, loja_id: lojaId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro ao remover'); return; }
      setCores(data.cores);
      toast.success(`Cor "${nome}" removida`);
    } catch { toast.error('Erro ao remover'); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-charcoal tracking-tight">Cores Personalizadas</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as cores disponíveis nas variantes dos produtos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Formulário nova cor */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Plus size={16} className="text-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-charcoal text-sm">Adicionar nova cor</h2>
                <p className="text-[11px] text-gray-400">Ficará disponível em todos os produtos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">Selecionar cor</label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={novoHex}
                      onChange={e => setNovoHex(e.target.value)}
                      className="w-14 h-14 rounded-xl border border-gray-200 cursor-pointer p-1 shadow-sm"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{novoHex.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">Clique para alterar</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">Nome da cor</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar(); } }}
                  placeholder="Ex: Fendi, Terracota, Marsala..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
                />
              </div>

              {/* Preview */}
              {novoNome && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-md flex-shrink-0" style={corStyle(novoHex)} />
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{novoNome}</p>
                    <p className="text-[11px] text-gray-400">Preview da cor</p>
                  </div>
                </div>
              )}

              <button
                onClick={adicionar}
                disabled={!novoNome.trim() || salvando}
                className="w-full bg-gradient-to-r from-gold to-gold-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-gold-600 hover:to-gold-700 transition-all shadow-md shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Plus size={14} /> Adicionar cor</>
                )}
              </button>

              {/* Seletor por imagem */}
              <ColorPickerImagem onSelectColor={(hex) => setNovoHex(hex)} />
            </div>
          </div>
        </div>

        {/* Cores personalizadas */}
        <div className="lg:col-span-2 space-y-6">

          {/* Minhas cores */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                <Palette size={16} className="text-gold" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-charcoal text-sm">Minhas cores personalizadas</h2>
                <p className="text-[11px] text-gray-400">
                  {cores.length} {cores.length === 1 ? 'cor adicionada' : 'cores adicionadas'}
                  {busca && cores.length > 0 && ` · ${coresFiltradas.length} filtrada${coresFiltradas.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {/* Filtro de busca */}
            {cores.length > 0 && (
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/40">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar cor por nome ou hex (ex: Fendi, #B89155)..."
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2 text-sm text-charcoal placeholder:text-gray-400 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all bg-white"
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-charcoal rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Carregando...</p>
              </div>
            ) : cores.length === 0 ? (
              <div className="py-12 text-center">
                <Palette size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Nenhuma cor personalizada ainda</p>
                <p className="text-gray-300 text-xs mt-1">Use o formulário ao lado para adicionar</p>
              </div>
            ) : coresFiltradas.length === 0 ? (
              <div className="py-12 text-center">
                <Search size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">Nenhuma cor encontrada</p>
                <p className="text-gray-300 text-xs mt-1">Tente outro termo de busca</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {coresFiltradas.map(c => (
                  <div key={c.nome} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors group">
                    <div className="w-10 h-10 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm" style={corStyle(c.hex)} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">{c.nome}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{c.hex}</p>
                    </div>
                    <button
                      onClick={() => remover(c.nome)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cores predefinidas (referência) */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-charcoal text-sm">Cores predefinidas do sistema</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">{CORES_PREDEFINIDAS.length} cores — sempre disponíveis, não podem ser removidas</p>
            </div>
            <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {CORES_PREDEFINIDAS.map(c => (
                <div key={c.nome} className="flex flex-col items-center gap-1.5 group cursor-default">
                  <div className="w-9 h-9 rounded-xl border border-gray-200 shadow-sm" style={corStyle(c.hex)} />
                  <span className="text-[9px] text-gray-400 text-center leading-tight line-clamp-2">{c.nome}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
