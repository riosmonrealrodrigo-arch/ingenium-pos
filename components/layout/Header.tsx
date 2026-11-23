'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Palette, Globe, Megaphone, ArrowUpDown, ChevronDown, Store, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStoreTheme } from '@/context/StoreThemeContext';
import StoreThemeModal from '@/components/store/StoreThemeModal';
import StoreAdsManagerModal from '@/components/store/StoreAdsManagerModal';
import CatalogOrderModal from '@/components/store/CatalogOrderModal';
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
  const [adsModalOpen, setAdsModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-3.5 lg:px-5 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="min-w-0 pr-2">
          <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[10.5px] sm:text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {actions}

          {/* Menú Desplegable de Gestión de Tienda Web (Temas, Anuncios, Acomodar Productos) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200/80 text-xs font-bold text-[#1e3a5f] transition shadow-xs cursor-pointer active:scale-95"
              title="Administrar Tienda Web (Temas, Anuncios, Acomodar Productos)"
            >
              <Store size={14} className="text-purple-600 shrink-0" />
              <span className="hidden sm:inline">Tienda Web</span>
              <span className="text-xs">{currentTheme?.emoji || '🎨'}</span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 animate-fade-in divide-y divide-gray-100">
                <div className="px-3.5 py-2.5 bg-gradient-to-r from-purple-50/70 to-blue-50/70">
                  <p className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <Sparkles size={11} /> Control de Tienda Web
                  </p>
                  <p className="text-[10.5px] text-gray-600 mt-0.5 font-medium truncate">
                    Tema: <strong className="text-purple-900">{currentTheme?.name}</strong>
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setThemeModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Palette size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">🎨 Temas Web</p>
                      <p className="text-[10px] text-gray-400">12 temas visuales de tienda</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setAdsModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Megaphone size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">📢 Anuncios & Banners</p>
                      <p className="text-[10px] text-gray-400">Crear ofertas, subir fotos y activar</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setOrderModalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <ArrowUpDown size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">↕️ Acomodar Tienda</p>
                      <p className="text-[10px] text-gray-400">Ordenar artículos donde quieras</p>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <Link
                    href="/tienda"
                    target="_blank"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Globe size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="leading-tight flex items-center justify-between">
                        <span>Ver Tienda en Vivo</span>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-black px-1.5 py-0.5 rounded">Abrir ↗</span>
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

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

      {/* Modales de Gestión de la Tienda Web accesibles desde cualquier pantalla en el POS */}
      <StoreThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
      <StoreAdsManagerModal
        isOpen={adsModalOpen}
        onClose={() => setAdsModalOpen(false)}
      />
      <CatalogOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </>
  );
}
