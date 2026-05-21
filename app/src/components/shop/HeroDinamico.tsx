'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: string; titulo: string; subtitulo: string; descricao: string;
  cta: string; cta_link: string; imagem: string; imagem_mobile?: string; ativo: boolean;
}

export default function HeroDinamico({ slides: rawSlides }: { slides: Slide[] }) {
  const slides = rawSlides.filter(s => s.ativo);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, paused, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const temConteudo = !!(slide.titulo?.trim() || slide.subtitulo?.trim() || slide.descricao?.trim() || slide.cta?.trim());

  return (
    <section
      className="relative overflow-hidden w-full"
      /* Mobile: altura proporcional para mostrar a imagem sem cortar muito
         Desktop: altura vh para preencher a tela */
      style={{ height: 'clamp(280px, 80vw, 92vh)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => {
        const sTemConteudo = !!(s.titulo?.trim() || s.subtitulo?.trim() || s.descricao?.trim() || s.cta?.trim());
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            {s.imagem && (
              <picture className="contents">
                {/* Imagem mobile (portrait) — se cadastrada, usa ela no celular */}
                {s.imagem_mobile && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={s.imagem_mobile}
                  />
                )}
                {/* Imagem desktop (landscape) — padrão */}
                <img
                  src={s.imagem}
                  alt={s.titulo || 'Banner'}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: s.imagem_mobile ? 'center center' : 'center 15%' }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </picture>
            )}
            {/* Gradiente: mais forte no mobile (fundo escuro pra texto), suave no desktop */}
            {sTemConteudo && (
              <>
                {/* Mobile: gradiente na parte inferior */}
                <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
                {/* Desktop: gradiente da esquerda */}
                <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-charcoal/75 via-charcoal/30 to-transparent" />
              </>
            )}
          </div>
        );
      })}

      {/* Texto — posição e tamanho diferentes por dispositivo */}
      {temConteudo && (
        <div
          className={`
            relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10
            flex flex-col sm:justify-center
            /* Mobile: alinha o texto na PARTE INFERIOR da imagem */
            justify-end pb-10 sm:pb-0
          `}
          key={current}
        >
          <div className="max-w-[85%] sm:max-w-sm lg:max-w-lg animate-fade-up">
            {/* Subtítulo */}
            {slide.subtitulo?.trim() && (
              <p className="text-gold text-[9px] sm:text-xs font-sans font-semibold tracking-[3px] sm:tracking-[5px] uppercase mb-1.5 sm:mb-4">
                {slide.subtitulo}
              </p>
            )}
            {/* Título: menor no mobile */}
            {slide.titulo?.trim() && (
              <h2 className="font-display
                text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
                text-cream leading-tight sm:leading-none
                mb-2 sm:mb-4
              ">
                {slide.titulo}
              </h2>
            )}
            {/* Descrição: oculta em telas muito pequenas */}
            {slide.descricao?.trim() && (
              <p className="font-sans text-xs sm:text-sm md:text-base text-cream/80
                mb-3 sm:mb-6 leading-relaxed
                hidden xs:block sm:block
                max-w-[260px] sm:max-w-xs
              ">
                {slide.descricao}
              </p>
            )}
            {/* Botão CTA */}
            {slide.cta?.trim() && slide.cta_link?.trim() && (
              <Link
                href={slide.cta_link}
                className="inline-flex items-center btn-gold text-[10px] sm:text-xs px-4 py-2.5 sm:px-6 sm:py-3"
              >
                {slide.cta}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Navegação */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} aria-label="Anterior"
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all p-1.5 sm:p-2">
            <ChevronLeft size={22} strokeWidth={1.5} className="sm:hidden" />
            <ChevronLeft size={32} strokeWidth={1.5} className="hidden sm:block" />
          </button>
          <button onClick={next} aria-label="Próximo"
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all p-1.5 sm:p-2">
            <ChevronRight size={22} strokeWidth={1.5} className="sm:hidden" />
            <ChevronRight size={32} strokeWidth={1.5} className="hidden sm:block" />
          </button>
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${i === current ? 'w-5 sm:w-8 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
