'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, CartItem, PaymentMethod } from '@/types';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';

interface SalesContextType {
  sales: Sale[];
  loading: boolean;
  loadSales: () => Promise<void>;
  createSale: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    clientId?: string,
    clientName?: string,
    cashGiven?: number
  ) => Promise<Sale>;
  cancelSale: (saleId: string, reason?: string, returnStock?: boolean) => Promise<void>;
  resetSalesAndAccounting: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | null>(null);

const DEFAULT_BUSINESS_ID = '0cb52988-c60c-4b2b-bdba-8cb103434d0d';
const DEFAULT_USER_ID = '73a0702c-cf7c-4bc8-a770-c7929f0ad062';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function SalesProvider({ children }: { children: ReactNode }) {
  const { business, profile } = useAuth();
  const { updateStock } = useProducts();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const saveSalesToStorage = (newSales: Sale[]) => {
    setSales(newSales);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_sales', JSON.stringify(newSales));
    }
  };

  // Carga reactiva de ventas desde Supabase
  const loadSales = useCallback(async () => {
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!error && data) {
        setSales(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_demo_sales', JSON.stringify(data));
        }
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_sales');
        if (saved) {
          try {
            setSales(JSON.parse(saved));
          } catch {
            setSales([]);
          }
        }
      }
    } catch (err) {
      console.warn('Error al cargar ventas desde Supabase:', err);
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_sales');
        if (saved) {
          try {
            setSales(JSON.parse(saved));
          } catch {}
        }
      }
    } finally {
      setLoading(false);
    }
  }, [business]);

  // Suscripción en tiempo real (Supabase Realtime) para sincronizar ventas entre múltiples dispositivos y ventanas
  useEffect(() => {
    loadSales();

    try {
      const channel = supabase
        .channel('realtime_sales_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          () => {
            loadSales();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime sales subscription error:', e);
    }
  }, [loadSales]);

  const createSale = async (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    clientId?: string,
    clientName?: string,
    cashGiven?: number
  ): Promise<Sale> => {
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
    const userId = profile?.id && profile.id !== 'demo-user-1' ? profile.id : DEFAULT_USER_ID;
    const userName = profile?.name || 'Rodrigo Ríos (Administrador)';
    const taxRate = business?.tax_rate ?? 16;

    const subtotal = items.reduce((s, i) => s + i.product.sale_price * i.quantity, 0);
    const discount = items.reduce((s, i) => s + i.discount * i.quantity, 0);
    const tax = ((subtotal - discount) * taxRate) / 100;
    const total = subtotal - discount + tax;

    const saleItems = items.map(i => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      unit_price: i.product.sale_price,
      discount: i.discount,
      subtotal: (i.product.sale_price - i.discount) * i.quantity,
    }));

    const saleId = generateUUID();

    const saleData: Sale = {
      id: saleId,
      business_id: bizId,
      user_id: userId,
      user_name: userName,
      client_id: clientId ?? null,
      client_name: clientName ?? 'Consumidor Final',
      items: saleItems,
      subtotal,
      discount,
      tax,
      total,
      payment_method: paymentMethod,
      cash_given: cashGiven ?? null,
      change: cashGiven ? cashGiven - total : null,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    try {
      const { data: sale, error } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (error) {
        console.warn('Error al insertar venta en Supabase:', error);
        throw error;
      }

      // Registrar movimientos de inventario y descontar stock
      for (const item of items) {
        try {
          await supabase.from('stock_movements').insert({
            business_id: bizId,
            product_id: item.product.id,
            product_name: item.product.name,
            type: 'venta',
            quantity: item.quantity,
            note: `Venta #${(sale || saleData).id.slice(-6).toUpperCase()}`,
          });
          await supabase.rpc('decrement_stock', { product_id: item.product.id, amount: item.quantity });
        } catch (mErr) {
          console.warn('Error actualizando stock Supabase:', mErr);
        }
        await updateStock(item.product.id, -item.quantity);
      }

      const finalSale = sale || saleData;
      const updatedSales = [finalSale, ...sales.filter(s => s.id !== finalSale.id)];
      saveSalesToStorage(updatedSales);
      return finalSale;
    } catch (insertErr) {
      console.warn('Fallback a guardado local por fallo de red:', insertErr);
      for (const item of items) {
        await updateStock(item.product.id, -item.quantity);
      }
      const updatedSales = [saleData, ...sales];
      saveSalesToStorage(updatedSales);
      return saleData;
    }
  };

  const cancelSale = async (saleId: string, reason: string = 'Devolución / Cancelación', returnStock: boolean = true) => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return;

    // Devolver existencias al inventario local
    if (returnStock && targetSale.status !== 'cancelled' && targetSale.status !== 'refunded') {
      for (const item of targetSale.items) {
        await updateStock(item.product_id, item.quantity);
      }
    }

    const updatedSale: Sale = {
      ...targetSale,
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      returned_to_stock: returnStock,
    };

    const newSales = sales.map(s => (s.id === saleId ? updatedSale : s));
    saveSalesToStorage(newSales);

    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
    try {
      await supabase
        .from('sales')
        .update({
          status: 'cancelled',
        })
        .eq('id', saleId);

      if (returnStock) {
        for (const item of targetSale.items) {
          try {
            await supabase.from('stock_movements').insert({
              business_id: bizId,
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'entrada',
              quantity: item.quantity,
              note: `Devolución / Cancelación Venta #${saleId.slice(-6).toUpperCase()}: ${reason}`,
            });
            await supabase.rpc('decrement_stock', { product_id: item.product_id, amount: -item.quantity });
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Error al sincronizar cancelación en Supabase:', err);
    }
  };

  const resetSalesAndAccounting = async () => {
    setSales([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_demo_sales');
      localStorage.setItem('ingenium_demo_sales', JSON.stringify([]));
    }
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : DEFAULT_BUSINESS_ID;
    try {
      await supabase.from('sales').delete().eq('business_id', bizId);
    } catch (err) {
      console.warn('Error al vaciar ventas en Supabase:', err);
    }
  };

  return (
    <SalesContext.Provider value={{ sales, loading, loadSales, createSale, cancelSale, resetSalesAndAccounting }}>
      {children}
    </SalesContext.Provider>
  );
}

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be inside SalesProvider');
  return ctx;
};
