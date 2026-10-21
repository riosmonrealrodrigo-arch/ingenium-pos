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
  deleteProduct: (id: string) => Promise<void>;
  purgeDemoProducts: () => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<void>;
  toggleStorefront: (id: string, visible_en_tienda: boolean) => Promise<void>;
  updateStock: (id: string, delta: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const isDemoCleared = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ingenium_demo_cleared') === 'true';
  };

  const saveProductsToStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_products', JSON.stringify(newProducts));
    }
  };

  // Carga reactiva desde Supabase
  const loadProducts = useCallback(async () => {
    setLoading(true);
    const cleared = isDemoCleared();

    try {
      // Consulta a la tabla products de Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          setProducts(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ingenium_demo_products', JSON.stringify(data));
          }
        } else {
          // Si la base de datos está vacía
          if (cleared) {
            setProducts([]);
          } else {
            setProducts(DEMO_PRODUCTS);
          }
        }
      } else {
        // Fallback local/offline si no hay conexión
        if (cleared) {
          setProducts([]);
        } else if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('ingenium_demo_products');
          setProducts(saved ? JSON.parse(saved) : DEMO_PRODUCTS);
        }
      }
    } catch {
      if (cleared) {
        setProducts([]);
      } else {
        setProducts(DEMO_PRODUCTS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Suscripción Supabase Realtime para sincronizar POS y Tienda Web en vivo
  useEffect(() => {
    loadProducts();

    try {
      const channel = supabase
        .channel('realtime_products_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          payload => {
            // Recargar productos automáticamente en cuanto haya cualquier cambio (INSERT, UPDATE, DELETE)
            loadProducts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }
  }, [loadProducts]);

  const addProduct = async (data: Omit<Product, 'id' | 'business_id' | 'created_at'>) => {
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : undefined;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_demo_cleared');
    }

    try {
      const { data: inserted, error } = await supabase
        .from('products')
        .insert({
          code: data.code,
          name: data.name,
          description: data.description,
          commercial_description: data.commercial_description || data.description,
          image_url: data.image_url,
          visible_en_tienda: data.visible_en_tienda !== false,
          category_id: data.category_id || null,
          purchase_price: data.purchase_price,
          sale_price: data.sale_price,
          stock: data.stock,
          min_stock: data.min_stock,
          active: data.active,
          ...(bizId ? { business_id: bizId } : {}),
        })
        .select()
        .single();

      if (!error && inserted) {
        const updated = [inserted, ...products.filter(p => p.id !== inserted.id)];
        saveProductsToStorage(updated);
        return;
      }
    } catch (e) {
      console.warn('Error al insertar en Supabase:', e);
    }

    const newP: Product = {
      ...data,
      id: 'prod-' + Date.now(),
      business_id: bizId || 'demo-biz-1',
      created_at: new Date().toISOString(),
    };
    saveProductsToStorage([newP, ...products]);
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    // Actualización optimista local
    const updated = products.map(p => (p.id === id ? { ...p, ...data } : p));
    saveProductsToStorage(updated);

    try {
      await supabase
        .from('products')
        .update(data)
        .eq('id', id);
    } catch (e) {
      console.warn('Error al actualizar producto en Supabase:', e);
    }
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProductsToStorage(updated);

    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Error al eliminar producto en Supabase:', e);
    }
  };

  const purgeDemoProducts = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_cleared', 'true');
      localStorage.removeItem('ingenium_demo_products');
    }

    setProducts([]);

    try {
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Aviso de purga en Supabase:', e);
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
    <ProductContext.Provider
      value={{
        products,
        loading,
        loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        purgeDemoProducts,
        toggleActive,
        toggleStorefront,
        updateStock,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts must be inside ProductProvider');
  return ctx;
};
