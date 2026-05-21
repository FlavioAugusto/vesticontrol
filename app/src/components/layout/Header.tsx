'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingBag, User, Heart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

interface HeaderProps {
  onMenuOpen?: () => void;
  logoUrl?: string;
  nomeLoja?: string;
  categorias?: { nome: string; slug: string }[];
}

export default function Header({ onMenuOpen, logoUrl = '', nomeLoja = 'Sua Loja', categorias = [] }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [logado, setLogado] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const setCartOpen = useCartStore((s) => s.setOpen);

  useEffect(() => {
    import('@/lib/supabase/client').then(({ createClient }) => {
      const s = createClient();
      s.auth.getUser().then(({ data }) => setLogado(!!data.user));
      s.auth.onAuthStateChange((_, session) => setLogado(!!session));
    });
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}>

      {/* Linha 1 — Logo + ações */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4 relative">
          <button onClick={onMenuOpen} className="md:hidden text-charcoal hover:text-gold transition-colors">
            <Menu size={22} />
          </button>

          {/* Busca desktop esquerda */}
          <button onClick={() => setSearchOpen(!searchOpen)}
            className="hidden md:flex w-9 h-9 items-center justify-center text-charcoal hover:text-gold transition-colors">
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* Logo central */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={nomeLoja}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            </div>
          </Link>

          {/* Ações direita */}
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-charcoal hover:text-gold transition-colors">
              <Search size={18} />
            </button>
            <Link
              href={logado ? '/minha-conta' : '/login'}
              className="hidden md:flex w-9 h-9 items-center justify-center text-charcoal hover:text-gold transition-colors relative"
              title={logado ? 'Minha Conta' : 'Entrar'}
            >
              <User size={18} />
              {logado && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
              )}
            </Link>
            <Link href="/minha-conta/desejos" className="hidden md:flex w-9 h-9 items-center justify-center text-charcoal hover:text-gold transition-colors">
              <Heart size={18} />
            </Link>
            <button onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 flex items-center justify-center text-charcoal hover:text-gold transition-colors"
              aria-label="Carrinho">
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-gold text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Linha 2 — Navegação (dinâmica por loja) */}
      {categorias.length > 0 && (
        <div className="border-t border-gray-100">
          <nav className="hidden md:flex items-center justify-center gap-10 h-10 max-w-7xl mx-auto px-4">
            {categorias.slice(0, 6).map((cat) => (
              <Link key={cat.slug} href={`/categorias/${cat.slug}`}
                className="text-[11px] font-sans font-semibold uppercase tracking-[2px] text-charcoal hover:text-gold transition-colors py-2 border-b-2 border-transparent hover:border-gold">
                {cat.nome}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Busca expansível */}
      {searchOpen && (
        <div className="border-t border-gray-100 px-4 py-3 bg-white animate-fade-up">
          <div className="max-w-xl mx-auto relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted" />
            <input autoFocus type="text" value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Buscar por nome ou código (ex: vestido atenas, 77824)..."
              className="input-field pl-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
                if (e.key === 'Enter' && searchVal.trim()) {
                  window.location.href = `/produtos?q=${encodeURIComponent(searchVal.trim())}`;
                }
              }} />
            <p className="text-[10px] text-charcoal-muted mt-1.5 text-center">
              Pressione <kbd className="font-mono bg-gray-100 px-1 rounded">Enter</kbd> pra buscar
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
