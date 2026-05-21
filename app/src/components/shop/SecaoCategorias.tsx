import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORIAS_FICTICIAS } from '@/data/produtos';

interface CategoriasConfig {
  conjuntos?: string;
  midi?: string;
  longos?: string;
}

interface CategoriasAtivas {
  conjuntos?: boolean;
  midi?: boolean;
  longos?: boolean;
}

interface CategoriasNomes {
  conjuntos?: string;
  midi?: string;
  longos?: string;
}

interface CategoriasSubs {
  conjuntos?: string;
  midi?: string;
  longos?: string;
}

interface CatBoolMap { conjuntos?: boolean; midi?: boolean; longos?: boolean; }
interface CatStrMap { conjuntos?: string; midi?: string; longos?: string; }

interface Props {
  titulo: string;
  subtitulo: string;
  categoriasConfig?: CategoriasConfig;
  categoriasAtivas?: CategoriasAtivas;
  categoriasNomes?: CategoriasNomes;
  categoriasSubs?: CategoriasSubs;
  categoriasMostrarSub?: CatBoolMap;
  categoriasDescs?: CatStrMap;
  categoriasMostrarDesc?: CatBoolMap;
  categoriasCtas?: CatStrMap;
}

const SLUG_TO_KEY: Record<string, keyof CategoriasConfig> = {
  conjuntos: 'conjuntos',
  midi: 'midi',
  longos: 'longos',
};

export default function SecaoCategorias({
  titulo, subtitulo, categoriasConfig, categoriasAtivas, categoriasNomes, categoriasSubs,
  categoriasMostrarSub, categoriasDescs, categoriasMostrarDesc, categoriasCtas,
}: Props) {
  // Filtra coleções ativas (padrão: ativa quando não há config)
  const categoriasVisiveis = CATEGORIAS_FICTICIAS.filter((cat) => {
    const key = SLUG_TO_KEY[cat.slug];
    if (!key || !categoriasAtivas) return true;
    return categoriasAtivas[key] !== false;
  });

  if (categoriasVisiveis.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 md:py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <p className="text-[10px] sm:text-xs text-charcoal-muted font-sans font-semibold tracking-[3px] sm:tracking-[4px] uppercase mb-2">
            {subtitulo}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-charcoal">{titulo}</h2>
        </div>

        {/* Mobile: scroll horizontal. Tablet+: grid 3 colunas */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-3 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoriasVisiveis.map((cat) => {
            const configKey = SLUG_TO_KEY[cat.slug];
            const imgUrl = (categoriasConfig && configKey && categoriasConfig[configKey]) || cat.imagem_url;
            const nomeExibido = (categoriasNomes && configKey && categoriasNomes[configKey]) || cat.nome;
            const subExibido = (categoriasSubs && configKey && categoriasSubs[configKey]) || 'Coleção';
            const mostrarSub = !categoriasMostrarSub || !configKey || categoriasMostrarSub[configKey] !== false;
            const descPersonalizada = categoriasDescs && configKey ? categoriasDescs[configKey] : undefined;
            const descExibida = descPersonalizada !== undefined && descPersonalizada !== '' ? descPersonalizada : cat.descricao;
            const mostrarDesc = !categoriasMostrarDesc || !configKey || categoriasMostrarDesc[configKey] !== false;
            const ctaExibido = (categoriasCtas && configKey && categoriasCtas[configKey]) || 'Ver coleção';
            return (
              <Link
                key={cat.slug}
                href={`/categorias/${cat.slug}`}
                className="group relative overflow-hidden block flex-none w-[75vw] sm:w-auto snap-start"
                style={{ aspectRatio: '4/5' }}
              >
                <img
                  src={imgUrl}
                  alt={nomeExibido}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                  {mostrarSub && subExibido && (
                    <p className="text-[9px] sm:text-[10px] text-gold font-sans font-semibold tracking-[3px] uppercase mb-1">{subExibido}</p>
                  )}
                  <h3 className="font-serif text-xl sm:text-2xl text-cream mb-0.5 sm:mb-1">{nomeExibido}</h3>
                  {mostrarDesc && descExibida && (
                    <p className="text-cream/70 text-xs mb-2 sm:mb-3 hidden sm:block">{descExibida}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-sans font-semibold tracking-widest uppercase text-gold group-hover:gap-3 transition-all">
                    {ctaExibido} <ArrowRight size={10} className="sm:hidden" /><ArrowRight size={11} className="hidden sm:block" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
