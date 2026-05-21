'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    subtitulo: 'Nova Coleção · Primavera 2025',
    titulo: 'Elegância\nque Inspira',
    descricao: 'Vestidos e conjuntos que celebram a feminilidade com cada detalhe.',
    cta: 'Ver Coleção',
    href: '/produtos',
    imagem: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&h=900&fit=crop&q=90',
    overlay: 'from-charcoal/70 via-charcoal/30 to-transparent',
    textAlign: 'items-start',
  },
  {
    id: 2,
    subtitulo: 'Alta Costura',
    titulo: 'Conjuntos\nExclusivos',
    descricao: 'Peças únicas criadas com tecidos selecionados para mulheres que exigem o melhor.',
    cta: 'Explorar Conjuntos',
    href: '/categorias/conjuntos',
    imagem: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&h=900&fit=crop&q=90',
    overlay: 'from-charcoal/60 via-charcoal/20 to-transparent',
    textAlign: 'items-start',
  },
  {
    id: 3,
    subtitulo: 'Ocasiões Especiais',
    titulo: 'Vestidos\nque Marcam',
    descricao: 'Para momentos únicos que merecem looks verdadeiramente inesquecíveis.',
    cta: 'Ver Vestidos Longos',
    href: '/categorias/longos',
    imagem: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1400&h=900&fit=crop&q=90',
    overlay: 'from-charcoal/65 via-charcoal/25 to-transparent',
    textAlign: 'items-start',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, paused]);

  const slide = slides[current];

  return (
    <section
      className="relative h-[85vh] min-h-[560px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Imagem de fundo */}
      {slides.map((s, i) => (
        <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}>
          <img src={s.imagem} alt={s.titulo} className="w-full h-full object-cover object-top" />
          <div className={`absolute inset-0 bg-gradient-to-r ${s.overlay}`} />
        </div>
      ))}

      {/* Conteúdo */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-lg animate-fade-up" key={current}>
          <p className="text-gold text-xs font-sans font-semibold tracking-[5px] uppercase mb-5">
            {slide.subtitulo}
          </p>
          <h2 className="font-display text-6xl md:text-7xl text-cream leading-none mb-6 whitespace-pre-line">
            {slide.titulo}
          </h2>
          <p className="font-sans text-base text-cream/80 max-w-sm mb-8 leading-relaxed">
            {slide.descricao}
          </p>
          <div className="flex items-center gap-5">
            <Link href={slide.href} className="btn-gold">
              {slide.cta}
            </Link>
            <Link href="/produtos" className="text-xs font-sans font-semibold tracking-widest uppercase text-cream/70 hover:text-gold transition-colors">
              Ver tudo →
            </Link>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <button onClick={prev} aria-label="Anterior" className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} aria-label="Próximo" className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all">
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? 'w-8 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white'}`}
          />
        ))}
      </div>

      {/* Badge scroll */}
      <div className="absolute bottom-8 right-6 text-cream/50 text-[10px] font-sans tracking-widest uppercase hidden md:block">
        Role para explorar ↓
      </div>
    </section>
  );
}
