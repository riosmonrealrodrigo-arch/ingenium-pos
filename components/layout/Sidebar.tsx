'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  ClipboardList, Users, BarChart2, Settings, LogOut, Store,
  MessageSquare, Globe, Wrench, Sparkles, Palette, Check, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStoreTheme, STORE_THEMES, StoreThemeId } from '@/context/StoreThemeContext';
import WelcomeScreen from '@/components/WelcomeScreen';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: '/reparaciones', label: 'Taller / Reparaciones', icon: Wrench },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/inventario', label: 'Inventario', icon: Warehouse },
  { href: '/ventas', label: 'Ventas', icon: ClipboardList },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/soporte', label: 'Mensajes / Soporte', icon: MessageSquare, badge: true },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { business, profile, signOut } = useAuth();
  const { themeId, setTheme } = useStoreTheme();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [themeSuccess, setThemeSuccess] = useState('');

  const handleSelectTheme = async (id: StoreThemeId) => {
    await setTheme(id);
    setThemeSuccess(`¡Tema "${STORE_THEMES[id].name}" activado en la tienda web!`);
    setTimeout(() => setThemeSuccess(''), 3000);
  };

  const businessDisplayName = 'INGENIUM MOBILE';

  return (
    <>
      <aside className="hidden lg:flex flex-col w-52 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-2.5 px-3.5 py-4 border-b border-white/10">
          <img
            src="/images/logo.jpg"
            alt="INGENIUM MOBILE"
            className="w-8 h-8 rounded-full object-cover border border-white/30 shadow-md shrink-0"
          />
          <div className="min-w-0">
            <p className="font-black text-xs leading-tight text-white truncate">INGENIUM POS</p>
            <p className="text-[9px] text-amber-300 font-semibold truncate">Vende inteligente</p>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Store size={12} className="text-[#f59e0b] shrink-0" />
            <span className="text-[11px] text-white/90 truncate font-bold">{businessDisplayName}</span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5 truncate capitalize">{profile?.name || 'Admin'} · {profile?.role || 'admin'}</p>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all
                  ${active ? 'bg-[#2563eb] text-white font-semibold shadow-md shadow-blue-900/30' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <div className="flex items-center gap-2.5 truncate">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                {badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                )}
              </Link>
            );
          })}

          {/* Botón Selector de Temática Web */}
          <div className="pt-2">
            <button
              onClick={() => setThemeModalOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:text-white hover:bg-purple-500/20 border border-purple-400/30 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Palette size={15} className="text-purple-300 shrink-0" />
                <span className="truncate">Temas Web</span>
              </div>
              <span className="text-[11px]">{STORE_THEMES[themeId]?.emoji || '🎨'}</span>
            </button>
          </div>

          {/* Botón Guía de Inicio */}
          <div className="pt-1">
            <button
              onClick={() => setWelcomeOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span className="truncate">Guía Rápida</span>
              </div>
              <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded">F1-F4</span>
            </button>
          </div>

          {/* Enlace directo a la Tienda Web Pública */}
          <div className="pt-2 mt-2 border-t border-white/10">
            <Link
              href="/tienda"
              target="_blank"
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-400/10 border border-amber-400/30 transition-all"
            >
              <div className="flex items-center gap-2 truncate">
                <Globe size={15} className="shrink-0" />
                <span className="truncate">Tienda Web</span>
              </div>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">En vivo</span>
            </Link>
          </div>
        </nav>

        <div className="px-2.5 pb-4">
          <button onClick={signOut}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Modal Selector de Temáticas Web */}
      {themeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Temáticas de la Tienda Web</h3>
                  <p className="text-xs text-gray-500">Elige la ambientación festiva para el catálogo público</p>
                </div>
              </div>
              <button
                onClick={() => setThemeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {themeSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check size={16} /> {themeSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[60vh] overflow-y-auto p-1">
              {Object.values(STORE_THEMES).map(t => {
                const isSelected = themeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-600/20'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{t.emoji}</span>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full">
                          <Check size={10} /> ACTIVO
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold">Clic para activar</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{t.name}</h4>
                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{t.headline}</p>
                    </div>
                    {/* Visual color preview strip */}
                    <div className="h-3 rounded-full mt-2.5 shadow-xs border border-black/10" style={{ background: t.cssGradient }} />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Los cambios se ven al instante en la tienda en línea.</span>
              <button
                onClick={() => setThemeModalOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Screen Modal */}
      <WelcomeScreen
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        forceShow={welcomeOpen}
      />
    </>
  );
}
