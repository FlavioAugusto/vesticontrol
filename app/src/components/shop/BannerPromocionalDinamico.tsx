'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Banner { titulo: string; subtitulo: string; descricao: string; cta: string; link: string; imagem: string }

const FALLBACK: Banner[] = [
  { titulo: 'Conjuntos\nExclusivos', subtitulo: 'Nova Chegada', descricao: 'Alta costura com tecidos selecionados.', cta: 'Ver Conjuntos', link: '/categorias/conjuntos', imagem: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=800&h=600&fit=crop&q=90' },
  { titulo: 'Vestidos\nLongos', subtitulo: 'Ocasiões Especiais', descricao: 'Para momentos únicos que merecem looks inesquecíveis.', cta: 'Explorar', link: '/categorias/longos', imagem: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop&q=90' },
];

export default function BannerPromocionalDinamico({ banners }: { banners: Banner[] }) {
  const lista = banners.length > 0 ? banners : FALLBACK;
  return (
    <section className="py-6 px-4 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-4">
        {lista.map((b, i) => (
          <Link key={i} href={b.link} className="group relative overflow-hidden block" style={{ aspectRatio: '4/3' }}>
            {b.imagem && <img src={b.imagem} alt={b.titulo.replace('\n', ' ')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
            <div className={`absolute inset-0 ${i % 2 === 0 ? 'bg-gradient-to-r from-charcoal/75 via-charcoal/30 to-transparent' : 'bg-gradient-to-l from-charcoal/75 via-charcoal/30 to-transparent'}`} />
            <div className={`absolute inset-0 flex flex-col justify-end p-8 ${i % 2 === 1 ? 'items-end text-right' : 'items-start'}`}>
              <p className="text-gold text-[10px] font-sans font-semibold tracking-[4px] uppercase mb-2">{b.subtitulo}</p>
              <h3 className="font-display text-3xl md:text-4xl text-cream leading-tight mb-3 whitespace-pre-line">{b.titulo}</h3>
              <p className="text-cream/70 text-xs mb-5 max-w-[200px] leading-relaxed">{b.descricao}</p>
              <span className="inline-flex items-center gap-2 bg-white text-charcoal text-[11px] font-bold tracking-[2px] uppercase px-5 py-2.5 group-hover:bg-gold group-hover:text-white transition-all duration-300">
                {b.cta} <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
