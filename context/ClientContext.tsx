'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { useAuth } from './AuthContext';

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  loadClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'business_id' | 'created_at'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { business } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const loadClients = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', business.id)
      .order('name');
    setClients(data ?? []);
    setLoading(false);
  }, [business]);

  const addClient = async (data: Omit<Client, 'id' | 'business_id' | 'created_at'>): Promise<Client> => {
    if (!business) throw new Error('No business');
    const { data: client, error } = await supabase
      .from('clients')
      .insert({ ...data, business_id: business.id })
      .select()
      .single();
    if (error) throw error;
    await loadClients();
    return client;
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    await supabase.from('clients').update(data).eq('id', id);
    await loadClients();
  };

  return (
    <ClientContext.Provider value={{ clients, loading, loadClients, addClient, updateClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export const useClients = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClients must be inside ClientProvider');
  return ctx;
};
