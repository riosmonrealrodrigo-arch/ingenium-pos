'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  ClipboardList, Users, BarChart2, Settings, LogOut, Store,
  MessageSquare, Globe, Wrench, Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <img
            src="/images/logo.jpg"
            alt="INGENIUM MOBILE"
            className="w-10 h-10 rounded-full object-cover border border-white/30 shadow-lg"
          />
          <div>
            <p className="font-black text-sm leading-tight text-white">INGENIUM POS</p>
            <p className="text-[10px] text-amber-300 font-semibold">Vende inteligente</p>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Store size={13} className="text-[#f59e0b] shrink-0" />
            <span className="text-xs text-white/80 truncate font-medium">{business?.name}</span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5 pl-5 capitalize">{profile?.name} · {profile?.role}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                  ${active ? 'bg-[#2563eb] text-white font-semibold shadow-lg shadow-blue-900/30' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  {label}
                </div>
                {badge && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </Link>
            );
          })}

          {/* Botón Guía de Inicio / Bienvenida */}
          <div className="pt-2">
            <button
              onClick={() => setWelcomeOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" />
                <span>Guía de Inicio Rápido</span>
              </div>
              <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded">F1-F4</span>
            </button>
          </div>

          {/* Enlace directo a la Tienda Web Pública */}
          <div className="pt-2 mt-2 border-t border-white/10">
            <Link
              href="/tienda"
              target="_blank"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-400/10 border border-amber-400/30 transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span>Ver Tienda Web</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">En vivo</span>
            </Link>
          </div>
        </nav>

        <div className="px-3 pb-5">
          <button onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Welcome Screen Modal */}
      <WelcomeScreen
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
        forceShow={welcomeOpen}
      />
    </>
  );
}
