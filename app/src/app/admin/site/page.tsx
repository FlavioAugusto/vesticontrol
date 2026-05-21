'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import {
  Image as ImageIcon, Type, Star, LayoutGrid, ShoppingBag,
  Users, MessageSquare, MapPin, ChevronDown, ChevronUp,
  Plus, Trash2, Upload, Save, RefreshCw, Eye, EyeOff, Truck, CreditCard, Info, Handshake
} from 'lucide-react';

// ─── DEFAULTS ───────────────────────────────────────────────────────────────
const DEFAULTS = {
  hero_slides: JSON.stringify([
    { id: '1', titulo: 'Nova Coleção', subtitulo: 'Primavera / Verão 2025', descricao: 'Vestidos e conjuntos que celebram a feminilidade com elegância e exclusividade.', cta: 'VER COLEÇÃO', cta_link: '/produtos', imagem: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&h=900&fit=crop&q=90', ativo: true },
    { id: '2', titulo: 'Conjuntos Exclusivos', subtitulo: 'Alta Costura', descricao: 'Peças únicas criadas com tecidos selecionados para mulheres que exigem o melhor.', cta: 'EXPLORAR', cta_link: '/categorias/conjuntos', imagem: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop&q=90', ativo: true },
    { id: '3', titulo: 'Vestidos Longos', subtitulo: 'Ocasiões Especiais', descricao: 'Para momentos únicos que merecem looks verdadeiramente inesquecíveis.', cta: 'VER VESTIDOS', cta_link: '/categorias/longos', imagem: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1400&h=900&fit=crop&q=90', ativo: true },
  ]),
  trustbar_items: JSON.stringify([
    { icone: 'Truck', titulo: 'Frete Grátis', desc: 'Acima de R$ 499,90' },
    { icone: 'ShieldCheck', titulo: 'Compra Segura', desc: 'Ambiente 100% protegido' },
    { icone: 'CreditCard', titulo: '6X Sem Juros', desc: 'No cartão de crédito' },
    { icone: 'QrCode', titulo: '10% de Desconto', desc: 'Nas compras no Pix' },
  ]),
  secao_colecoes_titulo: 'Nossas Coleções',
  secao_colecoes_subtitulo: 'EXPLORE',
  secao_destaques_titulo: 'Destaques da Coleção',
  secao_destaques_subtitulo: 'SELECIONADOS PARA VOCÊ',
  secao_destaques_btn: 'Ver Coleção Completa',
  secao_destaques_btn_link: '/produtos',
  banners_promocionais: JSON.stringify([
    { titulo: 'Conjuntos\nExclusivos', subtitulo: 'Nova Chegada', descricao: 'Alta costura com tecidos selecionados para cada ocasião.', cta: 'Ver Conjuntos', link: '/categorias/conjuntos', imagem: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=800&h=600&fit=crop&q=90' },
    { titulo: 'Vestidos\nLongos', subtitulo: 'Ocasiões Especiais', descricao: 'Para momentos únicos que merecem looks inesquecíveis.', cta: 'Explorar', link: '/categorias/longos', imagem: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop&q=90' },
  ]),
  quemsomos_titulo: '12 Anos Vestindo a Melhor Versão de Você',
  quemsomos_subtitulo: 'Quem Somos',
  quemsomos_descricao: 'Conte aqui a história da sua marca de forma envolvente.',
  quemsomos_btn: 'Conhecer a Marca',
  quemsomos_imagem: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=700&fit=crop&q=85',
  quemsomos_historia: '[EDITE ESTE TEXTO]\n\nEscreva aqui a história da sua loja, sua missão e o que torna sua marca única.\n\nDestaque seus valores, seu compromisso com qualidade e a relação com seus clientes.',
  secao_categorias_titulo: 'Navegue por Nossas Coleções',
  secao_categorias_subtitulo: 'EXPLORE',
  newsletter_titulo: 'Receba em Primeira Mão',
  newsletter_desc: 'Cadastre-se e ganhe 10% de desconto na primeira compra + novidades exclusivas antes de todo mundo.',
  newsletter_btn: 'Quero 10% Off',
  rodape_mapa_url: '',
  rodape_mapa_titulo: 'Nossa Localização',
  rodape_mapa_endereco: 'Endereço da loja, Cidade/UF',
  // Capas das coleções
  cat_img_conjuntos: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=750&fit=crop&q=85',
  cat_img_midi: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=750&fit=crop&q=85',
  cat_img_longos: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&h=750&fit=crop&q=85',

  // ─── AFILIADOS ───
  afiliados_titulo: 'Seja Nosso Afiliado',
  afiliados_subtitulo: 'PROGRAMA DE AFILIADOS',
  afiliados_descricao: 'Trabalhe conosco, ganhe comissões em cada venda e faça parte da nossa equipe. É grátis, simples e você pode começar hoje mesmo.',
  afiliados_btn: 'Quero ser Afiliado pelo WhatsApp',
  afiliados_whatsapp_mensagem: 'Olá! Tenho interesse em ser afiliado(a). Pode me passar mais informações?',
  afiliados_imagem_fundo: '',
  afiliados_beneficios: JSON.stringify([
    { titulo: 'Comissão Atrativa', desc: 'Ganhe percentual em cada venda realizada com seu código' },
    { titulo: 'Sem Investimento', desc: 'Você não paga nada para se tornar afiliado' },
    { titulo: 'Pagamento Rápido', desc: 'Receba suas comissões via Pix em até 7 dias úteis' },
    { titulo: 'Material Pronto', desc: 'Fotos, textos e vídeos profissionais para divulgar' },
  ]),
  afiliados_regulamento_titulo: 'Regulamento do Programa de Afiliados',
  afiliados_regulamento: `1. CADASTRO E APROVAÇÃO
Para se tornar afiliado(a), basta entrar em contato pelo WhatsApp e enviar seus dados. Nossa equipe analisa cada solicitação em até 48 horas úteis.

2. COMISSÕES
• 10% sobre cada venda confirmada com seu código de divulgação
• Pagamento via Pix em até 7 dias úteis após a confirmação do pagamento da venda
• Não há limite de ganhos — quanto mais você divulga, mais você ganha

3. DIVULGAÇÃO
• Fornecemos material profissional: fotos, vídeos e textos prontos
• Você pode divulgar em redes sociais, WhatsApp, blog e qualquer canal próprio
• É proibido usar nosso nome em sites duvidosos ou anúncios pagos sem autorização

4. REGRAS GERAIS
• A comissão só é paga após a confirmação do pagamento do pedido
• Em caso de devolução ou estorno, a comissão é cancelada
• O afiliado é responsável pela emissão de nota fiscal de seus ganhos
• Comportamento inadequado ou divulgação imprópria leva ao desligamento

5. ENCERRAMENTO
Tanto a loja quanto o(a) afiliado(a) podem encerrar a parceria a qualquer momento, com aviso prévio de 7 dias.

Em caso de dúvidas, entre em contato pelo WhatsApp.`,

  // ─── VISIBILIDADE DAS SEÇÕES (todas ativas por padrão) ───
  secao_hero_ativo: 'true',
  secao_trustbar_ativo: 'true',
  secao_categorias_ativo: 'true',
  secao_destaques_ativo: 'true',
  secao_banners_promo_ativo: 'true',
  secao_quem_somos_ativo: 'true',
  secao_navegue_categorias_ativo: 'true',
  secao_depoimentos_ativo: 'true',
  secao_newsletter_ativo: 'true',
  secao_afiliados_ativo: 'true',
  secao_mapa_ativo: 'true',
};

type ConfigKey = keyof typeof DEFAULTS;

// ─── SPEC BADGE ──────────────────────────────────────────────────────────────
interface ImgSpec {
  w: number;
  h: number;
  formats?: string;
  maxMb?: number;
  tip?: string;
}

function SpecBadge({ spec }: { spec: ImgSpec }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-100">
        <Info size={9} /> {spec.w}×{spec.h}px
      </span>
      <span className="text-[10px] text-charcoal-muted bg-gray-100 px-2 py-0.5 rounded-full">
        {spec.formats ?? 'JPG ou PNG'} · máx {spec.maxMb ?? 2}MB
      </span>
      {spec.tip && (
        <span className="text-[10px] text-charcoal-muted">{spec.tip}</span>
      )}
    </div>
  );
}

// ─── UPLOAD DE IMAGEM ────────────────────────────────────────────────────────
interface ImgUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  spec?: ImgSpec;
}

function ImgUpload({ value, onChange, label, spec }: ImgUploadProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const aspectRatio = spec ? `${spec.w}/${spec.h}` : '16/9';
  const maxH = spec
    ? spec.w >= spec.h
      ? spec.h <= 700 ? '120px' : '140px'
      : '200px'
    : '140px';

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > (spec?.maxMb ?? 2) * 1024 * 1024) {
      toast.error(`Máximo ${spec?.maxMb ?? 2}MB`);
      return;
    }
    setLoading(true);
    setProgress(0);

    // Simula progresso enquanto faz upload real
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return p; }
        return p + Math.random() * 18;
      });
    }, 120);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('pasta', 'site');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      clearInterval(interval);
      setProgress(100);
      if (d.url) {
        onChange(d.url);
        setTimeout(() => { setLoading(false); setProgress(0); }, 400);
      } else {
        toast.error(d.error ?? 'Erro no upload');
        setLoading(false);
        setProgress(0);
      }
    } catch {
      clearInterval(interval);
      toast.error('Erro ao enviar');
      setLoading(false);
      setProgress(0);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {spec && <SpecBadge spec={spec} />}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL ou faça upload →"
            className="input-field text-xs"
          />
        </div>
        <label className={`flex items-center gap-1 border px-3 py-2 text-xs cursor-pointer transition-colors shrink-0 ${loading ? 'border-gold/50 text-gold cursor-not-allowed' : 'border-gray-200 text-charcoal-muted hover:border-gold hover:text-gold'}`}>
          <Upload size={12} /> {loading ? 'Enviando...' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={loading} />
        </label>
      </div>

      {/* Barra de progresso */}
      {loading && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gold font-semibold">Enviando imagem...</span>
            <span className="text-[10px] text-charcoal-muted">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-cream-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {value && !loading && (
        <div className="mt-2 relative overflow-hidden rounded-sm border border-cream-darker bg-cream-dark"
          style={{ maxHeight: maxH }}>
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
            style={{ aspectRatio, maxHeight: maxH, objectPosition: 'top' }}
            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
          />
          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
            {spec ? `${spec.w}×${spec.h}` : 'preview'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ACCORDION SECTION ───────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  visivel?: boolean;
  onToggleVisibilidade?: (v: boolean) => void;
}

function Section({ title, icon: Icon, children, defaultOpen, visivel, onToggleVisibilidade }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const hasToggle = onToggleVisibilidade !== undefined;
  const visivelReal = visivel !== false;

  return (
    <div className={`bg-white rounded-sm shadow-sm overflow-hidden border-l-4 transition-colors ${!visivelReal && hasToggle ? 'border-red-300 opacity-75' : visivelReal && hasToggle ? 'border-green-400' : 'border-transparent'}`}>
      <div className="flex items-center gap-3 px-5 py-4 hover:bg-cream/50 transition-colors">
        {/* TOGGLE SWITCH visual (bolinha clássica) */}
        {hasToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibilidade(!visivelReal); }}
            title={visivelReal ? 'Seção ATIVA no site — clique para desativar' : 'Seção INATIVA — clique para ativar'}
            className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors shrink-0 ${visivelReal ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${visivelReal ? 'translate-x-6' : 'translate-x-1'}`}
            />
            <span className="sr-only">{visivelReal ? 'Ativo' : 'Inativo'}</span>
          </button>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between"
        >
          <span className="flex items-center gap-2.5 font-serif text-base text-charcoal text-left">
            <Icon size={18} className="text-gold" /> {title}
            {hasToggle && (
              <span className={`ml-2 text-[10px] font-sans px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                visivelReal ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}>
                {visivelReal ? '● Ativo' : '○ Inativo'}
              </span>
            )}
          </span>
          {open ? <ChevronUp size={16} className="text-charcoal-muted" /> : <ChevronDown size={16} className="text-charcoal-muted" />}
        </button>
      </div>
      {open && <div className="border-t border-cream-darker px-5 py-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── SPECS ───────────────────────────────────────────────────────────────────
const SPECS = {
  hero:       { w: 1920, h: 1080, formats: 'JPG ou PNG', maxMb: 2, tip: 'Recomendado: rostos/produto no centro' },
  heroMobile: { w: 900,  h: 1200, formats: 'JPG ou PNG', maxMb: 2, tip: 'Retrato · rosto/produto no centro vertical' },
  bannerDuo:  { w: 800,  h: 1000, formats: 'JPG ou PNG', maxMb: 2, tip: 'Formato retrato, produto centralizado' },
  quemSomos:  { w: 1600, h: 700,  formats: 'JPG ou PNG', maxMb: 2, tip: 'Paisagem larga, foco no centro-esq' },
  categoria:  { w: 600,  h: 750,  formats: 'JPG ou PNG', maxMb: 1, tip: 'Formato retrato 4:5, modelo/produto' },
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminSitePage() {
  const [configs, setConfigs] = useState<Record<string, string>>(DEFAULTS);
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = createClient();
        const { data } = await s.from('configuracoes').select('chave, valor');
        if (data) {
          const obj: Record<string, string> = { ...DEFAULTS };
          data.forEach((r: { chave: string; valor: string | null }) => {
            if (r.valor !== null) obj[r.chave] = r.valor;
          });
          setConfigs(obj);
        }
      } catch { /* usa defaults */ }
    })();
  }, []);

  function set(k: string, v: string) {
    setConfigs((p) => ({ ...p, [k]: v }));
  }

  function setJson(k: string, v: unknown) {
    setConfigs((p) => ({ ...p, [k]: JSON.stringify(v) }));
  }

  function getJson<T>(k: string, fallback: T): T {
    try { return JSON.parse(configs[k] ?? '[]') as T; } catch { return fallback; }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const configsLimpos: Record<string, string> = {};
      Object.entries(configs).forEach(([k, v]) => {
        if (v !== undefined && v !== null) configsLimpos[k] = String(v);
      });

      const res = await fetch('/api/admin/salvar-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsLimpos }),
      });

      let result: { ok?: boolean; error?: string } = {};
      try { result = await res.json(); } catch { /* noop */ }

      if (!res.ok) throw new Error(result.error ?? `Erro ${res.status}`);

      await fetch('/api/revalidar', { method: 'POST' });
      setUltimoSalvo(new Date());
      toast.success('Salvo com sucesso.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  const slides = getJson<{ id: string; titulo: string; subtitulo: string; descricao: string; cta: string; cta_link: string; imagem: string; imagem_mobile?: string; ativo: boolean }[]>('hero_slides', []);
  const trustItems = getJson<{ icone: string; titulo: string; desc: string }[]>('trustbar_items', []);
  const banners = getJson<{ titulo: string; subtitulo: string; descricao: string; cta: string; link: string; imagem: string }[]>('banners_promocionais', []);
  const afiliadosBeneficios = getJson<{ titulo: string; desc: string }[]>('afiliados_beneficios', []);

  // Helper para visibilidade de seção
  function isVisivel(k: string): boolean { return configs[k] !== 'false'; }
  function toggleVisivel(k: string, v: boolean) { set(k, v ? 'true' : 'false'); }

  const COLECOES = [
    { key: 'cat_img_conjuntos', keyAtivo: 'cat_ativo_conjuntos', keyNome: 'cat_nome_conjuntos', keySub: 'cat_sub_conjuntos', keyMostrarSub: 'cat_mostrar_sub_conjuntos', keyDesc: 'cat_desc_conjuntos', keyMostrarDesc: 'cat_mostrar_desc_conjuntos', keyCta: 'cat_cta_conjuntos', nomePadrao: 'Vestidos Conjuntos', slug: 'conjuntos' },
    { key: 'cat_img_midi',      keyAtivo: 'cat_ativo_midi',      keyNome: 'cat_nome_midi',      keySub: 'cat_sub_midi',      keyMostrarSub: 'cat_mostrar_sub_midi',      keyDesc: 'cat_desc_midi',      keyMostrarDesc: 'cat_mostrar_desc_midi',      keyCta: 'cat_cta_midi',      nomePadrao: 'Vestidos Midi',      slug: 'midi' },
    { key: 'cat_img_longos',    keyAtivo: 'cat_ativo_longos',    keyNome: 'cat_nome_longos',    keySub: 'cat_sub_longos',    keyMostrarSub: 'cat_mostrar_sub_longos',    keyDesc: 'cat_desc_longos',    keyMostrarDesc: 'cat_mostrar_desc_longos',    keyCta: 'cat_cta_longos',    nomePadrao: 'Vestidos Longos',    slug: 'longos' },
  ];

  return (
    <div>
      {/* Header fixo com botão salvar */}
      <div className="flex items-center justify-between mb-5 sticky top-0 z-10 bg-gray-50 py-3 -mx-8 px-8 border-b border-cream-darker">
        <div>
          <h1 className="text-xl font-serif text-charcoal">Editor do Site</h1>
          <p className="text-xs text-charcoal-muted mt-0.5">
            {ultimoSalvo
              ? `Último salvamento: ${ultimoSalvo.toLocaleTimeString('pt-BR')}`
              : 'Edite qualquer seção e salve'}
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-xs text-charcoal-muted hover:border-gold hover:text-gold transition-colors"
          >
            <Eye size={13} /> Ver Site
          </a>
          <Button onClick={salvar} loading={salvando} className="flex items-center gap-2">
            <Save size={14} /> Salvar Tudo e Publicar
          </Button>
        </div>
      </div>

      <div className="space-y-3">

        {/* ─── 1. HERO / BANNER PRINCIPAL ─── */}
        <Section title="Banner / Hero Principal" icon={ImageIcon} defaultOpen
          visivel={isVisivel('secao_hero_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_hero_ativo', v)}>
          {/* Guia visual de imagens */}
          <div className="mb-5 rounded-2xl overflow-hidden border border-blue-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
              <Info size={15} className="text-white shrink-0" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">📐 Guia de Imagens — Banner Principal</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              {/* Preview lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

                {/* Desktop */}
                <div className="bg-white rounded-xl overflow-hidden border border-blue-100 shadow-sm">
                  <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-400 ml-2 font-mono">desktop</span>
                  </div>
                  <div className="relative bg-gray-200" style={{ aspectRatio: '16/9' }}>
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-[11px] font-mono">1920 × 1080px</div>
                    {/* Simulação do gradiente com texto */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/70 to-transparent flex items-center px-3">
                      <div>
                        <div className="w-12 h-1 bg-yellow-400 rounded mb-1.5" />
                        <div className="w-16 h-2.5 bg-white rounded mb-1" />
                        <div className="w-12 h-1.5 bg-white/60 rounded mb-2" />
                        <div className="w-8 h-3 bg-yellow-400 rounded" />
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center">
                      <div className="text-[9px] text-gray-500">Modelos visíveis aqui</div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] font-bold text-blue-700">🖥️ Desktop / Tablet</p>
                    <p className="text-[10px] text-gray-600">📐 <strong>1920 × 1080px</strong> (16:9)</p>
                    <p className="text-[10px] text-gray-500">• Texto aparece no <strong>lado esquerdo</strong></p>
                    <p className="text-[10px] text-gray-500">• Modelos visíveis à <strong>direita</strong></p>
                    <p className="text-[10px] text-gray-500">• JPG/PNG · Máx <strong>2MB</strong></p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="bg-white rounded-xl overflow-hidden border border-blue-100 shadow-sm">
                  <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-400 ml-2 font-mono">mobile</span>
                  </div>
                  <div className="flex justify-center p-3 bg-gray-100">
                    <div className="relative bg-gray-300 rounded-lg overflow-hidden" style={{ width: '90px', height: '160px' }}>
                      <div className="absolute inset-0 flex items-start justify-center pt-2 text-gray-400 text-[8px] font-mono text-center leading-tight">
                        Mesma<br/>imagem<br/>1920×1080
                      </div>
                      {/* Área visível no mobile */}
                      <div className="absolute inset-x-0 top-8 bottom-0 bg-gray-700/60" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="w-8 h-1 bg-yellow-400 rounded mb-1" />
                          <div className="w-10 h-1.5 bg-white rounded mb-0.5" />
                          <div className="w-6 h-2 bg-yellow-400 rounded mt-1" />
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 text-[7px] bg-black/50 text-white px-1 py-0.5 rounded">centro</div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[11px] font-bold text-blue-700">📱 Celular</p>
                    <p className="text-[10px] text-gray-600">📐 Usa a <strong>mesma imagem</strong> 1920×1080</p>
                    <p className="text-[10px] text-gray-500">• Mostra o <strong>centro</strong> da foto</p>
                    <p className="text-[10px] text-gray-500">• Texto fica na <strong>parte inferior</strong></p>
                    <p className="text-[10px] text-gray-500">• Modelos visíveis na <strong>parte de cima</strong></p>
                  </div>
                </div>
              </div>

              {/* Dica de composição */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-[11px] font-bold text-amber-800 mb-2">💡 Como tirar a foto ideal (funciona nos 2 dispositivos):</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { emoji: '✅', texto: 'Modelo no CENTRO', cor: 'bg-green-50 border-green-200 text-green-700' },
                    { emoji: '✅', texto: 'Espaço LIVRE na esquerda', cor: 'bg-green-50 border-green-200 text-green-700' },
                    { emoji: '❌', texto: 'Não coloque modelos nas BORDAS', cor: 'bg-red-50 border-red-200 text-red-600' },
                  ].map(d => (
                    <div key={d.texto} className={`p-2 rounded-lg border text-[9px] font-semibold ${d.cor}`}>
                      <div className="text-xl mb-1">{d.emoji}</div>
                      {d.texto}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {slides.map((slide, i) => (
            <div key={slide.id} className="border border-cream-darker rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-muted uppercase">Slide {i + 1}</span>
                <div className="flex gap-2 items-center">
                  <Toggle
                    checked={slide.ativo}
                    onChange={(v) => { const n = [...slides]; n[i].ativo = v; setJson('hero_slides', n); }}
                    label="Ativo"
                  />
                  <button
                    onClick={() => setJson('hero_slides', slides.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Hero preview mockup */}
              {slide.imagem && (
                <div className="relative w-full overflow-hidden rounded-sm border border-cream-darker" style={{ aspectRatio: '16/9', maxHeight: 180 }}>
                  <img src={slide.imagem} alt="" className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    {slide.subtitulo && <p className="text-[8px] text-gold/90 tracking-widest uppercase font-semibold">{slide.subtitulo}</p>}
                    {slide.titulo && <p className="text-sm font-serif text-white leading-tight">{slide.titulo}</p>}
                    {slide.cta && (
                      <span className="mt-1 inline-block bg-transparent border border-gold/70 text-gold text-[8px] px-2 py-0.5 tracking-widest uppercase">
                        {slide.cta}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                    1920×1080 · preview
                  </div>
                </div>
              )}

              {/* Desktop + Mobile uploads lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🖥️</span>
                    <div>
                      <p className="text-xs font-bold text-charcoal">Desktop / Tablet</p>
                      <p className="text-[10px] text-charcoal-muted">1920 × 1080px (16:9) · obrigatória</p>
                    </div>
                  </div>
                  <ImgUpload
                    label=""
                    value={slide.imagem}
                    spec={SPECS.hero}
                    onChange={(url) => { const n = [...slides]; n[i].imagem = url; setJson('hero_slides', n); }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">📱</span>
                    <div>
                      <p className="text-xs font-bold text-charcoal">Celular (opcional)</p>
                      <p className="text-[10px] text-charcoal-muted">900 × 1200px (3:4) · portrait</p>
                    </div>
                  </div>
                  <ImgUpload
                    label=""
                    value={(slide as { imagem_mobile?: string }).imagem_mobile ?? ''}
                    spec={SPECS.heroMobile}
                    onChange={(url) => { const n = [...slides] as any[]; n[i].imagem_mobile = url; setJson('hero_slides', n); }}
                  />
                  {!(slide as { imagem_mobile?: string }).imagem_mobile && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-2">
                      💡 Sem imagem mobile: será usado o centro da imagem desktop
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Subtítulo (pequeno)</label>
                  <input value={slide.subtitulo} onChange={(e) => { const n = [...slides]; n[i].subtitulo = e.target.value; setJson('hero_slides', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Título Principal</label>
                  <input value={slide.titulo} onChange={(e) => { const n = [...slides]; n[i].titulo = e.target.value; setJson('hero_slides', n); }} className="input-field text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Descrição</label>
                  <input value={slide.descricao} onChange={(e) => { const n = [...slides]; n[i].descricao = e.target.value; setJson('hero_slides', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Texto do Botão</label>
                  <input value={slide.cta} onChange={(e) => { const n = [...slides]; n[i].cta = e.target.value; setJson('hero_slides', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Link do Botão</label>
                  <input value={slide.cta_link} onChange={(e) => { const n = [...slides]; n[i].cta_link = e.target.value; setJson('hero_slides', n); }} className="input-field text-sm" />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setJson('hero_slides', [...slides, { id: Date.now().toString(), titulo: 'Novo Slide', subtitulo: '', descricao: '', cta: 'VER', cta_link: '/produtos', imagem: '', imagem_mobile: '', ativo: true }])}
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 text-gold py-5 rounded-lg font-semibold text-sm transition-all group"
          >
            <span className="w-9 h-9 rounded-full bg-gold/10 group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all">
              <Plus size={18} strokeWidth={2.5} />
            </span>
            <span className="uppercase tracking-wider">Adicionar novo slide</span>
            <span className="text-[10px] text-charcoal-muted normal-case ml-2">({slides.length} {slides.length === 1 ? 'slide ativo' : 'slides ativos'})</span>
          </button>
        </Section>

        {/* ─── 2. TRUST BAR ─── */}
        <Section title="Faixa de Benefícios (abaixo do hero)" icon={Truck}
          visivel={isVisivel('secao_trustbar_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_trustbar_ativo', v)}>
          <p className="text-xs text-charcoal-muted mb-3">Itens exibidos abaixo do banner: frete, segurança, parcelamento, Pix, etc.</p>
          {trustItems.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end border-b border-cream-darker pb-3">
              <div>
                <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Título</label>
                <input value={item.titulo} onChange={(e) => { const n = [...trustItems]; n[i].titulo = e.target.value; setJson('trustbar_items', n); }} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Descrição</label>
                <input value={item.desc} onChange={(e) => { const n = [...trustItems]; n[i].desc = e.target.value; setJson('trustbar_items', n); }} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Ícone</label>
                <select value={item.icone} onChange={(e) => { const n = [...trustItems]; n[i].icone = e.target.value; setJson('trustbar_items', n); }} className="input-field text-sm">
                  <option value="Truck">🚚 Caminhão (Frete)</option>
                  <option value="ShieldCheck">🛡️ Escudo (Segurança)</option>
                  <option value="CreditCard">💳 Cartão</option>
                  <option value="QrCode">📱 QR Code (Pix)</option>
                  <option value="RotateCcw">🔄 Troca</option>
                  <option value="Star">⭐ Estrela</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setJson('trustbar_items', trustItems.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 transition-colors p-2"
                title="Remover">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setJson('trustbar_items', [...trustItems, { icone: 'Truck', titulo: 'Novo Benefício', desc: 'Descrição' }])}
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 text-gold py-5 rounded-lg font-semibold text-sm transition-all group">
            <span className="w-9 h-9 rounded-full bg-gold/10 group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all">
              <Plus size={18} strokeWidth={2.5} />
            </span>
            <span className="uppercase tracking-wider">Adicionar novo benefício</span>
            <span className="text-[10px] text-charcoal-muted normal-case ml-2">({trustItems.length} {trustItems.length === 1 ? 'item' : 'itens'})</span>
          </button>
        </Section>

        {/* ─── 3. CAPAS DAS COLEÇÕES ─── */}
        <Section title="Explore Nossas Coleções — Capas" icon={LayoutGrid}
          visivel={isVisivel('secao_categorias_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_categorias_ativo', v)}>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2 mb-2">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Tamanho ideal: 600×750px</strong> (proporção 4:5, retrato) · JPG ou PNG · máx 1MB.<br />
              Cada card ocupa ⅓ da largura na home. Use foto de modelo em pé ou produto com fundo limpo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Subtítulo (pequeno acima)" value={configs.secao_colecoes_subtitulo} onChange={(e) => set('secao_colecoes_subtitulo', e.target.value)} />
            <Input label="Título Principal" value={configs.secao_colecoes_titulo} onChange={(e) => set('secao_colecoes_titulo', e.target.value)} />
          </div>

          <hr className="border-cream-darker mb-4" />
          <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-3">Capas de cada coleção</p>

          <div className="grid grid-cols-3 gap-4">
            {COLECOES.map((col) => {
              const ativo = configs[col.keyAtivo] !== 'false';
              const nomeEditado = configs[col.keyNome] ?? col.nomePadrao;
              const subEditado = configs[col.keySub] ?? 'Coleção';
              const mostrarSub = configs[col.keyMostrarSub] !== 'false';
              const descEditada = configs[col.keyDesc] ?? '';
              const mostrarDesc = configs[col.keyMostrarDesc] !== 'false';
              const ctaEditado = configs[col.keyCta] ?? 'Ver coleção';
              return (
                <div
                  key={col.key}
                  className={`space-y-2 border-2 rounded-sm p-3 transition ${
                    ativo ? 'border-gold/40 bg-white' : 'border-red-200 bg-red-50/30 opacity-70'
                  }`}
                >
                  {/* Toggle ativo + nome editável */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      ativo ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {ativo ? '● Ativo' : '○ Inativo'}
                    </span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => set(col.keyAtivo, e.target.checked ? 'true' : 'false')}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold" />
                    </label>
                  </div>

                  {/* ✏️ Textos da capa — destaque visual */}
                  <div className="bg-gold/5 border border-gold/30 rounded-sm p-2 space-y-2">
                    <p className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                      ✏️ Textos exibidos na capa
                    </p>

                    {/* 1. Rótulo superior + toggle de mostrar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-charcoal-muted uppercase tracking-wider">
                          Rótulo superior (pequeno)
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mostrarSub}
                            onChange={(e) => set(col.keyMostrarSub, e.target.checked ? 'true' : 'false')}
                            className="w-3 h-3 accent-gold"
                          />
                          <span className="text-[9px] text-charcoal-muted">Mostrar</span>
                        </label>
                      </div>
                      <Input
                        value={subEditado}
                        onChange={(e) => set(col.keySub, e.target.value)}
                        placeholder="Coleção, Nova, Exclusivo..."
                        disabled={!mostrarSub}
                      />
                    </div>

                    {/* 2. Nome principal */}
                    <Input
                      label="Nome principal"
                      value={nomeEditado}
                      onChange={(e) => set(col.keyNome, e.target.value)}
                      placeholder="Digite qualquer nome"
                    />

                    {/* 3. Descrição + toggle de mostrar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-charcoal-muted uppercase tracking-wider">
                          Descrição (texto fininho)
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mostrarDesc}
                            onChange={(e) => set(col.keyMostrarDesc, e.target.checked ? 'true' : 'false')}
                            className="w-3 h-3 accent-gold"
                          />
                          <span className="text-[9px] text-charcoal-muted">Mostrar</span>
                        </label>
                      </div>
                      <Input
                        value={descEditada}
                        onChange={(e) => set(col.keyDesc, e.target.value)}
                        placeholder="Ex: Alta costura coordenada"
                        disabled={!mostrarDesc}
                      />
                    </div>

                    {/* 4. Texto do botão */}
                    <Input
                      label="Texto do botão"
                      value={ctaEditado}
                      onChange={(e) => set(col.keyCta, e.target.value)}
                      placeholder="Ver coleção"
                    />
                  </div>

                  {configs[col.key] && (
                    <div className="relative overflow-hidden rounded-sm border border-cream-darker bg-cream-dark" style={{ aspectRatio: '4/5' }}>
                      <img
                        src={configs[col.key]}
                        alt={nomeEditado}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {mostrarSub && subEditado && (
                          <p className="text-[8px] text-gold font-semibold tracking-wider uppercase">{subEditado}</p>
                        )}
                        <p className="font-serif text-xs text-cream leading-tight">{nomeEditado}</p>
                        {mostrarDesc && descEditada && (
                          <p className="text-[8px] text-cream/70 mt-0.5 leading-tight">{descEditada}</p>
                        )}
                        <p className="text-[7px] text-gold mt-1 uppercase tracking-wider">{ctaEditado} →</p>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded">
                        600×750
                      </div>
                      {!ativo && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider">
                            Oculto no site
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <ImgUpload
                    label={configs[col.key] ? 'Trocar Capa' : 'Adicionar Capa'}
                    value={configs[col.key] ?? ''}
                    spec={SPECS.categoria}
                    onChange={(url) => set(col.key, url)}
                  />

                  <div className="flex items-center justify-between">
                    <a href={`/categorias/${col.slug}`} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1 text-[10px] text-charcoal-muted hover:text-gold transition-colors">
                      <Eye size={9} /> Ver página
                    </a>
                    {configs[col.key] && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remover a capa de "${nomeEditado}"? A coleção continuará disponível, mas sem imagem personalizada.`)) {
                            set(col.key, '');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={9} /> Remover capa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ─── 4. SEÇÃO DESTAQUES ─── */}
        <Section title="Destaques da Coleção" icon={ShoppingBag}
          visivel={isVisivel('secao_destaques_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_destaques_ativo', v)}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subtítulo" value={configs.secao_destaques_subtitulo} onChange={(e) => set('secao_destaques_subtitulo', e.target.value)} />
            <Input label="Título" value={configs.secao_destaques_titulo} onChange={(e) => set('secao_destaques_titulo', e.target.value)} />
            <Input label="Texto do Botão" value={configs.secao_destaques_btn} onChange={(e) => set('secao_destaques_btn', e.target.value)} />
            <Input label="Link do Botão" value={configs.secao_destaques_btn_link} onChange={(e) => set('secao_destaques_btn_link', e.target.value)} />
          </div>
          <p className="text-xs text-charcoal-muted">Os produtos exibidos são os marcados como <strong>Destaque</strong> em Admin → Produtos.</p>
        </Section>

        {/* ─── 5. BANNERS PROMOCIONAIS ─── */}
        <Section title="Banners Promocionais (duplos)" icon={ImageIcon}
          visivel={isVisivel('secao_banners_promo_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_banners_promo_ativo', v)}>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2 mb-3">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Tamanho ideal: 800×1000px</strong> (proporção 4:5, retrato) · JPG ou PNG · máx 2MB.<br />
              Dois banners exibidos lado a lado. Use fotos de modelo em pé, produto visível na parte superior.
            </p>
          </div>

          {banners.map((b, i) => (
            <div key={i} className="border border-cream-darker rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-muted uppercase">Banner {i + 1}</span>
                {banners.length > 1 && (
                  <button onClick={() => setJson('banners_promocionais', banners.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Banner preview */}
              {b.imagem && (
                <div className="relative overflow-hidden rounded-sm border border-cream-darker max-w-[200px]" style={{ aspectRatio: '4/5' }}>
                  <img src={b.imagem} alt="" className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    {b.subtitulo && <p className="text-[7px] text-gold/90 uppercase tracking-widest font-semibold">{b.subtitulo}</p>}
                    {b.titulo && <p className="text-[10px] font-serif text-white leading-tight whitespace-pre-line">{b.titulo}</p>}
                    {b.cta && <span className="mt-1 inline-block border border-white/50 text-white text-[7px] px-1.5 py-0.5 tracking-widest uppercase">{b.cta}</span>}
                  </div>
                  <div className="absolute top-1 right-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded">
                    800×1000
                  </div>
                </div>
              )}

              <ImgUpload
                label="Imagem"
                value={b.imagem}
                spec={SPECS.bannerDuo}
                onChange={(url) => { const n = [...banners]; n[i].imagem = url; setJson('banners_promocionais', n); }}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Subtítulo</label>
                  <input value={b.subtitulo} onChange={(e) => { const n = [...banners]; n[i].subtitulo = e.target.value; setJson('banners_promocionais', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Título (pode ter \n para quebra)</label>
                  <input value={b.titulo} onChange={(e) => { const n = [...banners]; n[i].titulo = e.target.value; setJson('banners_promocionais', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Descrição</label>
                  <input value={b.descricao} onChange={(e) => { const n = [...banners]; n[i].descricao = e.target.value; setJson('banners_promocionais', n); }} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Texto do Botão</label>
                  <input value={b.cta} onChange={(e) => { const n = [...banners]; n[i].cta = e.target.value; setJson('banners_promocionais', n); }} className="input-field text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-charcoal-muted uppercase block mb-1">Link</label>
                  <input value={b.link} onChange={(e) => { const n = [...banners]; n[i].link = e.target.value; setJson('banners_promocionais', n); }} className="input-field text-sm" />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setJson('banners_promocionais', [...banners, { titulo: 'Novo Banner', subtitulo: '', descricao: '', cta: 'Ver mais', link: '/produtos', imagem: '' }])}
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 text-gold py-5 rounded-lg font-semibold text-sm transition-all group"
          >
            <span className="w-9 h-9 rounded-full bg-gold/10 group-hover:bg-gold group-hover:text-white flex items-center justify-center transition-all">
              <Plus size={18} strokeWidth={2.5} />
            </span>
            <span className="uppercase tracking-wider">Adicionar novo banner</span>
            <span className="text-[10px] text-charcoal-muted normal-case ml-2">({banners.length} {banners.length === 1 ? 'banner' : 'banners'})</span>
          </button>
        </Section>

        {/* ─── 6. QUEM SOMOS ─── */}
        <Section title="Quem Somos / Nossa Filosofia" icon={Users}
          visivel={isVisivel('secao_quem_somos_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_quem_somos_ativo', v)}>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-sm px-3 py-2 mb-2">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Tamanho ideal da imagem: 1600×700px</strong> (formato panorâmico) · JPG ou PNG · máx 2MB.<br />
              A imagem aparece como fundo da seção. Use foto de ateliê, produção ou lifestyle. Assegure boa iluminação.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Subtítulo (pequeno)" value={configs.quemsomos_subtitulo} onChange={(e) => set('quemsomos_subtitulo', e.target.value)} />
            <Input label="Título Principal" value={configs.quemsomos_titulo} onChange={(e) => set('quemsomos_titulo', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Texto resumido (exibido no banner)</label>
            <textarea rows={2} className="input-field resize-none text-sm" value={configs.quemsomos_descricao} onChange={(e) => set('quemsomos_descricao', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">História completa (no modal — separe parágrafos com linha em branco)</label>
            <textarea rows={6} className="input-field resize-y text-sm" value={configs.quemsomos_historia} onChange={(e) => set('quemsomos_historia', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <Input label="Texto do Botão" value={configs.quemsomos_btn} onChange={(e) => set('quemsomos_btn', e.target.value)} />
            <div>
              <ImgUpload
                label="Imagem de Fundo"
                value={configs.quemsomos_imagem}
                spec={SPECS.quemSomos}
                onChange={(url) => set('quemsomos_imagem', url)}
              />
            </div>
          </div>
        </Section>

        {/* ─── 7. NAVEGUE POR CATEGORIAS (título) ─── */}
        <Section title="Navegue por Nossas Coleções (Seção inferior)" icon={LayoutGrid}
          visivel={isVisivel('secao_navegue_categorias_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_navegue_categorias_ativo', v)}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subtítulo" value={configs.secao_categorias_subtitulo} onChange={(e) => set('secao_categorias_subtitulo', e.target.value)} />
            <Input label="Título" value={configs.secao_categorias_titulo} onChange={(e) => set('secao_categorias_titulo', e.target.value)} />
          </div>
          <p className="text-xs text-charcoal-muted">As capas das coleções são gerenciadas na seção <strong>"Explore Nossas Coleções — Capas"</strong> acima.</p>
        </Section>

        {/* ─── 8. DEPOIMENTOS ─── */}
        <Section title="Depoimentos / Experiências Reais" icon={MessageSquare}
          visivel={isVisivel('secao_depoimentos_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_depoimentos_ativo', v)}>
          <p className="text-xs text-charcoal-muted mb-3">Os depoimentos são gerenciados em <strong>Admin → Depoimentos</strong>. Aqui você edita apenas os textos da seção.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subtítulo" value={configs.secao_depoimentos_subtitulo ?? 'DEPOIMENTOS'} onChange={(e) => set('secao_depoimentos_subtitulo', e.target.value)} />
            <Input label="Título" value={configs.secao_depoimentos_titulo ?? 'Experiências Reais'} onChange={(e) => set('secao_depoimentos_titulo', e.target.value)} />
            <Input label="Descrição" value={configs.secao_depoimentos_desc ?? 'O que dizem nossas clientes'} onChange={(e) => set('secao_depoimentos_desc', e.target.value)} />
          </div>
        </Section>

        {/* ─── 9. PROGRAMA DE AFILIADOS ─── */}
        <Section title="Programa de Afiliados" icon={Handshake}
          visivel={isVisivel('secao_afiliados_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_afiliados_ativo', v)}>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-amber-800 font-semibold mb-1">💡 Sobre esta seção</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Banner que convida visitantes a se tornarem afiliados da sua loja. Inclui benefícios, regulamento e botão direto pro WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Subtítulo (texto pequeno acima)" value={configs.afiliados_subtitulo} onChange={(e) => set('afiliados_subtitulo', e.target.value)} />
            <Input label="Título Principal" value={configs.afiliados_titulo} onChange={(e) => set('afiliados_titulo', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea rows={3} className="input-field resize-none text-sm" value={configs.afiliados_descricao} onChange={(e) => set('afiliados_descricao', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Texto do Botão WhatsApp" value={configs.afiliados_btn} onChange={(e) => set('afiliados_btn', e.target.value)} />
            <div>
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Mensagem pronta para o WhatsApp</label>
              <input value={configs.afiliados_whatsapp_mensagem} onChange={(e) => set('afiliados_whatsapp_mensagem', e.target.value)} className="input-field text-sm" />
              <p className="text-[10px] text-charcoal-muted mt-1">Esta mensagem já vem preenchida ao clicar no botão</p>
            </div>
          </div>

          {/* Benefícios */}
          <div className="border-t border-cream-darker pt-4">
            <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-3">
              Benefícios destacados (4 cards)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {afiliadosBeneficios.slice(0, 4).map((b, i) => (
                <div key={i} className="bg-cream/40 rounded-lg p-3 space-y-2 border border-cream-darker">
                  <Input
                    label={`Título do Benefício ${i + 1}`}
                    value={b.titulo}
                    onChange={(e) => {
                      const novo = [...afiliadosBeneficios];
                      novo[i] = { ...novo[i], titulo: e.target.value };
                      setJson('afiliados_beneficios', novo);
                    }}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Descrição curta</label>
                    <textarea
                      rows={2}
                      className="input-field resize-none text-xs"
                      value={b.desc}
                      onChange={(e) => {
                        const novo = [...afiliadosBeneficios];
                        novo[i] = { ...novo[i], desc: e.target.value };
                        setJson('afiliados_beneficios', novo);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imagem de fundo opcional */}
          <div className="border-t border-cream-darker pt-4">
            <ImgUpload
              label="Imagem de fundo (opcional — fica com sobreposição escura)"
              value={configs.afiliados_imagem_fundo}
              spec={{ w: 1600, h: 700, formats: 'JPG ou PNG', maxMb: 2, tip: 'Imagem temática · ficará com overlay escuro' }}
              onChange={(url) => set('afiliados_imagem_fundo', url)}
            />
          </div>

          {/* Regulamento */}
          <div className="border-t border-cream-darker pt-4">
            <Input label="Título do Regulamento" value={configs.afiliados_regulamento_titulo} onChange={(e) => set('afiliados_regulamento_titulo', e.target.value)} />
            <div className="mt-3">
              <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
                Regulamento Completo (aparece em modal expansível)
              </label>
              <textarea
                rows={14}
                className="input-field resize-y text-xs font-mono"
                value={configs.afiliados_regulamento}
                onChange={(e) => set('afiliados_regulamento', e.target.value)}
              />
              <p className="text-[10px] text-charcoal-muted mt-1">
                Use linhas em branco para separar parágrafos. Esse texto fica oculto inicialmente e abre ao clicar.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            <strong>📱 WhatsApp:</strong> O número usado é o configurado em <code>Configurações → Loja → WhatsApp</code> ({configs.loja_whatsapp || 'não configurado'}).
          </div>
        </Section>

        {/* ─── 10. RODAPÉ + MAPA GOOGLE ─── */}
        <Section title="Rodapé + Mapa Google" icon={MapPin}
          visivel={isVisivel('secao_mapa_ativo')}
          onToggleVisibilidade={(v) => toggleVisivel('secao_mapa_ativo', v)}>
          <p className="text-xs text-charcoal-muted mb-3">
            Para adicionar o mapa do Google: acesse{' '}
            <a href="https://maps.google.com" target="_blank" rel="noopener" className="text-gold hover:underline">maps.google.com</a>
            {' '}→ busque o endereço → clique em <strong>Compartilhar → Incorporar mapa → Copiar HTML</strong> → cole abaixo.
          </p>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Título da Seção do Mapa</label>
            <input value={configs.rodape_mapa_titulo} onChange={(e) => set('rodape_mapa_titulo', e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">
              Cole o iframe completo do Google Maps (ou só a URL do src)
            </label>
            <textarea
              rows={3}
              value={configs.rodape_mapa_url}
              onChange={(e) => {
                let val = e.target.value.trim();
                const match = val.match(/src=["']([^"']+)["']/);
                if (match) val = match[1];
                set('rodape_mapa_url', val);
              }}
              className="input-field text-xs font-mono resize-none"
              placeholder={'Cole o <iframe src="https://www.google.com/maps/embed?pb=..."> aqui'}
            />
            <p className="text-[11px] text-green-600 mt-1 font-semibold">
              ✨ Cole o iframe completo — a URL é extraída automaticamente
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-1.5">Endereço Exibido</label>
            <input value={configs.rodape_mapa_endereco} onChange={(e) => set('rodape_mapa_endereco', e.target.value)} className="input-field text-sm" />
          </div>
          {configs.rodape_mapa_url && (
            <div>
              <p className="text-xs text-charcoal-muted mb-2">Preview do mapa:</p>
              <iframe
                src={configs.rodape_mapa_url}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-sm"
              />
            </div>
          )}
          <hr className="border-cream-darker" />
          <p className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
            Outros textos do rodapé → <strong>Configurações → Rodapé</strong>
          </p>
        </Section>

      </div>

      {/* Botão salvar flutuante */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-sm shadow-lg hover:bg-charcoal-light transition-colors disabled:opacity-70 font-semibold text-sm"
        >
          {salvando ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {salvando ? 'Publicando...' : 'Salvar e Publicar Site'}
        </button>
      </div>
    </div>
  );
}
