'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, Palette, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStoreTheme } from '@/context/StoreThemeContext';
import StoreThemeModal from '@/components/store/StoreThemeModal';
import Image from 'next/image';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { profile, business } = useAuth();
  const { currentTheme } = useStoreTheme();
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-3.5 lg:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="min-w-0 pr-2">
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[10.5px] sm:text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {actions}

          {/* Botón Acceso Rápido a Temas Web (Visible en Celular y PC) */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 text-xs font-bold transition shadow-xs cursor-pointer"
            title="Cambiar temática de la tienda web (Halloween, Navidad, Buen Fin, etc.)"
          >
            <Palette size={14} className="text-purple-600 shrink-0" />
            <span className="text-xs">{currentTheme?.emoji || '🎨'}</span>
            <span className="hidden sm:inline">Temas Web</span>
          </button>

          {/* Enlace directo a Tienda Web */}
          <Link
            href="/tienda"
            target="_blank"
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition flex items-center gap-1 text-xs font-bold"
            title="Ver Tienda Web en vivo"
          >
            <Globe size={15} className="shrink-0" />
            <span className="hidden md:inline">Ver Tienda</span>
          </Link>

          <button className="p-1.5 rounded-full hover:bg-gray-100 transition relative text-gray-500 hover:text-gray-700">
            <Bell size={16} />
          </button>

          <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-gray-100">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.name} width={28} height={28} className="rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-xs font-black shadow-xs">
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{profile?.name}</p>
              <p className="text-[9.5px] text-gray-400 leading-tight capitalize">{profile?.role} · {business?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Temas Web accesible desde cualquier pantalla en celular */}
      <StoreThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </>
  );
}
