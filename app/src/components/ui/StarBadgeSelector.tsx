'use client';

import { Star } from 'lucide-react';

type BadgeType = 'lancamento' | 'bestseller' | 'maisvendidos' | null;

interface Props {
  value: BadgeType;
  onChange: (badge: BadgeType) => void;
}

const CONFIG = [
  { estrelas: 5, badge: 'lancamento' as BadgeType,   label: 'Lançamento',   cor: 'text-gold',     bg: 'bg-gold/10 border-gold' },
  { estrelas: 4, badge: 'bestseller' as BadgeType,   label: 'Best-Seller',  cor: 'text-rose',     bg: 'bg-rose/10 border-rose' },
  { estrelas: 3, badge: 'maisvendidos' as BadgeType, label: 'Mais Vendidos', cor: 'text-charcoal', bg: 'bg-charcoal/10 border-charcoal' },
  { estrelas: 0, badge: null,                         label: 'Sem badge',    cor: 'text-gray-400', bg: 'bg-gray-50 border-gray-200' },
];

function estrelaValor(badge: BadgeType): number {
  if (badge === 'lancamento')   return 5;
  if (badge === 'bestseller')   return 4;
  if (badge === 'maisvendidos') return 3;
  return 0;
}

export default function StarBadgeSelector({ value, onChange }: Props) {
  const atual = estrelaValor(value);

  return (
    <div>
      <label className="block text-xs font-semibold text-charcoal-muted uppercase tracking-wider mb-2">
        Classificação (Badge)
      </label>
      <div className="grid grid-cols-4 gap-2">
        {CONFIG.map(({ estrelas, badge, label, cor, bg }) => {
          const ativo = value === badge;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(badge)}
              className={`flex flex-col items-center gap-1.5 p-3 border rounded-sm transition-all ${ativo ? `${bg} shadow-sm scale-105` : 'border-gray-200 bg-white hover:border-gold'}`}
            >
              {/* Estrelas */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < estrelas ? `${cor} fill-current` : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${ativo ? cor : 'text-charcoal-muted'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-charcoal-muted mt-1.5">
        ⭐⭐⭐⭐⭐ = Lançamento &nbsp;·&nbsp; ⭐⭐⭐⭐ = Best-Seller &nbsp;·&nbsp; ⭐⭐⭐ = Mais Vendidos
      </p>
    </div>
  );
}
