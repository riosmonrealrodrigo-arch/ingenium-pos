'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Business, Profile } from '@/types';

interface AuthContextType {
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, businessName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndBusiness = async (userId: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (prof) {
      setProfile(prof);
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', prof.business_id)
        .single();
      if (biz) setBusiness(biz);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await loadProfileAndBusiness(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfileAndBusiness(session.user.id);
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, name: string, businessName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'No se pudo crear el usuario' };

    // Create business
    const { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .insert({ name: businessName, currency: 'Q', tax_rate: 12, owner_id: data.user.id })
      .select()
      .single();
    if (bizErr) return { error: bizErr.message };

    // Create profile
    const { error: profErr } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, business_id: biz.id, name, email, role: 'admin', active: true });
    if (profErr) return { error: profErr.message };

    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider value={{ profile, business, loading, signInWithGoogle, signInWithEmail, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
