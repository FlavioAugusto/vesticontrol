import { Truck, ShieldCheck, CreditCard, QrCode, RotateCcw, Star } from 'lucide-react';

interface TrustItem { icone: string; titulo: string; desc: string }

const ICONS: Record<string, React.ElementType> = {
  Truck, ShieldCheck, CreditCard, QrCode, RotateCcw, Star,
};

export default function TrustBarDinamico({ items }: { items: TrustItem[] }) {
  // Se não tem items configurados, não renderiza nada (em vez de mostrar fallback By Marcelo)
  if (!items || items.length === 0) return null;
  const itens = items;
  return (
    <section className="bg-white border-y border-cream-darker">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {itens.map(({ icone, titulo, desc }) => {
          const Icon = ICONS[icone] ?? Truck;
          return (
            <div key={titulo} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal font-sans">{titulo}</p>
                <p className="text-[11px] text-charcoal-muted">{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
