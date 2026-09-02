'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) router.replace(profile ? '/dashboard' : '/login');
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e3a5f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-[#f59e0b] rounded-2xl flex items-center justify-center font-black text-[#1e3a5f] text-4xl animate-pulse shadow-2xl">I</div>
        <p className="text-white/70 text-sm tracking-wide">Cargando Ingenium POS...</p>
      </div>
    </div>
  );
}
