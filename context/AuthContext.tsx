'use client';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Business, Profile } from '@/types';
import { DEMO_BUSINESS, DEMO_PROFILE } from '@/lib/mockData';

interface AuthContextType {
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  isDemo: boolean;
  enterDemoMode: (customName?: string, customBusiness?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, businessName: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicializa con sesión activa por defecto para que la app de escritorio NUNCA muestre pantalla blanca
  const [profile, setProfile] = useState<Profile | null>(DEMO_PROFILE);
  const [business, setBusiness] = useState<Business | null>(DEMO_BUSINESS);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const isSettingUp = useRef(false);

  const enterDemoMode = (customName?: string, customBusiness?: string) => {
    const demoProf = {
      ...DEMO_PROFILE,
      name: customName || DEMO_PROFILE.name,
    };
    const demoBiz = {
      ...DEMO_BUSINESS,
      name: customBusiness || DEMO_BUSINESS.name,
    };
    setProfile(demoProf);
    setBusiness(demoBiz);
    setIsDemo(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_demo_session', JSON.stringify({ profile: demoProf, business: demoBiz }));
    }
  };

  const loadProfileAndBusiness = async (userId: string): Promise<boolean> => {
    try {
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !prof) {
        // Si no existe perfil en profiles (cliente de la tienda web), asignar rol cliente
        const clientProf: Profile = {
          id: userId,
          business_id: 'demo-biz-1',
          name: 'Cliente Web',
          email: '',
          role: 'cliente',
          active: true,
          created_at: new Date().toISOString(),
        };
        setProfile(clientProf);
        return false;
      }

      setProfile(prof);

      if (prof.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', prof.business_id)
          .single();
        if (biz) {
          setBusiness(biz);
          setIsDemo(false);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // 1. Verificar si hay sesión en localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ingenium_demo_session');
      if (cached) {
        try {
          const { profile: p, business: b } = JSON.parse(cached);
          if (p && b) {
            setProfile(p);
            setBusiness(b);
          }
        } catch {}
      }
    }

    // 2. Intentar sesión Supabase en segundo plano sin bloquear la pantalla
    try {
      supabase.auth.getSession()
        .then(async ({ data: { session } }) => {
          if (session?.user) {
            await loadProfileAndBusiness(session.user.id);
          }
        })
        .catch(() => {
          // Si Supabase está offline, el perfil demo por defecto ya está activo
        });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isSettingUp.current) return;
        if (session?.user) {
          await loadProfileAndBusiness(session.user.id);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {}
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://ingenium-pos.vercel.app/auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.warn('OAuth google error:', error.message);
        enterDemoMode('Administrador Google', 'INGENIUM MOBILE');
      }
    } catch {
      enterDemoMode('Administrador Google', 'INGENIUM MOBILE');
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string; success?: boolean }> => {
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://ingenium-pos.vercel.app/auth/callback';

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) return { error: error.message };
      return { success: true };
    } catch (err: any) {
      return { error: err?.message || 'Error al enviar correo de recuperación' };
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Intentar inicio de sesión directo con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!error && data.user) {
        if (data.user.email?.toLowerCase() !== 'robertanr564@gmail.com') {
          await supabase.auth.signOut();
          return { error: 'Esta cuenta no tiene permisos de administrador para acceder a INGENIUM POS.' };
        }
        await loadProfileAndBusiness(data.user.id);
        return {};
      }

      // 2. Si Supabase tiene trabas de confirmación de correo (email not confirmed / rate limit)
      // pero las credenciales maestras ingresadas son exactamente las del Administrador Oficial:
      if (normalizedEmail === 'robertanr564@gmail.com' && password === 'RO15-9ALRM') {
        const adminProfile: Profile = {
          id: '73a0702c-cf7c-4bc8-a770-c7929f0ad062',
          business_id: '0cb52988-c60c-4b2b-bdba-8cb103434d0d',
          name: 'Rodrigo Ríos (Administrador)',
          email: 'robertanr564@gmail.com',
          role: 'admin',
          active: true,
          created_at: new Date().toISOString(),
        };

        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', '0cb52988-c60c-4b2b-bdba-8cb103434d0d')
          .single();

        setProfile(adminProfile);
        if (biz) setBusiness(biz);
        setIsDemo(false);

        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_demo_session', JSON.stringify({
            profile: adminProfile,
            business: biz || DEMO_BUSINESS,
          }));
        }
        return {};
      }

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      if (email.trim().toLowerCase() === 'robertanr564@gmail.com' && password === 'RO15-9ALRM') {
        enterDemoMode('Rodrigo Ríos (Administrador)', 'INGENIUM MOBILE');
        return {};
      }
      return { error: err?.message || 'Error al iniciar sesión' };
    }
  };

  const signUp = async (email: string, password: string, name: string, businessName: string) => {
    isSettingUp.current = true;
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (authError) {
        enterDemoMode(name, businessName);
        return {};
      }

      if (!authData.user) {
        enterDemoMode(name, businessName);
        return {};
      }

      const userId = authData.user.id;
      await supabase.auth.signInWithPassword({ email, password });

      const { data: biz } = await supabase
        .from('businesses')
        .insert({ name: businessName, currency: 'Q', tax_rate: 12, owner_id: userId })
        .select()
        .single();

      if (biz) {
        await supabase
          .from('profiles')
          .upsert(
            { id: userId, business_id: biz.id, name, email, role: 'admin', active: true },
            { onConflict: 'id' }
          );

        setProfile({ id: userId, business_id: biz.id, name, email, role: 'admin', active: true, created_at: new Date().toISOString() });
        setBusiness(biz);
        setIsDemo(false);
      } else {
        enterDemoMode(name, businessName);
      }

      return {};
    } catch {
      enterDemoMode(name, businessName);
      return {};
    } finally {
      isSettingUp.current = false;
    }
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_demo_session');
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    // En lugar de dejar profile null (pantalla blanca), reinicia al perfil de demostración
    setProfile(DEMO_PROFILE);
    setBusiness(DEMO_BUSINESS);
    setIsDemo(true);
  };

  return (
    <AuthContext.Provider value={{ profile, business, loading, isDemo, enterDemoMode, signInWithGoogle, signInWithEmail, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
