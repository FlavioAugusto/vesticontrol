'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import toast from 'react-hot-toast';
import { Plus, Trash2, MapPin, Check } from 'lucide-react';

interface Endereco {
  id?: string;
  nome: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

const ENDERECO_VAZIO: Endereco = {
  nome: 'Casa', cep: '', rua: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', principal: true,
};

export default function PerfilPage() {
  const [loading, setLoading] = useState(false);
  const [savingEnd, setSavingEnd] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: '', sobrenome: '', telefone: '', whatsapp: '', cpf: '', newsletter: true,
  });
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      supabase.from('clientes').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            const c = data as any;
            setForm({
              nome: c.nome ?? '',
              sobrenome: c.sobrenome ?? '',
              telefone: c.telefone ?? '',
              whatsapp: c.whatsapp ?? '',
              cpf: c.cpf ?? '',
              newsletter: c.newsletter ?? true,
            });
          }
        });

      supabase.from('enderecos').select('*').eq('cliente_id', user.id).order('principal', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setEnderecos(data as Endereco[]);
          }
        });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Faça login novamente'); setLoading(false); return; }

    const { error } = await supabase.from('clientes').upsert({
      id: user.id, ...form, updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else toast.success('Dados salvos com sucesso!');
  }

  function adicionarEndereco() {
    if (enderecos.length >= 2) {
      toast.error('Você pode cadastrar no máximo 2 endereços');
      return;
    }
    setEnderecos([...enderecos, { ...ENDERECO_VAZIO, nome: 'Trabalho', principal: enderecos.length === 0 }]);
  }

  function atualizarEndereco(idx: number, campo: keyof Endereco, valor: any) {
    const novos = [...enderecos];
    novos[idx] = { ...novos[idx], [campo]: valor };
    setEnderecos(novos);
  }

  function definirPrincipal(idx: number) {
    setEnderecos(enderecos.map((e, i) => ({ ...e, principal: i === idx })));
  }

  async function buscarCep(idx: number, cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      const novos = [...enderecos];
      novos[idx] = {
        ...novos[idx],
        rua: data.logradouro || novos[idx].rua,
        bairro: data.bairro || novos[idx].bairro,
        cidade: data.localidade || novos[idx].cidade,
        estado: data.uf || novos[idx].estado,
      };
      setEnderecos(novos);
    } catch {
      toast.error('Erro ao buscar CEP');
    }
  }

  async function salvarEndereco(idx: number) {
    if (!userId) return;
    const end = enderecos[idx];
    if (!end.cep || !end.rua || !end.numero || !end.bairro || !end.cidade || !end.estado) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSavingEnd(idx);
    const supabase = createClient();

    if (end.principal) {
      await supabase.from('enderecos').update({ principal: false }).eq('cliente_id', userId);
    }

    const payload = {
      cliente_id: userId,
      nome: end.nome,
      cep: end.cep,
      rua: end.rua,
      numero: end.numero,
      complemento: end.complemento || null,
      bairro: end.bairro,
      cidade: end.cidade,
      estado: end.estado.toUpperCase(),
      principal: end.principal,
    };

    let result;
    if (end.id) {
      result = await supabase.from('enderecos').update(payload).eq('id', end.id).select().single();
    } else {
      result = await supabase.from('enderecos').insert(payload).select().single();
    }

    setSavingEnd(null);
    if (result.error) {
      toast.error('Erro ao salvar endereço: ' + result.error.message);
    } else {
      toast.success('Endereço salvo!');
      const novos = [...enderecos];
      novos[idx] = result.data as Endereco;
      setEnderecos(novos);
    }
  }

  async function excluirEndereco(idx: number) {
    const end = enderecos[idx];
    if (!confirm('Excluir este endereço?')) return;
    if (end.id) {
      const supabase = createClient();
      const { error } = await supabase.from('enderecos').delete().eq('id', end.id);
      if (error) { toast.error('Erro ao excluir'); return; }
    }
    setEnderecos(enderecos.filter((_, i) => i !== idx));
    toast.success('Endereço removido');
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal mb-6">Meus Dados</h1>

      <div className="bg-white rounded-sm shadow-sm p-6 mb-6">
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            <Input label="Sobrenome" value={form.sobrenome} onChange={(e) => setForm({ ...form, sobrenome: e.target.value })} />
          </div>
          <Input label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          <Input label="Telefone" placeholder="(81) 99999-9999" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <Input label="WhatsApp" placeholder="(81) 99999-9999" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          <Toggle
            label="Receber novidades e promoções por e-mail"
            checked={form.newsletter}
            onChange={(v) => setForm({ ...form, newsletter: v })}
          />
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
        </form>
      </div>

      {/* ─── ENDEREÇOS ─── */}
      <div className="bg-white rounded-sm shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl text-charcoal flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" /> Meus Endereços
            </h2>
            <p className="text-sm text-charcoal-muted mt-1">
              Cadastre até 2 endereços e marque qual será usado para entrega
            </p>
          </div>
          {enderecos.length < 2 && (
            <button
              type="button"
              onClick={adicionarEndereco}
              className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-sm hover:bg-gold-600 transition"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          )}
        </div>

        {enderecos.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-cream-darker rounded-sm">
            <MapPin className="w-12 h-12 text-charcoal-muted mx-auto mb-3" />
            <p className="text-charcoal-muted mb-4">Você ainda não tem endereços cadastrados</p>
            <p className="text-sm text-charcoal-muted mb-4">Cadastre um endereço para realizar suas compras</p>
            <button
              type="button"
              onClick={adicionarEndereco}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-sm hover:bg-gold-600 transition"
            >
              <Plus className="w-4 h-4" /> Cadastrar Endereço
            </button>
          </div>
        )}

        <div className="space-y-4">
          {enderecos.map((end, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-sm p-4 transition ${
                end.principal ? 'border-gold bg-gold-50/30' : 'border-cream-darker'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={end.nome}
                    onChange={(e) => atualizarEndereco(idx, 'nome', e.target.value)}
                    placeholder="Casa, Trabalho..."
                    className="!w-32"
                  />
                  {end.principal && (
                    <span className="flex items-center gap-1 text-xs bg-gold text-white px-2 py-1 rounded-sm">
                      <Check className="w-3 h-3" /> Endereço de Entrega
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => excluirEndereco(idx)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Excluir endereço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  label="CEP *"
                  value={end.cep}
                  onChange={(e) => atualizarEndereco(idx, 'cep', e.target.value)}
                  onBlur={(e) => buscarCep(idx, e.target.value)}
                  placeholder="00000-000"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Rua *"
                    value={end.rua}
                    onChange={(e) => atualizarEndereco(idx, 'rua', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <Input
                  label="Número *"
                  value={end.numero}
                  onChange={(e) => atualizarEndereco(idx, 'numero', e.target.value)}
                />
                <Input
                  label="Complemento"
                  value={end.complemento}
                  onChange={(e) => atualizarEndereco(idx, 'complemento', e.target.value)}
                  placeholder="Apto, bloco..."
                />
                <Input
                  label="Bairro *"
                  value={end.bairro}
                  onChange={(e) => atualizarEndereco(idx, 'bairro', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="md:col-span-2">
                  <Input
                    label="Cidade *"
                    value={end.cidade}
                    onChange={(e) => atualizarEndereco(idx, 'cidade', e.target.value)}
                  />
                </div>
                <Input
                  label="Estado *"
                  value={end.estado}
                  onChange={(e) => atualizarEndereco(idx, 'estado', e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cream-darker">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="endereco-principal"
                    checked={end.principal}
                    onChange={() => definirPrincipal(idx)}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm text-charcoal">Usar como endereço de entrega</span>
                </label>
                <Button
                  type="button"
                  onClick={() => salvarEndereco(idx)}
                  loading={savingEnd === idx}
                  size="sm"
                >
                  {end.id ? 'Atualizar' : 'Salvar Endereço'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
