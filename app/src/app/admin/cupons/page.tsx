'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Plus, Trash2, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Cupom {
  id: string; codigo: string; tipo: 'percentual' | 'fixo' | 'frete_gratis';
  valor: number | null; uso_maximo: number | null; uso_atual: number;
  valor_minimo: number | null; ativo: boolean; valido_ate: string | null;
}

const TIPO_LABELS = { percentual: '% Desconto', fixo: 'R$ Fixo', frete_gratis: 'Frete Grátis' };

export default function AdminCuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [novo, setNovo] = useState<Partial<Cupom> & { tipo: 'percentual'|'fixo'|'frete_gratis' } | null>(null);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  useEffect(() => { carregarCupons(); }, []);

  async function carregarCupons() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cupons');
      const d = await res.json();
      setCupons(d.cupons ?? []);
    } catch { toast.error('Erro ao carregar cupons'); }
    finally { setLoading(false); }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    try {
      await fetch('/api/admin/cupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo }),
      });
      setCupons(prev => prev.map(c => c.id === id ? { ...c, ativo } : c));
      toast.success(ativo ? 'Cupom ativado' : 'Cupom desativado');
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function deletar(id: string) {
    try {
      await fetch('/api/admin/cupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setCupons(prev => prev.filter(c => c.id !== id));
      toast.success('Cupom excluído');
    } catch { toast.error('Erro ao excluir'); }
  }

  async function criarCupom() {
    if (!novo?.codigo) { toast.error('Informe o código'); return; }
    setSalvandoNovo(true);
    try {
      const res = await fetch('/api/admin/cupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: novo.codigo.toUpperCase().trim(),
          tipo: novo.tipo ?? 'percentual',
          valor: novo.valor ?? null,
          uso_maximo: novo.uso_maximo ?? null,
          valor_minimo: novo.valor_minimo ?? null,
          ativo: true,
          valido_ate: novo.valido_ate ?? null,
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? 'Erro ao criar'); return; }
      setCupons(prev => [d.cupom, ...prev]);
      setNovo(null);
      toast.success('Cupom criado com sucesso!');
    } catch { toast.error('Erro ao criar cupom'); }
    finally { setSalvandoNovo(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-charcoal">Cupons de Desconto</h1>
          <p className="text-charcoal-muted text-sm">{cupons.length} cupons cadastrados</p>
        </div>
        <Button size="sm" onClick={() => setNovo({ tipo: 'percentual', ativo: true })}>
          <Plus size={14} /> Novo Cupom
        </Button>
      </div>

      {/* Form novo cupom */}
      {novo && (
        <div className="bg-white rounded-sm shadow-sm p-5 mb-5 border-l-4 border-gold">
          <h3 className="font-serif text-lg text-charcoal mb-4">Novo Cupom</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Código *" placeholder="EX: DESCONTO20" value={novo.codigo ?? ''}
              onChange={(e) => setNovo({ ...novo, codigo: e.target.value.toUpperCase() })} />
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Tipo *</label>
              <select className="input-field" value={novo.tipo}
                onChange={(e) => setNovo({ ...novo, tipo: e.target.value as typeof novo.tipo })}>
                <option value="percentual">% Percentual</option>
                <option value="fixo">R$ Valor Fixo</option>
                <option value="frete_gratis">Frete Grátis</option>
              </select>
            </div>
            {novo.tipo !== 'frete_gratis' && (
              <Input label={novo.tipo === 'percentual' ? 'Desconto (%)' : 'Valor (R$)'} type="number" min="0"
                value={novo.valor ?? ''} onChange={(e) => setNovo({ ...novo, valor: Number(e.target.value) })} />
            )}
            <Input label="Valor Mínimo do Pedido (R$)" type="number" min="0" placeholder="0 = sem mínimo"
              value={novo.valor_minimo ?? ''} onChange={(e) => setNovo({ ...novo, valor_minimo: Number(e.target.value) || null })} />
            <Input label="Limite de Usos" type="number" min="1" placeholder="Em branco = ilimitado"
              value={novo.uso_maximo ?? ''} onChange={(e) => setNovo({ ...novo, uso_maximo: Number(e.target.value) || null })} />
            <Input label="Válido até (opcional)" type="date"
              value={novo.valido_ate ?? ''} onChange={(e) => setNovo({ ...novo, valido_ate: e.target.value || null })} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={salvandoNovo} onClick={criarCupom}>Criar Cupom</Button>
            <Button variant="outline" onClick={() => setNovo(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Tabela de cupons */}
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-darker bg-cream">
              {['Código', 'Tipo', 'Desconto', 'Mínimo', 'Usos', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-charcoal-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">Carregando...</td></tr>
            ) : cupons.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-charcoal-muted">Nenhum cupom cadastrado</td></tr>
            ) : cupons.map(c => (
              <tr key={c.id} className="border-b border-cream-darker hover:bg-cream transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-gold shrink-0" />
                    <span className="font-mono font-bold text-charcoal">{c.codigo}</span>
                  </div>
                  {c.valido_ate && <p className="text-[10px] text-charcoal-muted mt-0.5">Até {new Date(c.valido_ate).toLocaleDateString('pt-BR')}</p>}
                </td>
                <td className="px-5 py-3 text-charcoal-muted text-xs">{TIPO_LABELS[c.tipo]}</td>
                <td className="px-5 py-3 font-semibold text-gold">
                  {c.tipo === 'percentual' ? `${c.valor}%` : c.tipo === 'fixo' ? formatPrice(c.valor ?? 0) : 'Grátis'}
                </td>
                <td className="px-5 py-3 text-charcoal-muted">{c.valor_minimo ? formatPrice(c.valor_minimo) : '—'}</td>
                <td className="px-5 py-3 text-charcoal-muted">{c.uso_atual}/{c.uso_maximo ?? '∞'}</td>
                <td className="px-5 py-3">
                  <Toggle checked={c.ativo} onChange={(v) => toggleAtivo(c.id, v)} />
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => deletar(c.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
