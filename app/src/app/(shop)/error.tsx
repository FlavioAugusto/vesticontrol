'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[shop-error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="font-serif text-2xl text-charcoal mb-3">Ops, algo deu errado</h2>
        <p className="text-charcoal-muted text-sm mb-6">
          Encontramos um erro ao carregar essa página. Tente novamente em instantes.
        </p>
        {error.digest && (
          <p className="text-charcoal-muted/60 text-[11px] mb-4 font-mono">
            Cód: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={reset}
            className="bg-gold hover:bg-gold-600 text-white py-3 font-semibold text-sm tracking-wider uppercase transition-colors rounded-sm"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="border border-charcoal text-charcoal py-3 font-semibold text-sm tracking-wider uppercase hover:bg-charcoal hover:text-white transition-colors rounded-sm"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
