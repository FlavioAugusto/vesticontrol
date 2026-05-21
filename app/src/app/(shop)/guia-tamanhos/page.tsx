'use client';

import { useState, useEffect } from 'react';
import { Ruler, ChevronDown } from 'lucide-react';

interface GuiaTamanhos {
  id: string; nome: string;
  medidas: { label: string; P: string; M: string; G: string }[];
  dica: string;
}

const GUIA_PADRAO: GuiaTamanhos[] = [{
  id: 'vestidos',
  nome: 'Vestidos e Conjuntos',
  medidas: [
    { label: 'Busto', P: '88–92 cm', M: '92–96 cm', G: '96–100 cm' },
    { label: 'Cintura', P: '70–74 cm', M: '74–78 cm', G: '78–82 cm' },
    { label: 'Quadril', P: '94–98 cm', M: '98–102 cm', G: '102–106 cm' },
    { label: 'Comprimento', P: '100–102 cm', M: '102–104 cm', G: '104–106 cm' },
  ],
  dica: 'Meça em centímetros com a fita bem ajustada ao corpo, sem apertar.',
}];

export default function GuiaTamanhosPage() {
  const [guias, setGuias] = useState<GuiaTamanhos[]>(GUIA_PADRAO);
  const [aberto, setAberto] = useState<string>(GUIA_PADRAO[0]?.id ?? '');

  useEffect(() => {
    fetch('/api/admin/guias-tamanhos').then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) { setGuias(d); setAberto(d[0].id); }
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ruler size={24} className="text-gold" />
        </div>
        <h1 className="font-serif text-3xl text-charcoal mb-2">Guia de Tamanhos</h1>
        <p className="text-charcoal-muted text-sm">Encontre o tamanho ideal para você</p>
      </div>

      {/* Como medir */}
      <div className="bg-cream-dark rounded-sm p-5 mb-6">
        <h2 className="font-semibold text-charcoal mb-3 text-sm uppercase tracking-wider">Como Medir</h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Busto', desc: 'Meça na parte mais larga do peito, mantendo os braços relaxados ao longo do corpo.' },
            { label: 'Cintura', desc: 'Meça no ponto mais fino do tronco, logo acima do umbigo.' },
            { label: 'Quadril', desc: 'Meça na parte mais larga dos quadris e glúteos.' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white p-3 rounded-sm">
              <p className="font-semibold text-gold text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className="text-[11px] text-charcoal-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabelas por tipo */}
      <div className="space-y-3">
        {guias.map((g) => (
          <div key={g.id} className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
            <button onClick={() => setAberto(aberto === g.id ? '' : g.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream transition-colors">
              <span className="font-serif text-lg text-charcoal">{g.nome}</span>
              <ChevronDown size={18} className={`text-charcoal-muted transition-transform ${aberto === g.id ? 'rotate-180' : ''}`} />
            </button>
            {aberto === g.id && (
              <div className="px-5 pb-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-charcoal text-cream">
                        <th className="px-4 py-3 text-left font-semibold tracking-wider">Medida</th>
                        <th className="px-4 py-3 text-center font-semibold tracking-wider">P</th>
                        <th className="px-4 py-3 text-center font-semibold tracking-wider">M</th>
                        <th className="px-4 py-3 text-center font-semibold tracking-wider">G</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.medidas.map((m, i) => (
                        <tr key={m.label} className={i % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
                          <td className="px-4 py-3 font-semibold text-charcoal border-b border-gray-100">{m.label}</td>
                          <td className="px-4 py-3 text-center text-charcoal-muted border-b border-gray-100">{m.P}</td>
                          <td className="px-4 py-3 text-center text-charcoal-muted border-b border-gray-100">{m.M}</td>
                          <td className="px-4 py-3 text-center text-charcoal-muted border-b border-gray-100">{m.G}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {g.dica && <p className="text-xs text-charcoal-muted mt-3 italic">💡 {g.dica}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gold/5 border border-gold/20 rounded-sm p-4 text-center">
        <p className="text-sm text-charcoal font-semibold mb-1">Ficou com dúvida?</p>
        <p className="text-xs text-charcoal-muted mb-3">Nossa equipe ajuda a escolher o tamanho ideal para você.</p>
        <a href="https://wa.me/5581994228240" target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 text-xs font-semibold rounded-sm hover:bg-green-600 transition-colors">
          💬 Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}
