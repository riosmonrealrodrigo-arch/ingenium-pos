'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { useSales } from '@/context/SalesContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ShoppingCart, Package, TrendingUp, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime, todayISO, isSameDay, generateTicket } from '@/lib/utils';

export default function DashboardPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts } = useProducts();
  const { sales, loadSales } = useSales();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!profile) router.replace('/login');
      else if (profile.role === 'cliente') router.replace('/tienda');
    }
  }, [profile, loading, router]);
  useEffect(() => { if (profile) { loadProducts(); loadSales(); } }, [profile]);

  const today = todayISO();
  const todaySales = sales.filter(s => isSameDay(s.created_at, today));
  const todayRevenue = todaySales.filter(s => s.status !== 'cancelled' && s.status !== 'refunded').reduce((s, v) => s + v.total, 0);
  const lowStock = products.filter(p => p.active && p.stock <= p.min_stock);
  const recentSales = sales.slice(0, 5);

  if (loading || !profile) return <Spinner />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Dashboard" subtitle={`Buenos días, ${profile.name.split(' ')[0]} 👋`} />
        <main className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto w-full">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat title="Ventas hoy" value={String(todaySales.length)} icon={<ShoppingCart size={20} />} color="blue" />
            <Stat title="Ingresos hoy" value={formatCurrency(todayRevenue, business?.currency)} icon={<TrendingUp size={20} />} color="green" />
            <Stat title="Productos" value={String(products.filter(p => p.active).length)} icon={<Package size={20} />} color="purple" />
            <Stat title="Stock bajo" value={String(lowStock.length)} icon={<AlertTriangle size={20} />} color="amber" alert={lowStock.length > 0} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Recent sales */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-base">Ventas recientes</h2>
                <Link href="/ventas" className="text-xs text-[#2563eb] flex items-center gap-1 hover:underline font-medium">Ver todas <ArrowRight size={12} /></Link>
              </div>
              {recentSales.length === 0
                ? <Empty text="No hay ventas aún" />
                : <div className="divide-y divide-gray-50">
                    {recentSales.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <ShoppingCart size={15} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{generateTicket(s.id)}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={10} />{formatDateTime(s.created_at)}</p>
                          </div>
                        </div>
                        <span className="font-black text-gray-800 text-sm">{formatCurrency(s.total, business?.currency)}</span>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Low stock */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-base">Stock bajo</h2>
                <Link href="/inventario" className="text-xs text-[#2563eb] flex items-center gap-1 hover:underline font-medium">Ver inventario <ArrowRight size={12} /></Link>
              </div>
              {lowStock.length === 0
                ? <Empty text="¡Todo el inventario está bien! ✅" />
                : <div className="divide-y divide-gray-50">
                    {lowStock.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">Mín: {p.min_stock} uds</p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                          {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Acciones rápidas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QA href="/pos" emoji="🛒" label="Nueva venta" color="bg-blue-500" />
              <QA href="/productos/nuevo" emoji="➕" label="Agregar producto" color="bg-purple-500" />
              <QA href="/clientes" emoji="👥" label="Ver clientes" color="bg-green-500" />
              <QA href="/reportes" emoji="📊" label="Reportes" color="bg-amber-500" />
            </div>
          </div>

        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function Stat({ title, value, icon, color, alert }: { title: string; value: string; icon: React.ReactNode; color: string; alert?: boolean }) {
  const cls: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-4 border ${alert ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cls[color]}`}>{icon}</div>
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{title}</p>
    </div>
  );
}

function QA({ href, emoji, label, color }: { href: string; emoji: string; label: string; color: string }) {
  return (
    <Link href={href} className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition active:scale-95`}>
      <span className="text-2xl">{emoji}</span>
      <span className="text-white text-xs font-bold text-center leading-tight">{label}</span>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-8 text-gray-400 text-sm">{text}</div>;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 bg-[#f59e0b] rounded-xl animate-pulse" />
    </div>
  );
}
