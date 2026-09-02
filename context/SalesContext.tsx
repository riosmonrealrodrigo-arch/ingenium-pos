'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, CartItem, PaymentMethod } from '@/types';
import { useAuth } from './AuthContext';

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
}

const SalesContext = createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: ReactNode }) {
  const { business, profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSales = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase
      .from('sales')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setSales(data ?? []);
    setLoading(false);
  }, [business]);

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

    const saleData = {
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
    };

    const { data: sale, error } = await supabase.from('sales').insert(saleData).select().single();
    if (error) throw error;

    // Register stock movements
    for (const item of items) {
      await supabase.from('stock_movements').insert({
        business_id: business.id,
        product_id: item.product.id,
        product_name: item.product.name,
        type: 'venta',
        quantity: item.quantity,
        note: `Venta #${sale.id.slice(-6).toUpperCase()}`,
      });
      // Decrease stock
      await supabase.rpc('decrement_stock', { product_id: item.product.id, amount: item.quantity });
    }

    await loadSales();
    return sale;
  };

  return (
    <SalesContext.Provider value={{ sales, loading, loadSales, createSale }}>
      {children}
    </SalesContext.Provider>
  );
}

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be inside SalesProvider');
  return ctx;
};
