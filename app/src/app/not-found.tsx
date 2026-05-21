import Link from 'next/link';
import { getConfiguracoes } from '@/lib/configuracoes';

export const revalidate = 30;

export default async function NotFound() {
  const configs = await getConfiguracoes();
  const logo = configs.loja_logo_url || '/images/logo.svg';
  const nome = configs.loja_nome || 'By Marcelo Medeiros';

  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <div className="mb-8">
        <img
          src={logo}
          alt={nome}
          className="h-16 w-auto mx-auto object-contain"
        />
      </div>

      {/* Número 404 decorativo */}
      <div className="relative mb-6">
        <span className="font-display text-[120px] md:text-[160px] text-white/5 leading-none select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-px bg-gold mx-4" />
          <span className="text-gold font-sans font-semibold text-xs tracking-[4px] uppercase">Página não encontrada</span>
          <div className="w-16 h-px bg-gold mx-4" />
        </div>
      </div>

      {/* Mensagem */}
      <h1 className="font-serif text-2xl md:text-3xl text-cream mb-3">
        Ops! Esta página não existe mais
      </h1>
      <p className="text-cream/50 text-sm max-w-md mb-10 leading-relaxed">
        A página que você está procurando pode ter sido movida, renomeada ou não existe.
        Mas não se preocupe — nossa coleção completa está esperando por você!
      </p>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="bg-gold hover:bg-gold-600 text-white px-8 py-4 font-sans font-bold text-sm tracking-[2px] uppercase transition-colors"
        >
          ← Voltar à Loja
        </Link>
        <Link
          href="/produtos"
          className="border border-cream/30 text-cream/70 hover:border-gold hover:text-gold px-8 py-4 font-sans font-semibold text-sm tracking-[2px] uppercase transition-colors"
        >
          Ver Coleção
        </Link>
      </div>
    </div>
  );
}
