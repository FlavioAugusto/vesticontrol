import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const banners = [
  {
    titulo: 'Vestidos\nLongos',
    subtitulo: 'Para ocasiões inesquecíveis',
    cta: 'Explorar',
    href: '/categorias/longos',
    imagem: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=900&h=600&fit=crop&q=90',
    overlay: 'from-charcoal/70 via-charcoal/30 to-transparent',
  },
  {
    titulo: 'Vestidos\nMidi',
    subtitulo: 'Elegância no dia a dia',
    cta: 'Explorar',
    href: '/categorias/midi',
    imagem: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&h=600&fit=crop&q=90',
    overlay: 'from-charcoal/65 via-charcoal/25 to-transparent',
  },
  {
    titulo: 'Conjuntos',
    subtitulo: 'Alta costura coordenada',
    cta: 'Explorar',
    href: '/categorias/conjuntos',
    imagem: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&h=600&fit=crop&q=90',
    overlay: 'from-charcoal/70 via-charcoal/20 to-transparent',
  },
  {
    titulo: 'Lançamentos',
    subtitulo: 'Peças exclusivas recém-chegadas',
    cta: 'Ver novidades',
    href: '/produtos?badge=lancamento',
    imagem: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&h=600&fit=crop&q=90',
    overlay: 'from-charcoal/60 via-charcoal/20 to-transparent',
  },
];

export default function BannerCategorias() {
  return (
    <section className="py-16 px-4 bg-cream-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs text-charcoal-muted font-sans font-semibold tracking-[4px] uppercase mb-2">Navegue por</p>
          <h2 className="font-serif text-3xl md:text-4xl text-charcoal">Nossas Categorias</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {banners.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group relative overflow-hidden block rounded-sm"
              style={{ aspectRatio: '3/4' }}
            >
              <img
                src={b.imagem}
                alt={b.titulo}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${b.overlay} transition-opacity duration-300 group-hover:opacity-90`} />

              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-5">
                <p className="text-[9px] md:text-[10px] text-gold font-sans font-semibold tracking-[3px] uppercase mb-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {b.subtitulo}
                </p>
                <h3 className="font-serif text-xl md:text-2xl text-cream leading-tight whitespace-pre-line mb-2">
                  {b.titulo}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold tracking-widest uppercase text-gold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
                  {b.cta} <ArrowRight size={10} />
                </span>
              </div>

              {/* Linha dourada no hover */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
