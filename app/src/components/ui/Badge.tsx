import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lancamento' | 'bestseller' | 'maisvendidos' | 'pago' | 'pendente' | 'cancelado' | 'enviado' | 'default';
  className?: string;
}

const variantStyles = {
  lancamento:   'bg-gold text-white',
  bestseller:   'bg-rose text-white',
  maisvendidos: 'bg-charcoal text-white',
  pago:         'bg-green-100 text-green-800',
  pendente:     'bg-yellow-100 text-yellow-800',
  cancelado:    'bg-red-100 text-red-800',
  enviado:      'bg-blue-100 text-blue-800',
  default:      'bg-cream-darker text-charcoal-muted',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-block text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
