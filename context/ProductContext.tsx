'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { useAuth } from './AuthContext';
import { DEMO_PRODUCTS } from '@/lib/mockData';
import { normalizeCategoryId, DEFAULT_DB_CATEGORIES } from '@/lib/categories';

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

const DEFAULT_BUSINESS_ID = '0cb52988-c60c-4b2b-bdba-8cb103434d0d';

export function ProductProvider({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const saveProductsToStorage = (newProducts: Product[]) => {
    setProducts(newProducts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_products', JSON.stringify(newProducts));
    }
  };

  // Carga reactiva desde Supabase
  const loadProducts = useCallback(async () => {
    setLoading(true);

    try {
      // Asegurar que las categorías por defecto existen en Supabase
      const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
      try {
        await supabase.from('categories').upsert(
          DEFAULT_DB_CATEGORIES.map(c => ({ ...c, business_id: bizId })),
          { onConflict: 'id' }
        );
      } catch (catErr) {
        console.warn('Categorías en Supabase:', catErr);
      }

      // Consulta a la tabla products de Supabase
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setProducts(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_demo_products', JSON.stringify(data));
        }
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_products');
        if (saved) {
          setProducts(JSON.parse(saved));
        }
      }
    } catch {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_products');
        if (saved) setProducts(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  // Suscripción Supabase Realtime para sincronizar POS y Tienda Web en vivo
  useEffect(() => {
    loadProducts();

    try {
      const channel = supabase
        .channel('realtime_products_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
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
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
    const catId = normalizeCategoryId(data.category_id);

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
          category_id: catId,
          purchase_price: data.purchase_price,
          sale_price: data.sale_price,
          stock: data.stock,
          min_stock: data.min_stock,
          active: data.active,
          business_id: bizId,
        })
        .select()
        .single();

      if (!error && inserted) {
        const updated = [inserted, ...products.filter(p => p.id !== inserted.id)];
        saveProductsToStorage(updated);
        return;
      }

      if (error) {
        console.error('Error al insertar producto en Supabase:', error);
        throw new Error(error.message || 'Error al guardar producto en base de datos');
      }
    } catch (e) {
      console.error('Error al insertar en Supabase:', e);
      throw e;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const payload: any = { ...data };
    if ('category_id' in payload) {
      payload.category_id = normalizeCategoryId(payload.category_id);
    }

    // Actualización optimista local
    const updated = products.map(p =>
      p.id === id ? { ...p, ...data, ...(payload.category_id !== undefined ? { category_id: payload.category_id } : {}) } : p
    );
    saveProductsToStorage(updated);

    try {
      const { data: updatedRows, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error && updatedRows && updatedRows.length > 0) {
        const finalProducts = products.map(p => (p.id === id ? updatedRows[0] : p));
        saveProductsToStorage(finalProducts);
        return;
      }

      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        throw new Error(error.message || 'Error de base de datos al actualizar');
      }
    } catch (e) {
      console.error('Error al actualizar producto en Supabase:', e);
      throw e;
    }
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter(p => p.id !== id);
    saveProductsToStorage(updated);

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar en Supabase:', error);
      }
    } catch (e) {
      console.warn('Error al eliminar producto en Supabase:', e);
    }
  };

  const purgeDemoProducts = async () => {
    try {
      // 1. Borrar de la base de datos de Supabase los productos con códigos de prueba
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos los productos existentes

      if (error) {
        console.warn('Aviso al purgar en Supabase:', error);
      }

      // 2. Limpiar estado en memoria y LocalStorage
      setProducts([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ingenium_demo_products');
      }
    } catch (e) {
      console.error('Error general al purgar catálogo:', e);
      setProducts([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ingenium_demo_products');
      }
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
