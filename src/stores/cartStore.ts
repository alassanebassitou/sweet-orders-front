import { create } from 'zustand';

export interface CartPersonnalisation {
  id: string;
  libelle: string;
  prixSupplementaire: number;
}

export interface CartItem {
  produitId: string;
  nom: string;
  photoUrl?: string;
  prixBase: number;
  quantite: number;
  personnalisations: CartPersonnalisation[];
  messageGateau?: string;
  allergenes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (produitId: string) => void;
  updateQuantite: (produitId: string, qty: number) => void;
  updateItem: (produitId: string, patch: Partial<CartItem>) => void;
  clear: () => void;
  getItemTotal: (item: CartItem) => number;
  getTotal: () => number;
  getCount: () => number;
}

const itemTotal = (i: CartItem) =>
  (i.prixBase + i.personnalisations.reduce((s, p) => s + p.prixSupplementaire, 0)) * i.quantite;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((s) => {
      // Each add creates a new line (different personnalisations possible)
      return { items: [...s.items, item] };
    }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.produitId !== id) })),
  updateQuantite: (id, qty) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.produitId === id ? { ...i, quantite: Math.max(0, qty) } : i))
        .filter((i) => i.quantite > 0),
    })),
  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.produitId === id ? { ...i, ...patch } : i)) })),
  clear: () => set({ items: [] }),
  getItemTotal: itemTotal,
  getTotal: () => get().items.reduce((s, i) => s + itemTotal(i), 0),
  getCount: () => get().items.reduce((s, i) => s + i.quantite, 0),
}));
