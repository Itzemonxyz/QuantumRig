import { create } from 'zustand';
import { User, Category, Brand, Product, Order, Settings, Offer, Analytics, UserNotification } from './types';

interface StoreState {
  user: User | null;
  token: string | null;
  categories: Category[];
  brands: Brand[];
  products: Product[];
  offers: Offer[];
  settings: Settings | null;
  analytics: Analytics | null;
  notifications: UserNotification[];
  cart: { product: Product; quantity: number }[];
  builderCart: { [categoryId: string]: Product };
  isLoading: boolean;

  // Actions
  setIsLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setCategories: (categories: Category[]) => void;
  setBrands: (brands: Brand[]) => void;
  setProducts: (products: Product[]) => void;
  setOffers: (offers: Offer[]) => void;
  setSettings: (settings: Settings) => void;
  setAnalytics: (analytics: Analytics) => void;
  setNotifications: (notifications: UserNotification[]) => void;
  markNotificationRead: (id: string) => void;
  
  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Builder
  addToBuilder: (categoryId: string, product: Product) => void;
  removeFromBuilder: (categoryId: string) => void;
  clearBuilder: () => void;

  // Compare
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  categories: [],
  brands: [],
  products: [],
  offers: [],
  settings: null,
  analytics: null,
  notifications: [],
  cart: [],
  builderCart: {},
  compareIds: [],
  isLoading: true,

  setIsLoading: (loading) => set({ isLoading: loading }),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, notifications: [] });
  },
  updateUser: (user) => set({ user }),
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  setProducts: (products) => set({ products }),
  setOffers: (offers) => set({ offers }),
  setSettings: (settings) => set({ settings }),
  setAnalytics: (analytics) => set({ analytics }),
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set((state) => ({ 
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) 
  })),

  addToCart: (product, quantity = 1) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item),
      };
    }
    return { cart: [...state.cart, { product, quantity }] };
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.product.id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item)
  })),
  clearCart: () => set({ cart: [] }),

  addToBuilder: (categoryId, product) => set((state) => ({
    builderCart: { ...state.builderCart, [categoryId]: product }
  })),
  removeFromBuilder: (categoryId) => set((state) => {
    const newBuilder = { ...state.builderCart };
    delete newBuilder[categoryId];
    return { builderCart: newBuilder };
  }),
  clearBuilder: () => set({ builderCart: {} }),

  toggleCompare: (productId) => set((state) => {
    if (state.compareIds.includes(productId)) {
      return { compareIds: state.compareIds.filter(id => id !== productId) };
    }
    if (state.compareIds.length >= 2) {
      return state;
    }
    return { compareIds: [...state.compareIds, productId] };
  }),
  clearCompare: () => set({ compareIds: [] }),
}));
