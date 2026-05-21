'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, ShoppingBag, Heart, MapPin, LogOut, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const links = [
  { href: '/minha-conta', label: 'Minha Conta', icon: User, exact: true },
  { href: '/minha-conta/pedidos', label: 'Meus Pedidos', icon: ShoppingBag },
  { href: '/minha-conta/desejos', label: 'Lista de Desejos', icon: Heart },
  { href: '/minha-conta/perfil', label: 'Meus Dados', icon: MapPin },
];

export default function ContaNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="bg-white rounded-sm shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-cream-darker">
        <p className="text-xs text-charcoal-muted uppercase tracking-widest font-sans font-semibold">Minha Conta</p>
      </div>
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={cn('flex items-center gap-3 px-4 py-3 text-sm border-b border-cream-darker transition-colors',
              active ? 'bg-gold/5 text-gold font-semibold border-l-2 border-l-gold' : 'text-charcoal hover:bg-cream hover:text-gold')}>
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
      <button onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal-muted hover:text-red-500 transition-colors w-full border-b border-cream-darker">
        <LogOut size={15} />
        Sair
      </button>
      <Link href="/"
        className="flex items-center gap-3 px-4 py-3 text-sm text-charcoal-muted hover:text-gold transition-colors">
        <ArrowLeft size={15} />
        Voltar ao Site
      </Link>
    </nav>
  );
}
