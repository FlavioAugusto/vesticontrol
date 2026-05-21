import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  color?: 'gold' | 'green' | 'blue' | 'rose';
}

const colors = {
  gold:  { bg: 'bg-amber-50',   icon: 'text-gold',        iconBg: 'bg-amber-100' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  blue:  { bg: 'bg-blue-50',    icon: 'text-blue-600',    iconBg: 'bg-blue-100' },
  rose:  { bg: 'bg-rose-50',    icon: 'text-rose-500',    iconBg: 'bg-rose-100' },
};

export default function StatCard({ title, value, icon: Icon, change, changeLabel, color = 'gold' }: StatCardProps) {
  const c = colors[color];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-gray-200 transition-all duration-300">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={`sm:hidden ${c.icon}`} strokeWidth={2} />
          <Icon size={20} className={`hidden sm:block ${c.icon}`} strokeWidth={2} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg ${
            change >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
          }`}>
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-charcoal tracking-tight truncate">{value}</p>
      <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-1.5 font-medium line-clamp-2">{title}</p>
      {changeLabel && <p className="text-[10px] text-gray-400 mt-0.5">{changeLabel}</p>}
    </div>
  );
}
