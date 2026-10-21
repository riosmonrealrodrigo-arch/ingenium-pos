'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types';
import { useAuth } from './AuthContext';
import { DEMO_CLIENTS } from '@/lib/mockData';

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  loadClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'business_id' | 'created_at'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { business, isDemo } = useAuth();
  const [clients, setClients] = useState<Client[]>(DEMO_CLIENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo && typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_demo_clients');
      if (saved) {
        try {
          setClients(JSON.parse(saved));
        } catch {
          setClients(DEMO_CLIENTS);
        }
      } else {
        setClients(DEMO_CLIENTS);
      }
    }
  }, [isDemo]);

  const saveClientsToStorage = (newClients: Client[]) => {
    setClients(newClients);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_clients', JSON.stringify(newClients));
    }
  };

  const loadClients = useCallback(async () => {
    if (!business) return;
    if (isDemo) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('ingenium_demo_clients');
        if (saved) setClients(JSON.parse(saved));
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', business.id)
        .order('name');

      if (error || !data || data.length === 0) {
        setClients(DEMO_CLIENTS);
      } else {
        setClients(data);
      }
    } catch {
      setClients(DEMO_CLIENTS);
    } finally {
      setLoading(false);
    }
  }, [business, isDemo]);

  const addClient = async (data: Omit<Client, 'id' | 'business_id' | 'created_at'>): Promise<Client> => {
    if (!business) throw new Error('No business');

    const newClient: Client = {
      ...data,
      id: 'cli-' + Date.now(),
      business_id: business.id,
      created_at: new Date().toISOString(),
    };

    if (isDemo) {
      const updated = [newClient, ...clients];
      saveClientsToStorage(updated);
      return newClient;
    }

    try {
      const { data: client, error } = await supabase
        .from('clients')
        .insert({ ...data, business_id: business.id })
        .select()
        .single();
      if (error) throw error;
      await loadClients();
      return client;
    } catch {
      const updated = [newClient, ...clients];
      saveClientsToStorage(updated);
      return newClient;
    }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    if (isDemo) {
      const updated = clients.map(c => (c.id === id ? { ...c, ...data } : c));
      saveClientsToStorage(updated);
      return;
    }

    try {
      await supabase.from('clients').update(data).eq('id', id);
      await loadClients();
    } catch {
      const updated = clients.map(c => (c.id === id ? { ...c, ...data } : c));
      saveClientsToStorage(updated);
    }
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
