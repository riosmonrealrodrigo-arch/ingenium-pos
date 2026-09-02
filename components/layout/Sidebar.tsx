'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse,
  ClipboardList, Users, BarChart2, Settings, LogOut, Store
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/inventario', label: 'Inventario', icon: Warehouse },
  { href: '/ventas', label: 'Ventas', icon: ClipboardList },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { business, profile, signOut } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#1e3a5f] text-white h-screen fixed left-0 top-0 z-40 shadow-2xl">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 bg-[#f59e0b] rounded-xl flex items-center justify-center font-black text-[#1e3a5f] text-xl shadow-lg">I</div>
        <div>
          <p className="font-black text-sm leading-tight">INGENIUM POS</p>
          <p className="text-[10px] text-white/50">Vende inteligente</p>
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
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${active ? 'bg-[#2563eb] text-white font-semibold shadow-lg shadow-blue-900/30' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5">
        <button onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
