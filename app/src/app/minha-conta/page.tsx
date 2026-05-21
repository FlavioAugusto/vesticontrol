'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Lock, Plus, MapPin } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Cliente {
  id: string; nome: string; sobrenome: string | null;
  cpf: string | null; telefone: string | null;
  nascimento: string | null; newsletter: boolean;
}
interface Pedido { id: string; numero: number; status: string; total: number; created_at: string }
interface Endereco {
  id: string; nome: string; cep: string; rua: string; numero: string;
  complemento: string | null; bairro: string; cidade: string; estado: string; principal: boolean;
}

export default function MinhaContaPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [email, setEmail] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoCampo, setEditandoCampo] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [adicionandoEndereco, setAdicionandoEndereco] = useState(false);
  const [novoEnd, setNovoEnd] = useState({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', nome: 'Casa' });
  const [cepBuscando, setCepBuscando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const s = createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) { router.push('/login?next=/minha-conta'); return; }
    setEmail(user.email ?? '');
    const [{ data: c }, { data: p }, { data: e }] = await Promise.all([
      s.from('clientes').select('*').eq('id', user.id).single(),
      s.from('pedidos').select('id, numero, status, total, created_at').eq('cliente_id', user.id).order('created_at', { ascending: false }).limit(5),
      s.from('enderecos').select('*').eq('cliente_id', user.id).order('principal', { ascending: false }),
    ]);
    setCliente(c as Cliente);
    setPedidos((p ?? []) as Pedido[]);
    setEnderecos((e ?? []) as Endereco[]);
    setLoading(false);
  }

  async function sair() {
    const s = createClient();
    await s.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function iniciarEdicao(campo: string, valorAtual: string) {
    setEditandoCampo(campo);
    setEditValor(valorAtual);
  }

  async function salvarEdicao() {
    if (!cliente || !editandoCampo) return;
    setSalvandoEdicao(true);
    try {
      const s = createClient();
      await s.from('clientes').update({ [editandoCampo]: editValor || null }).eq('id', cliente.id);
      setCliente(prev => prev ? { ...prev, [editandoCampo]: editValor || null } : prev);
      toast.success('Salvo com sucesso.');
      setEditandoCampo(null);
    } catch { toast.error('Erro ao salvar'); }
    setSalvandoEdicao(false);
  }

  async function buscarCEP(cepVal: string) {
    const digits = cepVal.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepBuscando(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await res.json();
      if (!d.erro) setNovoEnd(prev => ({ ...prev, rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, estado: d.uf }));
    } finally { setCepBuscando(false); }
  }

  async function salvarEndereco() {
    if (!cliente || !novoEnd.cep || !novoEnd.rua || !novoEnd.numero) { toast.error('Preencha os campos obrigatórios'); return; }
    setSalvandoEdicao(true);
    try {
      const s = createClient();
      const { data } = await s.from('enderecos').insert({
        cliente_id: cliente.id, ...novoEnd, cep: novoEnd.cep.replace(/\D/g, ''), principal: enderecos.length === 0,
      }).select().single();
      if (data) setEnderecos(prev => [...prev, data as Endereco]);
      setAdicionandoEndereco(false);
      setNovoEnd({ cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', nome: 'Casa' });
      toast.success('Endereço adicionado!');
    } catch { toast.error('Erro ao salvar endereço'); }
    setSalvandoEdicao(false);
  }

  async function excluirEndereco(id: string) {
    const s = createClient();
    await s.from('enderecos').delete().eq('id', id);
    setEnderecos(prev => prev.filter(e => e.id !== id));
    toast.success('Endereço removido');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-charcoal-muted">Carregando...</p>
    </div>
  );

  const initials = `${(cliente?.nome || 'C')[0]}${(cliente?.sobrenome || '')[0] || ''}`.toUpperCase();

  const statusColors: Record<string, string> = {
    pago: 'text-green-600', enviado: 'text-blue-600', pendente: 'text-yellow-600',
    cancelado: 'text-red-500', entregue: 'text-green-700', processando: 'text-yellow-600',
  };

  // Campo de edição inline para Informações
  function CampoEditavel({ label, value, campo, tipo = 'text' }: { label: string; value: string; campo: string; tipo?: string }) {
    return (
      <div className="flex items-center justify-between py-3.5 border-b border-cream-darker last:border-0">
        <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider w-32 shrink-0">{label}</span>
        {editandoCampo === campo ? (
          <div className="flex items-center gap-2 flex-1 justify-end">
            {campo === 'newsletter' ? (
              <select value={editValor} onChange={e => setEditValor(e.target.value)}
                className="input-field text-xs w-24">
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            ) : (
              <input type={tipo} value={editValor} onChange={e => setEditValor(e.target.value)}
                className="input-field text-sm flex-1 max-w-[180px]" autoFocus />
            )}
            <button onClick={salvarEdicao} disabled={salvandoEdicao}
              className="text-[11px] bg-charcoal text-white px-3 py-1.5 hover:bg-charcoal-light disabled:opacity-50">
              {salvandoEdicao ? '...' : 'OK'}
            </button>
            <button onClick={() => setEditandoCampo(null)} className="text-charcoal-muted hover:text-charcoal text-xs">✕</button>
          </div>
        ) : (
          <button onClick={() => iniciarEdicao(campo, value === '—' ? '' : value)}
            className="flex items-center gap-1.5 text-sm font-semibold text-charcoal hover:text-gold group">
            {value}
            <ChevronRight size={13} className="text-charcoal-muted group-hover:text-gold" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

        {/* Dados da conta */}
        <div className="bg-white border border-cream-darker rounded-sm p-6">
          <h2 className="font-serif text-lg text-charcoal mb-4">Dados da conta</h2>
          <div>
            {/* E-MAIL — somente leitura */}
            <div className="flex items-center justify-between py-3.5 border-b border-cream-darker">
              <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider w-32 shrink-0">E-MAIL</span>
              <span className="text-sm font-semibold text-charcoal">{email}</span>
            </div>
            {/* CPF — editável */}
            <CampoEditavel label="CPF" value={cliente?.cpf ?? '—'} campo="cpf" />
          </div>
          <Link href="/minha-conta/perfil"
            className="mt-5 inline-flex items-center gap-2 border border-charcoal text-charcoal text-xs font-semibold px-4 py-2.5 hover:bg-charcoal hover:text-white transition-colors uppercase tracking-wider">
            <Lock size={11} /> Alterar senha
          </Link>
        </div>

        {/* Grid: Endereço + Informações */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Endereço de entrega */}
          <div className="bg-white border border-cream-darker rounded-sm p-6">
            <h2 className="font-serif text-lg text-charcoal mb-4">Endereço de entrega</h2>
            {enderecos.length === 0 && !adicionandoEndereco ? (
              <button onClick={() => setAdicionandoEndereco(true)}
                className="flex items-center justify-between w-full py-3.5 text-sm text-charcoal-muted hover:text-gold transition-colors border border-dashed border-cream-darker px-4 rounded-sm">
                Clique aqui para adicionar um endereço
                <MapPin size={15} />
              </button>
            ) : (
              <div className="space-y-3">
                {enderecos.map(e => (
                  <div key={e.id} className="p-3 bg-cream rounded-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-charcoal mb-0.5">
                          {e.nome} {e.principal && <span className="text-[10px] text-gold font-bold ml-1">Principal</span>}
                        </p>
                        <p className="text-xs text-charcoal-muted leading-relaxed">
                          {e.rua}, {e.numero}{e.complemento ? `, ${e.complemento}` : ''}
                        </p>
                        <p className="text-xs text-charcoal-muted">{e.bairro} — {e.cidade}/{e.estado} · CEP {e.cep}</p>
                      </div>
                      <button onClick={() => excluirEndereco(e.id)} className="text-red-400 hover:text-red-600 ml-2 text-xs shrink-0">✕</button>
                    </div>
                  </div>
                ))}
                {!adicionandoEndereco && (
                  <button onClick={() => setAdicionandoEndereco(true)}
                    className="flex items-center gap-1.5 text-xs text-gold hover:underline mt-2">
                    <Plus size={12} /> Adicionar endereço
                  </button>
                )}
              </div>
            )}

            {adicionandoEndereco && (
              <div className="mt-4 space-y-3 border-t border-cream-darker pt-4">
                <Input label="Nome do endereço" value={novoEnd.nome} onChange={e => setNovoEnd(p => ({ ...p, nome: e.target.value }))} />
                <div className="flex gap-2 items-end">
                  <Input label="CEP *" value={novoEnd.cep} onChange={e => { setNovoEnd(p => ({ ...p, cep: e.target.value })); if (e.target.value.replace(/\D/g,'').length === 8) buscarCEP(e.target.value); }} />
                  {cepBuscando && <span className="text-xs text-charcoal-muted pb-2">buscando...</span>}
                </div>
                <Input label="Rua *" value={novoEnd.rua} onChange={e => setNovoEnd(p => ({ ...p, rua: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Número *" value={novoEnd.numero} onChange={e => setNovoEnd(p => ({ ...p, numero: e.target.value }))} />
                  <Input label="Complemento" value={novoEnd.complemento} onChange={e => setNovoEnd(p => ({ ...p, complemento: e.target.value }))} />
                </div>
                <Input label="Bairro" value={novoEnd.bairro} onChange={e => setNovoEnd(p => ({ ...p, bairro: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Cidade" value={novoEnd.cidade} onChange={e => setNovoEnd(p => ({ ...p, cidade: e.target.value }))} />
                  <Input label="UF" value={novoEnd.estado} onChange={e => setNovoEnd(p => ({ ...p, estado: e.target.value }))} maxLength={2} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={salvarEndereco} loading={salvandoEdicao} size="sm">Salvar</Button>
                  <Button onClick={() => setAdicionandoEndereco(false)} variant="outline" size="sm">Cancelar</Button>
                </div>
              </div>
            )}
          </div>

          {/* Informações pessoais */}
          <div className="bg-white border border-cream-darker rounded-sm p-6">
            <h2 className="font-serif text-lg text-charcoal mb-4">Informações</h2>
            <CampoEditavel label="Nome Completo" value={`${cliente?.nome ?? ''} ${cliente?.sobrenome ?? ''}`.trim() || '—'} campo="nome" />
            <CampoEditavel label="Telefone" value={cliente?.telefone ?? '—'} campo="telefone" />
            <CampoEditavel label="Data de Nasc." value={cliente?.nascimento ? new Date(cliente.nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} campo="nascimento" tipo="date" />
            <CampoEditavel label="Novidades" value={cliente?.newsletter ? 'Sim' : 'Não'} campo="newsletter" />
          </div>
        </div>

        {/* Últimos pedidos */}
        {pedidos.length > 0 && (
          <div className="bg-white border border-cream-darker rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-charcoal">Últimos Pedidos</h2>
              <Link href="/minha-conta/pedidos" className="text-xs text-gold hover:underline">Ver todos</Link>
            </div>
            <div className="divide-y divide-cream-darker">
              {pedidos.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-semibold text-charcoal">#{p.numero}</p>
                    <p className="text-xs text-charcoal-muted">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gold">{formatPrice(Number(p.total))}</p>
                    <p className={`text-xs font-semibold capitalize ${statusColors[p.status] ?? 'text-charcoal-muted'}`}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

    </div>
  );
}
