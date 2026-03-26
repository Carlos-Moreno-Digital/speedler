'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import React from 'react';
import type { CartItem, CartState } from '@/types';

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getCanonDigitalTotal: () => number;
  getTotal: () => number;
  itemCount: number;
}

const CART_STORAGE_KEY = 'speedler_cart';

const emptyState: CartState = {
  items: [],
  subtotal: 0,
  canonDigitalTotal: 0,
  total: 0,
};

const CartContext = createContext<CartContextValue | null>(null);

function calculateTotals(items: CartItem[]): CartState {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const canonDigitalTotal = items.reduce(
    (sum, item) => sum + item.canonDigital * item.quantity,
    0
  );
  const total = Math.round((subtotal + canonDigitalTotal) * 100) / 100;

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    canonDigitalTotal: Math.round(canonDigitalTotal * 100) / 100,
    total,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          setState(calculateTotals(parsed));
        }
      }
    } catch {
      // Ignore invalid stored data
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items, hydrated]);

  // Sync with API (debounced)
  useEffect(() => {
    if (!hydrated || state.items.length === 0) return;
    const timeout = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.items }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state.items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
      setState((prev) => {
        const existing = prev.items.find(
          (i) => i.productId === item.productId
        );
        let newItems: CartItem[];

        if (existing) {
          const newQty = Math.min(
            existing.quantity + (item.quantity ?? 1),
            existing.stock
          );
          newItems = prev.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          );
        } else {
          newItems = [
            ...prev.items,
            { ...item, quantity: Math.min(item.quantity ?? 1, item.stock) },
          ];
        }

        return calculateTotals(newItems);
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setState((prev) => {
      const newItems = prev.items.filter((i) => i.productId !== productId);
      return calculateTotals(newItems);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setState((prev) => {
      if (quantity <= 0) {
        return calculateTotals(
          prev.items.filter((i) => i.productId !== productId)
        );
      }
      const newItems = prev.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i
      );
      return calculateTotals(newItems);
    });
  }, []);

  const clearCart = useCallback(() => {
    setState(emptyState);
    localStorage.removeItem(CART_STORAGE_KEY);
    fetch('/api/cart', { method: 'DELETE' }).catch(() => {});
  }, []);

  const getSubtotal = useCallback(() => state.subtotal, [state.subtotal]);
  const getCanonDigitalTotal = useCallback(
    () => state.canonDigitalTotal,
    [state.canonDigitalTotal]
  );
  const getTotal = useCallback(() => state.total, [state.total]);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextValue = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getCanonDigitalTotal,
    getTotal,
    itemCount,
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default useCart;
