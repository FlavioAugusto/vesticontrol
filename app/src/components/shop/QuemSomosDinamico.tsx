'use client';

import { useState } from 'react';
import { X, MapPin, Award, Package, Heart } from 'lucide-react';

interface Props {
  subtitulo?: string; titulo?: string; descricao?: string;
  historia?: string; btn?: string; imagem?: string;
}

export default function QuemSomosDinamico({
  subtitulo,
  titulo,
  descricao,
  historia = '',
  btn,
  imagem,
  nomeLoja,
}: Props & { nomeLoja?: string }) {
  // Se nenhum campo principal foi configurado, não renderiza nada (evita mostrar dados padrão)
  if (!titulo && !historia && !descricao) return null;

  const subFinal = subtitulo || 'Quem Somos';
  const tituloFinal = titulo || 'Sobre Nossa Marca';
  const descFinal = descricao || '';
  const btnFinal = btn || 'Conhecer Mais';
  const imagemFinal = imagem || '';
  const nomeFinal = (nomeLoja || tituloFinal).toUpperCase();

  const [aberto, setAberto] = useState(false);

  const diferenciais = [
    { icon: MapPin, titulo: 'Tradição', desc: 'Experiência e qualidade' },
    { icon: Package, titulo: 'Fábrica Própria', desc: 'Controle total da produção, do tecido ao acabamento' },
    { icon: Award, titulo: 'Matéria-Prima Nobre', desc: 'Tricoline 100% algodão selecionado' },
    { icon: Heart, titulo: 'Para Toda Mulher', desc: 'Do atacado ao varejo, levamos exclusividade até você' },
  ];

  return (
    <>
      <section className="relative py-24 px-4 overflow-hidden">
        {imagemFinal && <img src={imagemFinal} alt={tituloFinal} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-charcoal/60" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-gold text-xs font-sans font-semibold tracking-[5px] uppercase mb-4">{subFinal}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-cream mb-5 leading-tight">{tituloFinal}</h2>
          {descFinal && <p className="text-cream/75 text-sm max-w-lg mx-auto mb-8 leading-relaxed">{descFinal}</p>}
          {historia && <button onClick={() => setAberto(true)} className="btn-gold">{btnFinal}</button>}
        </div>
      </section>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAberto(false)}>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 overflow-hidden">
              {imagemFinal && <img src={imagemFinal} alt={tituloFinal} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-charcoal/50 flex items-end p-6">
                <div>
                  <p className="text-gold text-[10px] font-semibold tracking-[4px] uppercase mb-1">{subFinal}</p>
                  <h3 className="font-display text-2xl text-cream tracking-widest">{nomeFinal}</h3>
                </div>
              </div>
              <button onClick={() => setAberto(false)} className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-8">
              <div className="mb-8 space-y-4">
                {historia.split('\n\n').map((p, i) => (
                  <p key={i} className="text-charcoal-muted text-sm leading-relaxed">{p}</p>
                ))}
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-cream-darker" />
                <span className="text-gold text-[10px] tracking-[3px] uppercase font-semibold">Nossos Diferenciais</span>
                <div className="flex-1 h-px bg-cream-darker" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {diferenciais.map(({ icon: Icon, titulo: t, desc }) => (
                  <div key={t} className="flex gap-3 p-4 bg-cream rounded-sm">
                    <div className="w-9 h-9 bg-gold/10 rounded-full flex items-center justify-center shrink-0"><Icon size={16} className="text-gold" /></div>
                    <div>
                      <p className="font-semibold text-xs text-charcoal mb-0.5">{t}</p>
                      <p className="text-[11px] text-charcoal-muted leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <a href="/produtos" className="btn-gold flex-1 justify-center">Ver Coleção Completa</a>
                <button onClick={() => setAberto(false)} className="btn-outline px-5">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
