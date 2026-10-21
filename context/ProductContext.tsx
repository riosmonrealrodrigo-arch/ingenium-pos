'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { useAuth } from './AuthContext';
import { DEMO_PRODUCTS } from '@/lib/mockData';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (data: Omit<Product, 'id' | 'business_id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  toggleStorefront: (id: string, visible_en_tienda: boolean) => Promise<void>;
  updateStock: (id: string, delta: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { business, isDemo } = useAuth();
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);

  // Initialize from localStorage in demo mode if exists
  useEffect(() => {
    if (isDemo && typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_demo_products');
      if (saved) {
        try {
          setProducts(JSON.parse(saved));
        } catch {
          setProducts(DEMO_PRODUCTS);
        }
      } else {
        setProducts(DEMO_PRODUCTS);
      }
    }
  }, [isDemo]);

  const saveProductsToStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_products', JSON.stringify(newProducts));
    }
  };

  const loadProducts = useCallback(async () => {
    if (!business) return;
    if (isDemo) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_products');
        if (saved) setProducts(JSON.parse(saved));
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', business.id)
        .order('name');

      if (error || !data || data.length === 0) {
        // Fallback to demo products if DB is empty or unreachable
        setProducts(DEMO_PRODUCTS);
      } else {
        setProducts(data);
      }
    } catch {
      setProducts(DEMO_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, [business, isDemo]);

  const addProduct = async (data: Omit<Product, 'id' | 'business_id' | 'created_at'>) => {
    if (!business) return;
    if (isDemo) {
      const newP: Product = {
        ...data,
        id: 'prod-' + Date.now(),
        business_id: business.id,
        created_at: new Date().toISOString(),
      };
      saveProductsToStorage([newP, ...products]);
      return;
    }

    try {
      await supabase.from('products').insert({ ...data, business_id: business.id });
      await loadProducts();
    } catch {
      const newP: Product = {
        ...data,
        id: 'prod-' + Date.now(),
        business_id: business.id,
        created_at: new Date().toISOString(),
      };
      saveProductsToStorage([newP, ...products]);
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (isDemo) {
      const updated = products.map(p => (p.id === id ? { ...p, ...data } : p));
      saveProductsToStorage(updated);
      return;
    }

    try {
      await supabase.from('products').update(data).eq('id', id);
      await loadProducts();
    } catch {
      const updated = products.map(p => (p.id === id ? { ...p, ...data } : p));
      saveProductsToStorage(updated);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await updateProduct(id, { active });
  };

  const toggleStorefront = async (id: string, visible_en_tienda: boolean) => {
    await updateProduct(id, { visible_en_tienda });
  };

  const updateStock = async (id: string, delta: number) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);
    await updateProduct(id, { stock: newStock });
  };

  return (
    <ProductContext.Provider value={{ products, loading, loadProducts, addProduct, updateProduct, toggleActive, toggleStorefront, updateStock }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be inside ProductProvider');
  return ctx;
};
