'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { useProducts } from '@/context/ProductContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, todayISO, weekAgoISO, monthAgoISO, formatDate } from '@/lib/utils';

export default function ReportesPage() {
  const { profile, business, loading } = useAuth();
  const { sales, loadSales } = useSales();
  const { products, loadProducts } = useProducts();
  const router = useRouter();
  const [period, setPeriod] = useState<'today'|'week'|'month'>('week');

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) { loadSales(); loadProducts(); } }, [profile]);

  const fromDate = period === 'today' ? todayISO() : period === 'week' ? weekAgoISO() : monthAgoISO();
  const filtered = useMemo(() => sales.filter(s => s.created_at >= fromDate && s.status === 'completed'), [sales, fromDate]);

  const totalRevenue = filtered.reduce((s, v) => s + v.total, 0);
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  // Daily revenue chart
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(s => {
      const day = s.created_at.split('T')[0];
      map[day] = (map[day] ?? 0) + s.total;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({
      date: formatDate(date + 'T00:00:00'), total,
    }));
  }, [filtered]);

  // Top products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(s => s.items.forEach(item => {
      if (!map[item.product_id]) map[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 };
      map[item.product_id].qty += item.quantity;
      map[item.product_id].revenue += item.subtotal;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filtered]);

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 flex flex-col pb-20 lg:pb-0">
        <Header title="Reportes" subtitle="Análisis de tu negocio" />
        <main className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto w-full">

          {/* Period */}
          <div className="flex gap-2">
            {[['today','Hoy'],['week','Semana'],['month','Mes']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v as typeof period)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${period === v ? 'bg-[#2563eb] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total ventas', value: String(filtered.length), color: 'text-gray-900' },
              { label: 'Ingresos', value: formatCurrency(totalRevenue, business?.currency), color: 'text-[#2563eb]' },
              { label: 'Ticket promedio', value: formatCurrency(avgTicket, business?.currency), color: 'text-green-600' },
              { label: 'Productos activos', value: String(products.filter(p => p.active).length), color: 'text-purple-600' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4">Ingresos por día</h2>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${business?.currency}${v}`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v, business?.currency), 'Ingresos']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos en este período</div>}
          </div>

          {/* Top products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4">Productos más vendidos</h2>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={120} />
                  <Tooltip formatter={(v: number) => [v, 'Unidades vendidas']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="qty" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Sin ventas en este período</div>}
          </div>

          {/* Top products table */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">Detalle por producto</h2></div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase">Unidades</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ingresos</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{p.qty}</td>
                      <td className="px-5 py-3 text-right font-bold text-[#2563eb]">{formatCurrency(p.revenue, business?.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
