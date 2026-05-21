'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MobileMenu from '@/components/layout/MobileMenu';
import CartSidebar from '@/components/shop/CartSidebar';

interface Props {
  children: React.ReactNode;
  logoUrl?: string;
  nomeLoja?: string;
  categorias?: { nome: string; slug: string }[];
}

export default function ShopClientLayout({ children, logoUrl, nomeLoja, categorias }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header
        onMenuOpen={() => setMenuOpen(true)}
        logoUrl={logoUrl ?? ''}
        nomeLoja={nomeLoja ?? 'Sua Loja'}
        categorias={categorias ?? []}
      />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nomeLoja={nomeLoja ?? 'Sua Loja'} categorias={categorias ?? []} />
      <CartSidebar />
      {children}
    </>
  );
}
