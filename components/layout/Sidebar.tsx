'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  ClipboardList, Users, BarChart2, Settings, LogOut, Store,
  MessageSquare, Globe, Wrench, Sparkles, Palette, Check, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStoreTheme, STORE_THEMES } from '@/context/StoreThemeContext';
import WelcomeScreen from '@/components/WelcomeScreen';
import StoreThemeModal from '@/components/store/StoreThemeModal';

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
  const { themeId } = useStoreTheme();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { count } = await supabase
          .from('chat_conversations')
          .select('*', { count: 'exact', head: true })
          .gt('unread_admin_count', 0);
        setUnreadCount(count || 0);
      } catch {}
    };

    fetchUnread();

    const onMessage = () => fetchUnread();
    window.addEventListener('ingenium_client_message_received', onMessage);
    return () => window.removeEventListener('ingenium_client_message_received', onMessage);
  }, []);

  const businessDisplayName = 'INGENIUM MOBILE';

  return (
    <>
      <aside className="hidden lg:flex flex-col w-52 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10 shrink-0">
          <img
            src="/images/logo.jpg"
            alt="INGENIUM MOBILE"
            className="w-7 h-7 rounded-full object-cover border border-white/30 shadow-md shrink-0"
          />
          <div className="min-w-0">
            <p className="font-black text-[11px] leading-tight text-white truncate">INGENIUM POS</p>
            <p className="text-[8.5px] text-amber-300 font-semibold truncate">Vende inteligente</p>
          </div>
        </div>

        <div className="px-2.5 py-1.5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Store size={11} className="text-[#f59e0b] shrink-0" />
            <span className="text-[10px] text-white/90 truncate font-bold">{businessDisplayName}</span>
          </div>
          <p className="text-[9px] text-white/40 mt-0.5 truncate capitalize">{profile?.name || 'Admin'} · {profile?.role || 'admin'}</p>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-all
                  ${active ? 'bg-[#2563eb] text-white font-semibold shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <div className="flex items-center gap-2 truncate">
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                {href === '/soporte' && unreadCount > 0 ? (
                  <span className="px-1.5 py-0.2 text-[9px] font-black bg-red-500 text-white rounded-full animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : badge ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                ) : null}
              </Link>
            );
          })}

          {/* Botón Selector de Temática Web */}
          <div className="pt-1.5">
            <button
              onClick={() => setThemeModalOpen(true)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10.5px] font-semibold text-purple-200 hover:text-white hover:bg-purple-500/20 border border-purple-400/30 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Palette size={13} className="text-purple-300 shrink-0" />
                <span className="truncate">Temas Web</span>
              </div>
              <span className="text-[10px]">{STORE_THEMES[themeId]?.emoji || '🎨'}</span>
            </button>
          </div>

          {/* Botón Guía de Inicio */}
          <div className="pt-0.5">
            <button
              onClick={() => setWelcomeOpen(true)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-semibold text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">Guía Rápida</span>
              </div>
              <span className="text-[8px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded">F1-F4</span>
            </button>
          </div>

          {/* Enlace directo a la Tienda Web Pública */}
          <div className="pt-1.5 mt-1.5 border-t border-white/10">
            <Link
              href="/tienda"
              target="_blank"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[10.5px] font-bold text-amber-300 hover:text-white hover:bg-amber-400/10 border border-amber-400/30 transition-all"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Globe size={13} className="shrink-0" />
                <span className="truncate">Tienda Web</span>
              </div>
              <span className="text-[8.5px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">En vivo</span>
            </Link>
          </div>
        </nav>

        <div className="px-2 pb-3 shrink-0">
          <button onClick={signOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[10.5px] text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer">
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Modal Selector de Temáticas Web */}
      <StoreThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Welcome Screen Modal */}
      <WelcomeScreen
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        forceShow={welcomeOpen}
      />
    </>
  );
}
