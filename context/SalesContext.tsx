'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, CartItem, PaymentMethod } from '@/types';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { DEMO_SALES } from '@/lib/mockData';

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

export function SalesProvider({ children }: { children: ReactNode }) {
  const { business, profile, isDemo } = useAuth();
  const { updateStock } = useProducts();
  const [sales, setSales] = useState<Sale[]>(DEMO_SALES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo && typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_demo_sales');
      if (saved) {
        try {
          setSales(JSON.parse(saved));
        } catch {
          setSales(DEMO_SALES);
        }
      } else {
        setSales(DEMO_SALES);
      }
    }
  }, [isDemo]);

  const saveSalesToStorage = (newSales: Sale[]) => {
    setSales(newSales);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_sales', JSON.stringify(newSales));
    }
  };

  const loadSales = useCallback(async () => {
    if (!business) return;
    if (isDemo) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_sales');
        if (saved) setSales(JSON.parse(saved));
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data || data.length === 0) {
        setSales(DEMO_SALES);
      } else {
        setSales(data);
      }
    } catch {
      setSales(DEMO_SALES);
    } finally {
      setLoading(false);
    }
  }, [business, isDemo]);

  const createSale = async (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    clientId?: string,
    clientName?: string,
    cashGiven?: number
  ): Promise<Sale> => {
    if (!business || !profile) throw new Error('Not authenticated');

    const subtotal = items.reduce((s, i) => s + i.product.sale_price * i.quantity, 0);
    const discount = items.reduce((s, i) => s + i.discount * i.quantity, 0);
    const tax = ((subtotal - discount) * (business.tax_rate ?? 0)) / 100;
    const total = subtotal - discount + tax;

    const saleItems = items.map(i => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      unit_price: i.product.sale_price,
      discount: i.discount,
      subtotal: (i.product.sale_price - i.discount) * i.quantity,
    }));

    const saleId = 'sale-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const saleData: Sale = {
      id: saleId,
      business_id: business.id,
      user_id: profile.id,
      user_name: profile.name,
      client_id: clientId ?? null,
      client_name: clientName ?? null,
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

    if (isDemo) {
      // In demo mode, decrease stock in local context
      for (const item of items) {
        await updateStock(item.product.id, -item.quantity);
      }
      const updatedSales = [saleData, ...sales];
      saveSalesToStorage(updatedSales);
      return saleData;
    }

    try {
      const { data: sale, error } = await supabase.from('sales').insert(saleData).select().single();
      if (error) throw error;

      for (const item of items) {
        await supabase.from('stock_movements').insert({
          business_id: business.id,
          product_id: item.product.id,
          product_name: item.product.name,
          type: 'venta',
          quantity: item.quantity,
          note: `Venta #${sale.id.slice(-6).toUpperCase()}`,
        });
        await supabase.rpc('decrement_stock', { product_id: item.product.id, amount: item.quantity });
      }

      await loadSales();
      return sale;
    } catch {
      // Fallback to local sale
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

    // Return stock if requested
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

    const newSales = sales.map(s => s.id === saleId ? updatedSale : s);
    saveSalesToStorage(newSales);

    if (!isDemo && business) {
      try {
        await supabase
          .from('sales')
          .update({
            status: 'cancelled',
            cancellation_reason: reason,
          })
          .eq('id', saleId);

        if (returnStock) {
          for (const item of targetSale.items) {
            await supabase.from('stock_movements').insert({
              business_id: business.id,
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'entrada',
              quantity: item.quantity,
              note: `Devolución / Cancelación Venta #${saleId.slice(-6).toUpperCase()}: ${reason}`,
            });
            await supabase.rpc('increment_stock', { product_id: item.product_id, amount: item.quantity });
          }
        }
      } catch (err) {
        console.warn('Error syncing cancelled sale to Supabase:', err);
      }
    }
  };

  const resetSalesAndAccounting = async () => {
    setSales([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_demo_sales');
      localStorage.setItem('ingenium_demo_sales', JSON.stringify([]));
    }
    if (!isDemo && business) {
      try {
        await supabase.from('sales').delete().eq('business_id', business.id);
      } catch (err) {
        console.warn('Error clearing sales in Supabase:', err);
      }
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
