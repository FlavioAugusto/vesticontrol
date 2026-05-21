'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Settings, LogOut, ChevronRight,
  Tag, MessageSquare, Layers, Warehouse,
  ExternalLink, Star, Palette,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navSections = [
  {
    title: 'Principal',
    items: [
      { href: '/admin',          icon: LayoutDashboard, label: 'Dashboard',   exact: true },
      { href: '/admin/site',     icon: Layers,          label: 'Editor do Site' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/admin/produtos',   icon: Package,      label: 'Produtos' },
      { href: '/admin/categorias', icon: Layers,       label: 'Categorias' },
      { href: '/admin/estoque',    icon: Warehouse,    label: 'Estoque' },
      { href: '/admin/cores',      icon: Palette,      label: 'Cores' },
      { href: '/admin/cupons',     icon: Tag,           label: 'Cupons' },
    ],
  },
  {
    title: 'Vendas',
    items: [
      { href: '/admin/pedidos',  icon: ShoppingCart, label: 'Pedidos' },
      { href: '/admin/clientes', icon: Users,        label: 'Clientes' },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { href: '/admin/avaliacoes',  icon: Star,           label: 'Avaliações' },
      { href: '/admin/depoimentos', icon: MessageSquare,  label: 'Depoimentos' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/relatorios',    icon: BarChart3, label: 'Relatórios' },
      { href: '/admin/painel-config', icon: Settings,  label: 'Configurações' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lojaInfo, setLojaInfo] = useState<{ nome: string; logo_url?: string }>({ nome: 'Sua Loja' });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/minha-loja', { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (d.loja?.nome) {
          // Tenta pegar logo das configs
          const configRes = await fetch('/api/admin/configs-completas', { cache: 'no-store' });
          let logoUrl = '';
          if (configRes.ok) {
            const cfg = await configRes.json();
            logoUrl = cfg.loja_logo_url || '';
          }
          setLojaInfo({ nome: d.loja.nome, logo_url: logoUrl });
        }
      } catch { /* fallback */ }
    })();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Iniciais da loja (By Marcelo Medeiros → BM)
  const iniciais = lojaInfo.nome
    .split(' ')
    .filter(p => p.length > 0)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase() || 'SL';

  return (
    <aside className="w-[260px] min-h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-700 flex items-center justify-center shadow-md shadow-gold/20 overflow-hidden">
            {lojaInfo.logo_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={lojaInfo.logo_url} alt={lojaInfo.nome}
                className="w-full h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="text-white text-xs font-bold tracking-tight">{iniciais}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[13px] tracking-[0.18em] text-charcoal truncate uppercase">{lojaInfo.nome}</p>
            <p className="text-[10px] text-gray-400 tracking-wider mt-0.5">PAINEL ADMINISTRATIVO</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link key={href} href={href}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-gold/8 text-gold border border-gold/15 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-charcoal border border-transparent'
                    }`}>
                    <span className="flex items-center gap-3">
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-gold' : 'text-gray-400 group-hover:text-charcoal'} />
                      {label}
                    </span>
                    {active && <ChevronRight size={12} className="text-gold/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <Link href="/" target="_blank"
          className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-gray-400 hover:text-charcoal transition-colors rounded-xl hover:bg-gray-50 mb-1 font-medium">
          <ExternalLink size={13} />
          Ver site
        </Link>
        <button onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-gray-400 hover:text-red-500 w-full transition-colors rounded-xl hover:bg-red-50 font-medium">
          <LogOut size={13} />
          Encerrar sessão
        </button>
      </div>
    </aside>
  );
}
