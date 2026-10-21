'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/login');
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
        <span>Autenticando acceso con Google...</span>
      </div>
    </div>
  );
}
