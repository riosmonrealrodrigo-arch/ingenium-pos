'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const removeFromCart = (productId: string) =>
    setItems(prev => prev.filter(i => i.product.id !== productId));

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const updateDiscount = (productId: string, discount: number) =>
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, discount } : i));

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((acc, i) => acc + i.product.sale_price * i.quantity, 0);
  const totalDiscount = items.reduce((acc, i) => acc + i.discount * i.quantity, 0);
  const total = subtotal - totalDiscount;
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, updateDiscount, clearCart, subtotal, totalDiscount, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
