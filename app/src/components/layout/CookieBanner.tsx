'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const PRIVACIDADE = `BY MARCELO MEDEIROS — POLÍTICA DE PRIVACIDADE
Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)

O QUE SÃO COOKIES?
Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa nosso site. Eles nos ajudam a oferecer uma experiência melhor.

TIPOS DE COOKIES QUE USAMOS:

🔒 Cookies Essenciais (sempre ativos)
Necessários para o funcionamento básico do site: sessão de login, carrinho de compras e segurança.

📊 Cookies Analíticos (com consentimento)
Nos ajudam a entender como você navega para melhorar o site. Não identificam você pessoalmente.

SEUS DADOS:
• Coletamos apenas o necessário para processar seus pedidos
• Não vendemos seus dados a terceiros
• Você pode solicitar exclusão a qualquer momento: contato@bymarcelomedeiros.com.br
• CNPJ: [CNPJ DA LOJA] · [Cidade/UF]`;

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('bymarcelo_cookie_consent');
    if (!consent) {
      const t = setTimeout(() => setVisivel(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function fechar(tipo: 'aceito' | 'recusado') {
    setSaindo(true);
    localStorage.setItem('bymarcelo_cookie_consent', tipo);
    localStorage.setItem('bymarcelo_cookie_date', new Date().toISOString());
    setTimeout(() => { setVisivel(false); setModalAberto(false); }, 400);
  }

  if (!visivel) return null;

  return (
    <>
      {/* Banner principal */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-400 ${saindo ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-charcoal border-t border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">

            {/* Ícone + texto */}
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Cookie size={15} className="text-gold" />
              </div>
              <div>
                <p className="text-cream font-semibold text-xs mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-green-400" />
                  Privacidade e Proteção de Dados — LGPD
                </p>
                <p className="text-cream/55 text-xs leading-relaxed">
                  Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.
                  Este site está em conformidade com a <strong className="text-cream/75">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
                  Seus dados são tratados com segurança e nunca vendidos a terceiros.{' '}
                  <button
                    onClick={() => setModalAberto(true)}
                    className="text-gold hover:underline font-semibold"
                  >
                    Saiba mais
                  </button>
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => fechar('recusado')}
                className="text-xs text-cream/40 hover:text-cream/70 transition-colors px-3 py-2 border border-white/10 hover:border-white/30 whitespace-nowrap"
              >
                Apenas essenciais
              </button>
              <button
                onClick={() => fechar('aceito')}
                className="bg-gold hover:bg-gold-600 text-white text-xs font-bold px-5 py-2.5 transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                Aceitar todos
              </button>
              <button
                onClick={() => fechar('recusado')}
                className="text-cream/30 hover:text-cream/60 transition-colors p-1"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modal "Saiba mais" — Política de Privacidade resumida */}
      {modalAberto && (
        <div className="fixed inset-0 z-[200] bg-charcoal/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalAberto(false)}>
          <div className="bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-sm shadow-2xl animate-zoom-in"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-600" />
                <h2 className="font-serif text-lg text-charcoal">Privacidade & Cookies</h2>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-charcoal-muted hover:text-charcoal transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="px-6 py-5">
              {PRIVACIDADE.split('\n\n').map((paragrafo, i) => (
                <div key={i} className="mb-4">
                  {paragrafo.split('\n').map((linha, j) => (
                    <p key={j} className={`text-sm leading-relaxed ${
                      linha.startsWith('BY MARCELO') || linha.includes('—') && j === 0
                        ? 'font-bold text-charcoal mb-1'
                        : linha.startsWith('🔒') || linha.startsWith('📊')
                        ? 'font-semibold text-charcoal mt-2 mb-1'
                        : linha.startsWith('•')
                        ? 'text-charcoal-muted ml-3'
                        : linha.trim() === '' ? 'h-2' : 'text-charcoal-muted'
                    }`}>
                      {linha}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* Botões no modal */}
            <div className="px-6 pb-6 flex gap-3 border-t border-cream-darker pt-4 sticky bottom-0 bg-white">
              <button onClick={() => fechar('recusado')}
                className="flex-1 border border-charcoal text-charcoal text-xs font-semibold py-3 hover:bg-cream transition-colors uppercase tracking-wider">
                Apenas Essenciais
              </button>
              <button onClick={() => fechar('aceito')}
                className="flex-1 bg-gold hover:bg-gold-600 text-white text-xs font-bold py-3 uppercase tracking-wider transition-colors">
                Aceitar Todos
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
