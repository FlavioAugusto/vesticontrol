'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, User, Heart, ShoppingBag, MessageCircle } from 'lucide-react';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  nomeLoja?: string;
  categorias?: { nome: string; slug: string }[];
}

export default function MobileMenu({ open, onClose, nomeLoja = 'Sua Loja', categorias = [] }: MobileMenuProps) {
  const links = categorias.map(c => ({ label: c.nome, href: `/categorias/${c.slug}` }));

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-cream flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-darker">
          <span className="font-display text-base tracking-widest text-charcoal">{nomeLoja.toUpperCase()}</span>
          <button onClick={onClose} className="text-charcoal-muted hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
          {links.map(({ label, href }) => (
            <Link key={href} href={href} onClick={onClose}
              className="block py-3 border-b border-cream-darker text-sm font-semibold tracking-widest uppercase text-charcoal hover:text-gold transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-cream-darker space-y-3">
          <Link href="/minha-conta" onClick={onClose} className="flex items-center gap-3 text-sm text-charcoal hover:text-gold transition-colors">
            <User size={16} /> Minha Conta
          </Link>
          <Link href="/minha-conta/desejos" onClick={onClose} className="flex items-center gap-3 text-sm text-charcoal hover:text-gold transition-colors">
            <Heart size={16} /> Lista de Desejos
          </Link>
          <Link href="/carrinho" onClick={onClose} className="flex items-center gap-3 text-sm text-charcoal hover:text-gold transition-colors">
            <ShoppingBag size={16} /> Carrinho
          </Link>
        </div>

        <div className="px-5 py-4 bg-charcoal flex gap-4">
          <a href="https://instagram.com/by.marcelomedeiros" target="_blank" rel="noopener" className="text-cream/60 hover:text-gold transition-colors">
            <InstagramIcon size={18} />
          </a>
          <a href="https://wa.me/5581999999999" target="_blank" rel="noopener" className="text-cream/60 hover:text-gold transition-colors">
            <MessageCircle size={18} />
          </a>
        </div>
      </aside>
    </>
  );
}
