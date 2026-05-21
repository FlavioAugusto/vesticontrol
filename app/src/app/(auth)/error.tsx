'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  useEffect(() => {
    console.error('[auth-error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-white/10 rounded-sm p-8 text-center">
        <h1 className="font-display text-2xl tracking-[4px] text-cream uppercase mb-4">
          By Marcelo Medeiros
        </h1>
        <h2 className="font-serif text-xl text-cream mb-3">Ops, algo deu errado</h2>
        <p className="text-cream/60 text-sm mb-6">
          Encontramos um erro ao carregar essa página. Tente novamente.
        </p>

        {error.digest && (
          <p className="text-cream/30 text-[11px] mb-4 font-mono">
            Cód: {error.digest}
          </p>
        )}

        <div className="space-y-3 mb-4">
          <button
            onClick={reset}
            className="w-full bg-gold hover:bg-gold-600 text-white py-3 font-semibold text-sm tracking-wider uppercase transition-colors rounded-sm"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="block w-full border border-white/20 text-cream py-3 font-semibold text-sm tracking-wider uppercase hover:bg-white/5 transition-colors rounded-sm"
          >
            Voltar para a loja
          </Link>
        </div>

        {/* Botão pra mostrar detalhes técnicos — pra ajudar a debugar */}
        <button
          onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
          className="text-cream/40 text-[11px] hover:text-cream/60 transition-colors underline"
        >
          {mostrarDetalhes ? 'Esconder detalhes técnicos' : 'Mostrar detalhes técnicos'}
        </button>

        {mostrarDetalhes && (
          <div className="mt-4 text-left bg-black/40 border border-red-500/20 rounded-sm p-3">
            <p className="text-red-300 text-[11px] font-mono break-all mb-2">
              <strong>Erro:</strong> {error.message || '(sem mensagem)'}
            </p>
            {error.stack && (
              <pre className="text-red-200/70 text-[9px] font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
