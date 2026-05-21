'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-gold' : 'bg-cream-darker',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-1'
        )} />
      </div>
      {label && <span className="text-sm text-charcoal font-sans">{label}</span>}
    </label>
  );
}
