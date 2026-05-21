'use client';

import { useState } from 'react';
import { Users, MessageCircle, ChevronDown, ChevronUp, CheckCircle, DollarSign, TrendingUp, Award } from 'lucide-react';

interface Props {
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  btnTexto?: string;
  whatsapp?: string;
  whatsappMensagem?: string;
  beneficios?: { titulo: string; desc: string }[];
  regulamentoTitulo?: string;
  regulamento?: string;
  imagemFundo?: string;
}

const BENEFICIOS_PADRAO = [
  { titulo: 'Comissão Atrativa', desc: 'Ganhe percentual em cada venda realizada com seu código de divulgação' },
  { titulo: 'Sem Investimento', desc: 'Você não paga nada para se tornar afiliado — comece a ganhar agora' },
  { titulo: 'Pagamento Rápido', desc: 'Receba suas comissões via Pix em até 7 dias úteis após a venda' },
  { titulo: 'Material Pronto', desc: 'Fotos, textos e vídeos profissionais para você divulgar nas redes' },
];

export default function Afiliados({
  titulo = 'Seja Nosso Afiliado',
  subtitulo = 'PROGRAMA DE AFILIADOS',
  descricao = 'Trabalhe conosco, ganhe comissões em cada venda e faça parte da nossa família. É grátis, simples e você pode começar hoje mesmo.',
  btnTexto = 'Quero ser Afiliado pelo WhatsApp',
  whatsapp = '5581994228240',
  whatsappMensagem = 'Olá! Tenho interesse em ser afiliado(a). Pode me passar mais informações?',
  beneficios,
  regulamentoTitulo = 'Regulamento do Programa de Afiliados',
  regulamento = '',
  imagemFundo,
}: Props) {
  const [regulamentoAberto, setRegulamentoAberto] = useState(false);
  const bens = beneficios && beneficios.length > 0 ? beneficios : BENEFICIOS_PADRAO;
  const iconesBeneficios = [DollarSign, CheckCircle, TrendingUp, Award];

  const numeroLimpo = (whatsapp || '').replace(/\D/g, '');
  const linkWhatsapp = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(whatsappMensagem)}`;

  return (
    <section
      className="relative py-16 px-4 overflow-hidden"
      style={{
        backgroundColor: '#1e1a16',
        backgroundImage: imagemFundo ? `linear-gradient(rgba(30,26,22,0.85), rgba(30,26,22,0.85)), url(${imagemFundo})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 border border-gold/30 mb-5">
            <Users size={24} className="text-gold" />
          </div>
          <p className="text-xs font-sans font-semibold tracking-[4px] uppercase text-gold mb-3">{subtitulo}</p>
          <h2 className="font-serif text-3xl md:text-4xl text-cream mb-4">{titulo}</h2>
          <p className="text-cream/70 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">{descricao}</p>
        </div>

        {/* Benefícios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {bens.slice(0, 4).map((b, i) => {
            const Icon = iconesBeneficios[i % iconesBeneficios.length];
            return (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-gold/20 rounded-sm p-5 hover:bg-white/10 transition-colors">
                <Icon size={22} className="text-gold mb-3" />
                <h3 className="font-serif text-cream text-sm md:text-base mb-1.5">{b.titulo}</h3>
                <p className="text-cream/60 text-xs leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Botão WhatsApp */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe57] text-white px-8 py-4 rounded-sm font-semibold text-sm md:text-base shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.02]"
          >
            <MessageCircle size={20} />
            {btnTexto}
          </a>
          <p className="text-cream/50 text-[11px]">Atendimento rápido · Resposta em minutos</p>
        </div>

        {/* Regulamento (colapsável) */}
        {regulamento && (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setRegulamentoAberto(!regulamentoAberto)}
              className="w-full flex items-center justify-between bg-white/5 backdrop-blur-sm border border-gold/20 rounded-sm px-5 py-4 hover:bg-white/10 transition-colors"
            >
              <span className="font-sans text-sm font-semibold text-cream flex items-center gap-2">
                📋 {regulamentoTitulo}
              </span>
              {regulamentoAberto
                ? <ChevronUp size={16} className="text-gold" />
                : <ChevronDown size={16} className="text-gold" />
              }
            </button>
            {regulamentoAberto && (
              <div className="bg-white/5 backdrop-blur-sm border-x border-b border-gold/20 rounded-b-sm px-5 py-5 text-cream/80 text-sm leading-relaxed whitespace-pre-line">
                {regulamento}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
