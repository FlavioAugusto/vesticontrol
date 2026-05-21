import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  produto_id: string;
  variante_id: string;
  nome: string;
  slug?: string;
  preco: number;
  tamanho: string;
  cor?: string;
  cor_hex?: string;
  quantidade: number;
  imagem?: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (varianteId: string) => void;
  updateQuantity: (varianteId: string, quantidade: number) => void;
  clearCart: () => void;
  setOpen: (open: boolean) => void;
  total: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.variante_id === item.variante_id);
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.variante_id === item.variante_id
                ? { ...i, quantidade: i.quantidade + item.quantidade }
                : i
            ),
          };
        }
        return { items: [...state.items, item] };
      }),

      removeItem: (varianteId) => set((state) => ({
        items: state.items.filter((i) => i.variante_id !== varianteId),
      })),

      updateQuantity: (varianteId, quantidade) => set((state) => ({
        items: quantidade <= 0
          ? state.items.filter((i) => i.variante_id !== varianteId)
          : state.items.map((i) => i.variante_id === varianteId ? { ...i, quantidade } : i),
      })),

      clearCart: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      total: () => get().items.reduce((s, i) => s + i.preco * i.quantidade, 0),
      totalItems: () => get().items.reduce((s, i) => s + i.quantidade, 0),
    }),
    { name: 'by-marcelo-cart' }
  )
);
