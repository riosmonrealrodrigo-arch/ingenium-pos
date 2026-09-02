'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { useAuth } from './AuthContext';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (data: Omit<Product, 'id' | 'business_id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  updateStock: (id: string, delta: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .order('name');
    setProducts(data ?? []);
    setLoading(false);
  }, [business]);

  const addProduct = async (data: Omit<Product, 'id' | 'business_id' | 'created_at'>) => {
    if (!business) return;
    await supabase.from('products').insert({ ...data, business_id: business.id });
    await loadProducts();
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    await supabase.from('products').update(data).eq('id', id);
    await loadProducts();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('products').update({ active }).eq('id', id);
    await loadProducts();
  };

  const updateStock = async (id: string, delta: number) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
    await loadProducts();
  };

  return (
    <ProductContext.Provider value={{ products, loading, loadProducts, addProduct, updateProduct, toggleActive, updateStock }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be inside ProductProvider');
  return ctx;
};
