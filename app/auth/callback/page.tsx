'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StorefrontCustomer } from '@/types';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Check if there is an error in the callback URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error') || params.get('error_description');
      if (error) {
        console.warn('Auth error received:', error);
        const target = sessionStorage.getItem('ingenium_auth_target');
        if (target === 'client') {
          router.replace('/tienda');
        } else {
          router.replace('/login');
        }
        return;
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      const email = session.user.email?.toLowerCase();
      const isAdminAccount = email === 'robertanr564@gmail.com';
      const target = typeof window !== 'undefined' ? sessionStorage.getItem('ingenium_auth_target') : null;

      if (target === 'client' || !isAdminAccount) {
        // Acceso exclusivo de Cliente desde la tienda en línea (o cualquier usuario que NO sea el admin oficial)
        const cust: StorefrontCustomer = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || email?.split('@')[0] || 'Cliente',
          phone: session.user.user_metadata?.phone || '',
          email: session.user.email || '',
        };
        localStorage.setItem('ingenium_store_customer', JSON.stringify(cust));

        // Aseguramos en la base de datos que su rol quede como 'cliente'
        try {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            name: cust.name,
            email: session.user.email,
            role: 'cliente',
            active: true,
          }, { onConflict: 'id' });
        } catch {}

        router.replace('/tienda');
      } else {
        // Acceso exclusivo del Propietario / Administrador Oficial (robertanr564@gmail.com)
        try {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!prof) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              business_id: '0cb52988-c60c-4b2b-bdba-8cb103434d0d',
              name: session.user.user_metadata?.full_name || 'Rodrigo Ríos (Administrador)',
              email: session.user.email,
              role: 'admin',
              active: true,
            });
          }
        } catch {}
        router.replace('/pos');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1b2a] text-white gap-4">
      <img
        src="/images/logo.jpg"
        alt="INGENIUM MOBILE"
        className="w-16 h-16 rounded-full object-cover border-2 border-white/30 animate-pulse shadow-2xl"
      />
      <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
        <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
        <span>Verificando credenciales de acceso con Google...</span>
      </div>
    </div>
  );
}
