import { Star } from 'lucide-react';

const reviews = [
  { name: 'Ana Paula M.', city: 'Recife, PE', rating: 5, text: 'Amei o conjunto! A qualidade é incrível, e chegou antes do prazo. Super indico!', produto: 'Conjunto Elegância' },
  { name: 'Carla Santos', city: 'São Paulo, SP', rating: 5, text: 'O vestido midi é perfeito. O caimento é maravilhoso e o tecido é de altíssima qualidade.', produto: 'Vestido Midi Clássico' },
  { name: 'Fernanda Lima', city: 'Brasília, DF', rating: 5, text: 'Já é a terceira compra e nunca decepcionou. Atendimento excelente e produto premium!', produto: 'Vestido Longo Noite' },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < count ? 'fill-gold text-gold' : 'text-cream-darker'} />
      ))}
    </div>
  );
}

export default function Reviews() {
  return (
    <section className="py-16 px-4 bg-cream-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="section-subtitle">Depoimentos</p>
          <h2 className="section-title">O Que Dizem Nossas Clientes</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Stars count={5} />
            <span className="text-sm text-charcoal-muted font-sans">4.9/5 · 320+ avaliações</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white p-6 rounded-sm shadow-sm">
              <Stars count={r.rating} />
              <p className="text-sm text-charcoal-light mt-3 leading-relaxed italic">&ldquo;{r.text}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-cream-darker flex items-center justify-between">
                <div>
                  <p className="font-sans font-semibold text-xs text-charcoal">{r.name}</p>
                  <p className="text-[10px] text-charcoal-muted">{r.city}</p>
                </div>
                <p className="text-[10px] text-charcoal-muted text-right">{r.produto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
