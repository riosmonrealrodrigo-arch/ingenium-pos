'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Wrench, MessageSquare, ClipboardList, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const items = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/pos', label: 'Vender', icon: ShoppingCart },
  { href: '/reparaciones', label: 'Taller', icon: Wrench },
  { href: '/soporte', label: 'Mensajes', icon: MessageSquare, isChat: true },
  { href: '/ventas', label: 'Ventas', icon: ClipboardList },
  { href: '/configuracion', label: 'Ajustes', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
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

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom shadow-lg">
      <div className="flex">
        {items.map(({ href, label, icon: Icon, isChat }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[9.5px] transition-colors relative ${
                active ? 'text-[#2563eb]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                {isChat && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-black px-1 py-0.2 rounded-full min-w-[14px] text-center shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={active ? 'font-bold' : 'font-medium'}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
