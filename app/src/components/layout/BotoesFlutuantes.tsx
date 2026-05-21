'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  whatsapp: string;
  mensagem?: string;
  ativo?: boolean;
}

function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.55 4.104 1.513 5.833L.057 23.891a.5.5 0 0 0 .611.611l6.058-1.456A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.93 0-3.73-.527-5.27-1.44l-.376-.224-3.898.937.953-3.798-.245-.39A9.796 9.796 0 0 1 2.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z" />
    </svg>
  );
}

export default function BotoesFlutuantes({ whatsapp, mensagem, ativo = true }: Props) {
  const [mostrarTopo, setMostrarTopo] = useState(false);
  const [mostrarTooltip, setMostrarTooltip] = useState(true);

  if (!ativo) return null;

  useEffect(() => {
    function handleScroll() {
      setMostrarTopo(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Esconde o tooltip após 6s
  useEffect(() => {
    const t = setTimeout(() => setMostrarTooltip(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const numeroLimpo = (whatsapp || '81994228240').replace(/\D/g, '');
  const textoMensagem = encodeURIComponent(mensagem || 'Olá! Vim pelo site e gostaria de falar com um atendente.');
  // Formata número para exibir
  const numeroFormatado = numeroLimpo.length === 11
    ? `(${numeroLimpo.slice(0,2)}) ${numeroLimpo.slice(2,7)}-${numeroLimpo.slice(7)}`
    : numeroLimpo;

  function voltarAoTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      {/* WhatsApp — sempre visível, pulsando */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {/* Botão Voltar ao Topo (discreto) */}
        <button
          onClick={voltarAoTopo}
          aria-label="Voltar ao topo"
          className={`w-10 h-10 rounded-full bg-charcoal/80 hover:bg-charcoal text-white shadow-lg backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
            mostrarTopo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>

        {/* WhatsApp com tooltip */}
        <div className="relative flex items-center">
          {/* Tooltip "Falar com nosso atendente" */}
          {mostrarTooltip && (
            <div className="absolute right-full mr-3 bg-white rounded-lg shadow-xl px-4 py-2.5 whitespace-nowrap animate-fade-in border border-gray-100">
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-[-45deg]" />
              <p className="text-xs font-semibold text-charcoal">Falar com nosso atendente</p>
              <p className="text-[11px] text-charcoal-muted">{numeroFormatado}</p>
            </div>
          )}

          {/* Anel pulsando */}
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-50 animate-ping" style={{ animationDelay: '0.5s' }} />

          <a
            href={`https://wa.me/55${numeroLimpo}?text=${textoMensagem}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp - Falar com atendente"
            onClick={() => setMostrarTooltip(false)}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-2xl shadow-green-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
            <WhatsAppIcon size={28} />
          </a>
        </div>
      </div>
    </>
  );
}
