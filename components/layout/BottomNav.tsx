'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Wrench, Package, ClipboardList } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/pos', label: 'Vender', icon: ShoppingCart },
  { href: '/reparaciones', label: 'Taller', icon: Wrench },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/ventas', label: 'Ventas', icon: ClipboardList },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom shadow-lg">
      <div className="flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${active ? 'text-[#2563eb]' : 'text-gray-400'}`}>
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className={active ? 'font-bold' : 'font-medium'}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
