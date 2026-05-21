import Link from 'next/link';
import type { Categoria } from '@/types/database';

interface CategoryCardProps {
  categoria: Categoria;
}

export default function CategoryCard({ categoria }: CategoryCardProps) {
  return (
    <Link
      href={`/categorias/${categoria.slug}`}
      className="group relative overflow-hidden aspect-[4/5] bg-charcoal-light block card-hover"
    >
      {categoria.imagem_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${categoria.imagem_url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gold-900 to-charcoal" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-xs text-gold font-sans font-semibold tracking-widest uppercase mb-1">Coleção</p>
        <h3 className="font-serif text-xl text-cream">{categoria.nome}</h3>
        {categoria.descricao && (
          <p className="text-cream/60 text-xs mt-1 line-clamp-2">{categoria.descricao}</p>
        )}
        <span className="inline-block mt-3 text-xs font-sans font-semibold tracking-widest uppercase text-gold group-hover:text-cream transition-colors">
          Ver coleção →
        </span>
      </div>
    </Link>
  );
}
