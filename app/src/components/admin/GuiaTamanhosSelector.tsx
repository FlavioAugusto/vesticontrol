'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';

export interface GuiaTamanhos {
  id: string;
  nome: string;
  categoria?: string;
  medidas: { label: string; P: string; M: string; G: string }[];
  imagem_url: string;
  dica: string;
}

interface Props {
  value: string | null; // ID do guia selecionado
  onChange: (id: string | null) => void;
}

export default function GuiaTamanhosSelector({ value, onChange }: Props) {
  const [guias, setGuias] = useState<GuiaTamanhos[]>([]);
  const [expandido, setExpandido] = useState(false);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [novoGuia, setNovoGuia] = useState<GuiaTamanhos>({
    id: '',
    nome: '',
    medidas: [
      { label: 'Busto', P: '', M: '', G: '' },
      { label: 'Cintura', P: '', M: '', G: '' },
      { label: 'Quadril', P: '', M: '', G: '' },
      { label: 'Comprimento', P: '', M: '', G: '' },
    ],
    imagem_url: '',
    dica: 'Meça em centímetros com a fita bem ajustada ao corpo.',
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch('/api/admin/guias-tamanhos')
      .then(r => r.json())
      .then(setGuias)
      .catch(() => {});
  }, []);

  const guiaAtual = guias.find(g => g.id === value);

  async function salvarNovoGuia() {
    if (!novoGuia.nome.trim()) { toast.error('Informe um nome para o guia'); return; }
    setSalvando(true);
    const id = novoGuia.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const guiaComId = { ...novoGuia, id };
    const novosGuias = [...guias, guiaComId];
    try {
      await fetch('/api/admin/guias-tamanhos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novosGuias),
      });
      setGuias(novosGuias);
      onChange(guiaComId.id);
      setCriandoNovo(false);
      toast.success('Guia criado e selecionado!');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  function updateMedida(idx: number, col: 'label' | 'P' | 'M' | 'G', val: string) {
    setNovoGuia(prev => ({
      ...prev,
      medidas: prev.medidas.map((m, i) => i === idx ? { ...m, [col]: val } : m),
    }));
  }

  function addMedida() {
    setNovoGuia(prev => ({
      ...prev,
      medidas: [...prev.medidas, { label: '', P: '', M: '', G: '' }],
    }));
  }

  return (
    <div className="border border-cream-darker rounded-sm">
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-cream transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-charcoal">Guia de Tamanhos e Medidas</span>
          {guiaAtual && (
            <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-sm font-semibold">
              {guiaAtual.nome}
            </span>
          )}
        </div>
        {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expandido && (
        <div className="border-t border-cream-darker p-4 space-y-4">

          {/* Selecionar guia existente — agrupado por categoria */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
              Usar guia existente
            </label>
            <div className="space-y-3">
              {(() => {
                const grupos = new Map<string, GuiaTamanhos[]>();
                guias.forEach(g => {
                  const cat = g.categoria || 'Geral';
                  if (!grupos.has(cat)) grupos.set(cat, []);
                  grupos.get(cat)!.push(g);
                });
                return Array.from(grupos.entries()).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1.5">{cat}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((g) => (
                        <label key={g.id} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors rounded-sm ${value === g.id ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-400'}`}>
                          <input type="radio" name="guia" checked={value === g.id} onChange={() => onChange(g.id)} className="accent-gold" />
                          <div>
                            <p className="text-sm font-semibold text-charcoal">{g.nome}</p>
                            <p className="text-[10px] text-charcoal-muted">{g.medidas.map(m => m.label).join(' · ')}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
              <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors rounded-sm ${!value ? 'border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}>
                <input type="radio" name="guia" checked={!value} onChange={() => onChange(null)} className="accent-gold" />
                <span className="text-sm text-charcoal-muted">Sem guia de tamanhos</span>
              </label>
            </div>
          </div>

          {/* Preview do guia selecionado */}
          {guiaAtual && (
            <div className="bg-cream p-3 rounded-sm">
              <p className="text-xs font-semibold text-charcoal mb-2">Preview: {guiaAtual.nome}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-charcoal text-cream">
                      <th className="px-2 py-1.5 text-left">Medida</th>
                      <th className="px-2 py-1.5 text-center">P</th>
                      <th className="px-2 py-1.5 text-center">M</th>
                      <th className="px-2 py-1.5 text-center">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guiaAtual.medidas.map((m, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
                        <td className="px-2 py-1.5 font-semibold">{m.label}</td>
                        <td className="px-2 py-1.5 text-center text-charcoal-muted">{m.P}</td>
                        <td className="px-2 py-1.5 text-center text-charcoal-muted">{m.M}</td>
                        <td className="px-2 py-1.5 text-center text-charcoal-muted">{m.G}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {guiaAtual.dica && <p className="text-[10px] text-charcoal-muted mt-2 italic">{guiaAtual.dica}</p>}
            </div>
          )}

          {/* Criar novo guia */}
          <div className="border-t border-cream-darker pt-3">
            <button type="button" onClick={() => setCriandoNovo(!criandoNovo)}
              className="flex items-center gap-2 text-xs text-gold hover:underline">
              <Plus size={12} /> {criandoNovo ? 'Cancelar' : 'Criar novo guia de tamanhos'}
            </button>

            {criandoNovo && (
              <div className="mt-4 space-y-4 bg-cream/50 p-4 rounded-sm">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nome do guia *" placeholder="Ex: Vestidos Midi, Conjuntos Premium..."
                    value={novoGuia.nome} onChange={(e) => setNovoGuia(p => ({ ...p, nome: e.target.value }))} />
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Categoria do guia</label>
                    <div className="flex gap-2">
                      <select className="input-field text-sm" value={novoGuia.categoria || ''}
                        onChange={(e) => setNovoGuia(p => ({ ...p, categoria: e.target.value }))}>
                        <option value="">Selecionar...</option>
                        {Array.from(new Set(guias.map(g => g.categoria).filter(Boolean))).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Vestidos">Vestidos</option>
                        <option value="Conjuntos">Conjuntos</option>
                        <option value="Saias">Saias</option>
                        <option value="Blusas">Blusas</option>
                        <option value="Calças">Calças</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">Tabela de Medidas</label>
                    <button type="button" onClick={addMedida} className="text-[10px] text-gold hover:underline flex items-center gap-1">
                      <Plus size={10} /> Adicionar medida
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-charcoal text-cream">
                          {['Medida', 'P', 'M', 'G', ''].map(h => (
                            <th key={h} className="px-2 py-1.5 text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {novoGuia.medidas.map((m, i) => (
                          <tr key={i} className="border-b border-cream-darker">
                            <td className="pr-2 py-1">
                              <input value={m.label} onChange={(e) => updateMedida(i, 'label', e.target.value)}
                                placeholder="Busto" className="input-field text-xs py-1" />
                            </td>
                            {(['P', 'M', 'G'] as const).map(col => (
                              <td key={col} className="pr-2 py-1">
                                <input value={m[col]} onChange={(e) => updateMedida(i, col, e.target.value)}
                                  placeholder="88-92 cm" className="input-field text-xs py-1 w-24" />
                              </td>
                            ))}
                            <td className="py-1">
                              <button type="button" onClick={() => setNovoGuia(p => ({ ...p, medidas: p.medidas.filter((_, j) => j !== i) }))}
                                className="text-red-400 hover:text-red-600">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Dica de como medir</label>
                  <textarea rows={2} className="input-field resize-none text-xs" value={novoGuia.dica}
                    onChange={(e) => setNovoGuia(p => ({ ...p, dica: e.target.value }))} />
                </div>

                <button type="button" onClick={salvarNovoGuia} disabled={salvando}
                  className="flex items-center gap-2 bg-gold text-white px-4 py-2 text-xs font-semibold hover:bg-gold-600 transition-colors disabled:opacity-50">
                  <Save size={12} /> {salvando ? 'Salvando...' : 'Salvar e Usar este Guia'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
