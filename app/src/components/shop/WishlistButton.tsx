'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'by-marcelo-wishlist';

function getLocalWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveLocalWishlist(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('wishlist-update'));
}

interface Props {
  produtoId: string;
  className?: string;
  size?: number;
}

export default function WishlistButton({ produtoId, className = '', size = 14 }: Props) {
  const [favoritado, setFavoritado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      // Tenta API (logado)
      try {
        const res = await fetch('/api/wishlist');
        const data = await res.json();
        if (!cancelado && data.logged) {
          const lista: { produto_id: string }[] = data.items ?? [];
          setFavoritado(lista.some(item => item.produto_id === produtoId));
          return;
        }
      } catch {/* não logado, usa local */}
      // Fallback localStorage
      if (!cancelado) setFavoritado(getLocalWishlist().includes(produtoId));
    }
    carregar();

    function handleUpdate() {
      setFavoritado(getLocalWishlist().includes(produtoId));
    }
    window.addEventListener('wishlist-update', handleUpdate);
    return () => { cancelado = true; window.removeEventListener('wishlist-update', handleUpdate); };
  }, [produtoId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (carregando) return;
    setCarregando(true);
    const novoEstado = !favoritado;
    setFavoritado(novoEstado);

    try {
      // Tenta usar API (logado)
      const res = await fetch('/api/wishlist', {
        method: novoEstado ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId }),
      });

      if (res.status === 401) {
        // Não logado → usa localStorage
        const lista = getLocalWishlist();
        const novaLista = novoEstado ? [...lista, produtoId] : lista.filter(id => id !== produtoId);
        saveLocalWishlist(novaLista);
        toast.success(novoEstado ? 'Adicionado à lista de desejos' : 'Removido da lista');
      } else if (res.ok) {
        toast.success(novoEstado ? 'Adicionado à lista de desejos ❤️' : 'Removido da lista');
      } else {
        setFavoritado(!novoEstado);
        toast.error('Erro ao atualizar');
      }
    } catch {
      // Fallback localStorage
      const lista = getLocalWishlist();
      const novaLista = novoEstado ? [...lista, produtoId] : lista.filter(id => id !== produtoId);
      saveLocalWishlist(novaLista);
      toast.success(novoEstado ? 'Adicionado à lista de desejos' : 'Removido da lista');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favoritado ? 'Remover dos desejos' : 'Adicionar aos desejos'}
      className={`bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${className}`}
    >
      <Heart size={size} className={favoritado ? 'fill-rose text-rose' : 'text-charcoal-muted'} strokeWidth={2} />
    </button>
  );
}
