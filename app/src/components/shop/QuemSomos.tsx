'use client';

import { useState } from 'react';
import { X, MapPin, Award, Package, Heart } from 'lucide-react';

const HISTORIA = `[EDITE NO ADMIN] a Sua Loja nasceu com um propósito: entregar moda feminina autoral direto da nossa fábrica para o seu guarda-roupa.

Nossa assinatura é a modelagem premium e o cuidado rigoroso com os detalhes, utilizando matérias-primas nobres como o tricoline 100% algodão.

Hoje, toda a excelência e exclusividade que nos tornaram referência no atacado estão disponíveis para você no varejo. Com envios seguros para todo o Brasil, levamos até a sua porta a certeza de que toda mulher merece vestir a sua melhor versão, todos os dias.`;

const DIFERENCIAIS = [
  { icon: MapPin,  titulo: 'Tradição',      desc: 'Experiência e qualidade' },
  { icon: Package, titulo: 'Fábrica Própria',       desc: 'Controle total da produção, do tecido ao acabamento' },
  { icon: Award,   titulo: 'Matéria-Prima Nobre',   desc: 'Tricoline 100% algodão selecionado' },
  { icon: Heart,   titulo: 'Para Toda Mulher',      desc: 'Do atacado ao varejo, levamos exclusividade até você' },
];

export default function QuemSomos() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      {/* Seção banner */}
      <section className="relative py-24 px-4 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=700&fit=crop&q=85"
          alt="Sua Loja — Atelier"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/60" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-gold text-xs font-sans font-semibold tracking-[5px] uppercase mb-4">
            Quem Somos
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-cream mb-5 leading-tight">
            12 Anos Vestindo<br />a Melhor Versão de Você
          </h2>
          <p className="text-cream/75 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            Moda feminina autoral,
            direto da nossa fábrica para o seu guarda-roupa.
          </p>
          <button
            onClick={() => setAberto(true)}
            className="btn-gold inline-flex items-center gap-2"
          >
            Conhecer a Marca
          </button>
        </div>
      </section>

      {/* Modal — Quem Somos */}
      {aberto && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal com imagem */}
            <div className="relative h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=300&fit=crop&q=85"
                alt="Sua Loja"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-charcoal/50 flex items-end p-6">
                <div>
                  <p className="text-gold text-[10px] font-semibold tracking-[4px] uppercase mb-1">Quem Somos — Sua Loja</p>
                  <h3 className="font-display text-2xl text-cream tracking-widest">BY MARCELO MEDEIROS</h3>
                </div>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-8">
              {/* História */}
              <div className="mb-8">
                {HISTORIA.split('\n\n').map((paragrafo, i) => (
                  <p key={i} className="text-charcoal-muted text-sm leading-relaxed mb-4 last:mb-0">
                    {paragrafo}
                  </p>
                ))}
              </div>

              {/* Linha divisória */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-cream-darker" />
                <span className="text-gold text-[10px] tracking-[3px] uppercase font-semibold">Nossos Diferenciais</span>
                <div className="flex-1 h-px bg-cream-darker" />
              </div>

              {/* Diferenciais */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {DIFERENCIAIS.map(({ icon: Icon, titulo, desc }) => (
                  <div key={titulo} className="flex gap-3 p-4 bg-cream rounded-sm">
                    <div className="w-9 h-9 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-charcoal mb-0.5">{titulo}</p>
                      <p className="text-[11px] text-charcoal-muted leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <a href="/produtos" className="btn-gold flex-1 justify-center">
                  Ver Coleção Completa
                </a>
                <button onClick={() => setAberto(false)} className="btn-outline px-5">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
