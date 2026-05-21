'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import toast from 'react-hot-toast';
import { Store, Truck, Image as ImageIcon, Globe, MessageCircle, Upload, X, CreditCard, Eye, EyeOff } from 'lucide-react';

// Input de segredo (token, api key) — esconde por padrão, com botão pra mostrar
function SecretInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [mostrar, setMostrar] = useState(false);
  const exibido = mostrar ? value : (value ? '•'.repeat(Math.min(value.length, 40)) : '');
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={mostrar ? 'text' : 'password'}
          value={mostrar ? value : (value ? value : '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pr-20 font-mono text-xs"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button type="button" onClick={() => setMostrar(!mostrar)}
              className="p-1.5 hover:bg-gray-100 rounded text-charcoal-muted hover:text-charcoal transition-colors"
              title={mostrar ? 'Ocultar' : 'Mostrar'}>
              {mostrar ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
      </div>
      {value && !mostrar && (
        <p className="text-[10px] text-emerald-600 mt-1">🔒 Token configurado ({value.length} caracteres)</p>
      )}
    </div>
  );
}

interface Configs {
  loja_nome: string;
  loja_logo_url: string;
  loja_favicon_url: string;
  loja_email: string;
  loja_telefone: string;
  loja_whatsapp: string;
  loja_instagram: string;
  loja_cnpj: string;
  loja_cpf: string;
  loja_horario_atendimento: string;
  topbar_texto: string;
  topbar_ativo: string;
  loja_cep_origem: string;
  frete_gratis_minimo: string;
  melhorenvio_ativo: string;
  melhorenvio_token: string;
  correios_ativo: string;
  parcelas_sem_juros: string;
  mercadopago_ativo: string;
  mercadopago_access_token: string;
  infinitepay_ativo: string;
  infinitepay_handle: string;
  pix_ativo: string;
  boleto_ativo: string;
  desconto_pix_pct: string;
  rodape_texto: string;
  rodape_endereco: string;
  rodape_horario: string;
  rodape_rua: string;
  rodape_cnpj: string;
  rodape_credito: string;
  seo_titulo: string;
  seo_descricao: string;
}

const DEFAULTS: Configs = {
  loja_nome: '', loja_logo_url: '', loja_favicon_url: '',
  loja_email: '', loja_telefone: '', loja_whatsapp: '',
  loja_instagram: '', loja_cnpj: '', loja_cpf: '', loja_horario_atendimento: '',
  topbar_texto: '', topbar_ativo: 'true',
  loja_cep_origem: '', frete_gratis_minimo: '',
  melhorenvio_ativo: 'false', melhorenvio_token: '',
  correios_ativo: 'true',
  parcelas_sem_juros: '6',
  mercadopago_ativo: 'false', mercadopago_access_token: '',
  infinitepay_ativo: 'false', infinitepay_handle: '',
  pix_ativo: 'true', boleto_ativo: 'true', desconto_pix_pct: '10',
  rodape_texto: '', rodape_endereco: '', rodape_horario: '',
  rodape_rua: '', rodape_cnpj: '', rodape_credito: '',
  seo_titulo: '', seo_descricao: '',
};

type ConfigKey = keyof Configs;

// Componente de Upload de Imagem reutilizável
function ImageUploadBox({ label, value, onChange, pasta, hint }: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  pasta: string;
  hint?: string;
}) {
  const [enviando, setEnviando] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('pasta', pasta);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Erro no upload'); return; }
      onChange(data.url);
      toast.success(`${label} enviado!`);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setEnviando(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">{label}</label>
      {hint && <p className="text-[11px] text-gray-400 mb-2">{hint}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        {value ? (
          <div className="relative group">
            <img src={value} alt={label} className="w-20 h-20 object-contain border border-gray-200 rounded-lg bg-gray-50 p-1" />
            <button type="button" onClick={() => onChange('')}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              title="Remover">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
            <ImageIcon size={24} className="text-gray-300" />
          </div>
        )}
        <label className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors text-sm ${enviando ? 'opacity-50 cursor-wait' : ''}`}>
          <Upload size={14} />
          {enviando ? 'Enviando...' : value ? 'Trocar imagem' : 'Selecionar imagem'}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={enviando} className="hidden" />
        </label>
      </div>
      {value && (
        <p className="text-[10px] text-gray-400 mt-1 truncate">URL: {value}</p>
      )}
    </div>
  );
}

type AbaConfig = 'identidade' | 'contato' | 'topbar' | 'frete' | 'pagamento' | 'rodape' | 'seo';
const ABAS_VALIDAS: AbaConfig[] = ['identidade','contato','topbar','frete','pagamento','rodape','seo'];

export default function AdminConfiguracoesPage() {
  const [configs, setConfigs] = useState<Configs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAbaState] = useState<AbaConfig>('identidade');
  const [lojaInfo, setLojaInfo] = useState<{ id?: string; nome?: string } | null>(null);
  const [lojaId, setLojaId] = useState<string>('');

  // Carrega aba inicial da URL/localStorage após mount (evita hydration mismatch)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab && (ABAS_VALIDAS as string[]).includes(urlTab)) {
      setAbaState(urlTab as AbaConfig);
      return;
    }
    const lsTab = window.localStorage?.getItem('admin_config_aba');
    if (lsTab && (ABAS_VALIDAS as string[]).includes(lsTab)) {
      setAbaState(lsTab as AbaConfig);
    }
  }, []);

  // Sempre que mudar de aba, salva no URL e localStorage pra persistir no F5
  function setAba(nova: AbaConfig) {
    setAbaState(nova);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', nova);
      window.history.replaceState({}, '', url.toString());
      window.localStorage?.setItem('admin_config_aba', nova);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        // ÚNICA chamada: minha-loja retorna info + configs em uma única requisição
        const res = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
        if (res.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.');
          window.location.href = '/login?next=/admin/config&motivo=sessao_expirada';
          return;
        }
        if (!res.ok) {
          toast.error('Erro ao carregar. Tente recarregar a página.');
          setCarregando(false);
          return;
        }
        const data = await res.json();
        setLojaInfo(data.loja);
        setLojaId(data.loja_id || '');

        // Configs vêm dentro do payload de minha-loja
        const configsFromApi = data.configs || {};
        const obj = { ...DEFAULTS } as Record<string, string>;
        Object.entries(configsFromApi).forEach(([chave, valor]) => {
          if (chave in obj) obj[chave] = String(valor ?? '');
        });
        setConfigs(obj as Configs);
      } catch (e) {
        console.error('[admin/config] Erro:', e);
        toast.error('Erro de conexão ao carregar configurações.');
      }
      finally { setCarregando(false); }
    })();
  }, []);

  function set(key: ConfigKey, value: string) {
    setConfigs(prev => ({ ...prev, [key]: value }));
  }

  async function salvar() {
    if (!lojaId) {
      toast.error('Não foi possível identificar a loja. Recarrega a página.');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Salvando configurações...');
    try {
      const res = await fetch('/api/admin/salvar-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs, loja_id: lojaId }),
      });
      const data = await res.json();
      toast.dismiss(loadingToast);
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar');
        return;
      }
      toast.success(`Configurações salvas! (${data.total} campos atualizados)`, { duration: 4000 });
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const abas: { id: typeof aba; label: string; icon: React.ElementType }[] = [
    { id: 'identidade', label: 'Identidade', icon: Store },
    { id: 'contato', label: 'Contato', icon: MessageCircle },
    { id: 'topbar', label: 'TopBar', icon: ImageIcon },
    { id: 'frete', label: 'Frete', icon: Truck },
    { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
    { id: 'rodape', label: 'Rodapé', icon: Store },
    { id: 'seo', label: 'SEO', icon: Globe },
  ];

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-charcoal">Configurações</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            {lojaInfo?.nome ? `Loja: ${lojaInfo.nome}` : 'Personalize sua loja'}
          </p>
        </div>
        <Button onClick={salvar} loading={loading}>💾 Salvar Tudo</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {abas.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors rounded-lg ${aba === id ? 'bg-charcoal text-white' : 'bg-white text-charcoal-muted hover:bg-cream border border-cream-darker'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {aba === 'identidade' && (
          <div className="space-y-5">
            <h2 className="font-serif text-lg text-charcoal mb-3">Identidade da Loja</h2>
            <Input label="Nome da Loja" value={configs.loja_nome} onChange={(e) => set('loja_nome', e.target.value)} placeholder="Ex: Minha Loja" />

            <ImageUploadBox
              label="Logo da Loja"
              value={configs.loja_logo_url}
              onChange={(url) => set('loja_logo_url', url)}
              pasta="logo"
              hint="PNG, SVG ou WEBP · máx. 2MB · Recomendado: 400×120px (transparência)"
            />

            <ImageUploadBox
              label="Favicon (ícone da aba)"
              value={configs.loja_favicon_url}
              onChange={(url) => set('loja_favicon_url', url)}
              pasta="favicon"
              hint="PNG ou SVG · máx. 500KB · Recomendado: quadrado 32×32px ou 64×64px"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="CNPJ" value={configs.loja_cnpj} onChange={(e) => set('loja_cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
              <Input label="CPF (alternativa ao CNPJ)" value={configs.loja_cpf} onChange={(e) => set('loja_cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <p className="text-xs text-charcoal-muted">
              ⚠️ O Melhor Envio exige <strong>CPF ou CNPJ válido</strong> da loja (remetente) para gerar etiquetas.
              Preencha pelo menos um dos dois.
            </p>
          </div>
        )}

        {aba === 'contato' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg text-charcoal mb-3">Contato</h2>
            <Input label="E-mail" value={configs.loja_email} onChange={(e) => set('loja_email', e.target.value)} placeholder="contato@sualoja.com.br" />
            <Input label="Telefone" value={configs.loja_telefone} onChange={(e) => set('loja_telefone', e.target.value)} placeholder="(11) 99999-9999" />
            <Input label="WhatsApp (só números)" value={configs.loja_whatsapp} onChange={(e) => set('loja_whatsapp', e.target.value)} placeholder="11999999999" />
            <Input label="Instagram (com @)" value={configs.loja_instagram} onChange={(e) => set('loja_instagram', e.target.value)} placeholder="@sualoja" />
            <Input label="Horário de Atendimento" value={configs.loja_horario_atendimento} onChange={(e) => set('loja_horario_atendimento', e.target.value)} placeholder="Seg–Sex: 9h–18h" />
          </div>
        )}

        {aba === 'topbar' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg text-charcoal mb-3">Faixa do Topo</h2>
            <Toggle label="Mostrar topbar" checked={configs.topbar_ativo !== 'false'} onChange={(c) => set('topbar_ativo', c ? 'true' : 'false')} />
            <Input label="Texto da topbar" value={configs.topbar_texto} onChange={(e) => set('topbar_texto', e.target.value)} placeholder="FRETE GRÁTIS ACIMA DE R$ 299" />
          </div>
        )}

        {aba === 'frete' && (
          <div className="space-y-5">
            <h2 className="font-serif text-lg text-charcoal mb-3">Frete e Entrega</h2>
            <Input label="CEP de origem (de onde envia os produtos)" value={configs.loja_cep_origem} onChange={(e) => set('loja_cep_origem', e.target.value)} placeholder="01000-000" />
            <Input label="Frete grátis acima de R$" value={configs.frete_gratis_minimo} onChange={(e) => set('frete_gratis_minimo', e.target.value)} placeholder="299.00" />

            <div className="border-t border-cream-darker pt-4">
              <h3 className="font-serif text-sm text-charcoal mb-3">Transportadoras</h3>
              <div className="space-y-3">
                <Toggle label="Correios (PAC + SEDEX)" checked={configs.correios_ativo === 'true'} onChange={(c) => set('correios_ativo', c ? 'true' : 'false')} />

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <Toggle label="Melhor Envio (PAC, SEDEX, JadLog, Azul)" checked={configs.melhorenvio_ativo === 'true'} onChange={(c) => set('melhorenvio_ativo', c ? 'true' : 'false')} />
                  {configs.melhorenvio_ativo === 'true' && (
                    <SecretInput label="Token do Melhor Envio" value={configs.melhorenvio_token} onChange={(v) => set('melhorenvio_token', v)} placeholder="eyJ..." />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {aba === 'pagamento' && (
          <div className="space-y-5">
            <h2 className="font-serif text-lg text-charcoal mb-3">Pagamento</h2>

            <div className="space-y-3">
              <Input label="Parcelas sem juros (cartão)" value={configs.parcelas_sem_juros} onChange={(e) => set('parcelas_sem_juros', e.target.value)} placeholder="6" />
              <Input label="Desconto no Pix (%)" value={configs.desconto_pix_pct} onChange={(e) => set('desconto_pix_pct', e.target.value)} placeholder="10" />
            </div>

            <div className="border-t border-cream-darker pt-4">
              <h3 className="font-serif text-sm text-charcoal mb-3">Métodos aceitos</h3>
              <div className="space-y-2">
                <Toggle label="🟢 Pix (com desconto)" checked={configs.pix_ativo === 'true'} onChange={(c) => set('pix_ativo', c ? 'true' : 'false')} />
                <Toggle
                  label="💳 Cartão de Crédito"
                  checked={configs.mercadopago_ativo === 'true' || configs.infinitepay_ativo === 'true'}
                  onChange={(c) => {
                    if (c) {
                      // Ao ativar cartão, habilita InfinitePay por padrão (se nenhum gateway estiver ativo)
                      if (configs.infinitepay_ativo !== 'true' && configs.mercadopago_ativo !== 'true') {
                        set('infinitepay_ativo', 'true');
                      }
                    } else {
                      // Ao desativar, desliga ambos gateways
                      set('infinitepay_ativo', 'false');
                      set('mercadopago_ativo', 'false');
                    }
                  }}
                />
                <Toggle label="📄 Boleto Bancário" checked={configs.boleto_ativo === 'true'} onChange={(c) => set('boleto_ativo', c ? 'true' : 'false')} />
              </div>
              {(configs.mercadopago_ativo === 'true' || configs.infinitepay_ativo === 'true') && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mt-3">
                  ℹ️ Pra aceitar cartão você precisa configurar pelo menos UM gateway abaixo (InfinitePay ou Mercado Pago) com as credenciais.
                </p>
              )}
            </div>

            <div className="border-t border-cream-darker pt-4">
              <h3 className="font-serif text-sm text-charcoal mb-3">Gateways de Pagamento</h3>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3">
                <Toggle label="💼 InfinitePay" checked={configs.infinitepay_ativo === 'true'} onChange={(c) => set('infinitepay_ativo', c ? 'true' : 'false')} />
                {configs.infinitepay_ativo === 'true' && (
                  <Input label="Handle InfinitePay (ex: sualoja)" value={configs.infinitepay_handle} onChange={(e) => set('infinitepay_handle', e.target.value)} placeholder="sualoja" />
                )}
                <p className="text-[10px] text-charcoal-muted">InfinitePay redireciona o cliente pra página dele.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <Toggle label="🟦 Mercado Pago" checked={configs.mercadopago_ativo === 'true'} onChange={(c) => set('mercadopago_ativo', c ? 'true' : 'false')} />
                {configs.mercadopago_ativo === 'true' && (
                  <SecretInput label="Access Token Mercado Pago" value={configs.mercadopago_access_token} onChange={(v) => set('mercadopago_access_token', v)} placeholder="APP_USR-..." />
                )}
                <p className="text-[10px] text-charcoal-muted">Mercado Pago: checkout transparente direto no site.</p>
              </div>
            </div>
          </div>
        )}

        {aba === 'rodape' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg text-charcoal mb-3">Rodapé</h2>
            <Input label="Texto do rodapé" value={configs.rodape_texto} onChange={(e) => set('rodape_texto', e.target.value)} placeholder="Moda feminina com qualidade." />
            <Input label="Endereço (cidade)" value={configs.rodape_endereco} onChange={(e) => set('rodape_endereco', e.target.value)} placeholder="Cidade — UF" />
            <Input label="Rua completa" value={configs.rodape_rua} onChange={(e) => set('rodape_rua', e.target.value)} placeholder="Rua X, 123 - Bairro" />
            <Input label="Horário" value={configs.rodape_horario} onChange={(e) => set('rodape_horario', e.target.value)} placeholder="Seg–Sex: 9h–18h" />
            <Input label="CNPJ (rodapé)" value={configs.rodape_cnpj} onChange={(e) => set('rodape_cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
            <Input label="Crédito (linha final)" value={configs.rodape_credito} onChange={(e) => set('rodape_credito', e.target.value)} placeholder="Loja virtual desenvolvida com..." />
          </div>
        )}

        {aba === 'seo' && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg text-charcoal mb-3">SEO</h2>
            <Input label="Título no Google" value={configs.seo_titulo} onChange={(e) => set('seo_titulo', e.target.value)} placeholder="Sua Loja — Moda Feminina" />
            <Input label="Descrição no Google" value={configs.seo_descricao} onChange={(e) => set('seo_descricao', e.target.value)} placeholder="Loja de moda feminina com peças exclusivas." />
          </div>
        )}
      </div>

      <div className="mt-5">
        <Button onClick={salvar} loading={loading} className="w-full">💾 Salvar Configurações</Button>
      </div>
    </div>
  );
}
