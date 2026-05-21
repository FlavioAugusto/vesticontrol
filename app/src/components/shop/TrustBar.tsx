import { Truck, ShieldCheck, CreditCard, QrCode } from 'lucide-react';

const items = [
  { icon: Truck, title: 'Frete Grátis', desc: 'Conforme política' },
  { icon: ShieldCheck, title: 'Compra Segura', desc: 'Ambiente 100% protegido' },
  { icon: CreditCard, title: '6X Sem Juros', desc: 'No cartão de crédito' },
  { icon: QrCode, title: '10% de Desconto', desc: 'Nas compras no Pix' },
];

export default function TrustBar() {
  return (
    <section className="bg-white border-y border-cream-darker">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal font-sans">{title}</p>
              <p className="text-[11px] text-charcoal-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
