'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { Sale } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ShoppingCart, X, Calendar } from 'lucide-react';
import { formatCurrency, formatDateTime, todayISO, generateTicket, weekAgoISO, monthAgoISO } from '@/lib/utils';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: '💵 Efectivo', tarjeta: '💳 Tarjeta',
  transferencia: '📱 Transferencia', credito: '📒 Crédito', mixto: '🔀 Mixto',
};

export default function VentasPage() {
  const { profile, business, loading } = useAuth();
  const { sales, loadSales } = useSales();
  const router = useRouter();
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today');
  const [detail, setDetail] = useState<Sale | null>(null);

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) loadSales(); }, [profile]);

  const fromDate = period === 'today' ? todayISO() : period === 'week' ? weekAgoISO() : monthAgoISO();
  const filtered = sales.filter(s => s.created_at >= fromDate);
  const totalRevenue = filtered.reduce((s, v) => s + v.total, 0);

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 flex flex-col pb-20 lg:pb-0">
        <Header title="Historial de Ventas" />
        <main className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto w-full">

          {/* Period */}
          <div className="flex gap-2">
            {[['today','Hoy'],['week','Esta semana'],['month','Este mes']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v as typeof period)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${period === v ? 'bg-[#2563eb] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-black text-gray-900">{filtered.length}</p>
              <p className="text-xs text-gray-400 mt-1">Ventas realizadas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-black text-[#2563eb]">{formatCurrency(totalRevenue, business?.currency)}</p>
              <p className="text-xs text-gray-400 mt-1">Total ingresos</p>
            </div>
          </div>

          {/* Sales list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(s => (
                <button key={s.id} onClick={() => setDetail(s)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingCart size={18} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{generateTicket(s.id)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.created_at)}</p>
                      <p className="text-xs text-gray-400">{PAYMENT_LABELS[s.payment_method]} · {s.items.length} ítem(s)</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{formatCurrency(s.total, business?.currency)}</p>
                    {s.client_name && <p className="text-xs text-gray-400 mt-0.5">{s.client_name}</p>}
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Completada</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-300">
                  <Calendar size={48} className="mx-auto mb-3" />
                  <p className="text-sm">No hay ventas en este período</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Sale detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-black text-lg">{generateTicket(detail.id)}</p>
                <p className="text-white/60 text-xs">{formatDateTime(detail.created_at)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {detail.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">{item.product_name} x{item.quantity}</span>
                    <span className="font-semibold">{formatCurrency(item.subtotal, business?.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatCurrency(detail.subtotal, business?.currency)}</span></div>
                {detail.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Descuento</span><span>-{formatCurrency(detail.discount, business?.currency)}</span></div>}
                {detail.tax > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Impuesto</span><span>{formatCurrency(detail.tax, business?.currency)}</span></div>}
                <div className="flex justify-between font-black text-xl text-gray-900 pt-2 border-t"><span>Total</span><span>{formatCurrency(detail.total, business?.currency)}</span></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Pago</span><span className="font-semibold">{PAYMENT_LABELS[detail.payment_method]}</span></div>
                {detail.client_name && <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-semibold">{detail.client_name}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Cajero</span><span className="font-semibold">{detail.user_name}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
