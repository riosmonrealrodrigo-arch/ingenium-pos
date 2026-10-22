'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { supabase } from '@/lib/supabase';
import { StockMovement } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Package, AlertTriangle, TrendingDown, Plus, Minus, X, Check } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function InventarioPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts, updateStock } = useProducts();
  const router = useRouter();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [adjustModal, setAdjustModal] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [adjustType, setAdjustType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) { loadProducts(); loadMovements(); } }, [profile]);

  const loadMovements = async () => {
    if (!business) return;
    const { data } = await supabase.from('stock_movements').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(50);
    setMovements(data ?? []);
  };

  const handleAdjust = async () => {
    if (!adjustModal || !adjustQty || !business || !profile) return;
    setSaving(true);
    const qty = parseInt(adjustQty);
    const delta = adjustType === 'entrada' ? qty : adjustType === 'salida' ? -qty : qty - adjustModal.stock;
    await updateStock(adjustModal.id, delta);
    await supabase.from('stock_movements').insert({
      business_id: business.id, product_id: adjustModal.id, product_name: adjustModal.name,
      type: adjustType, quantity: Math.abs(qty), note: adjustNote || undefined,
    });
    await loadMovements();
    setAdjustModal(null); setAdjustQty(''); setAdjustNote('');
    setSaving(false);
  };

  const outOfStock = products.filter(p => p.active && p.stock === 0);
  const lowStock = products.filter(p => p.active && p.stock > 0 && p.stock <= p.min_stock);

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Inventario" subtitle="Control de stock en tiempo real" />
        <main className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-7xl mx-auto w-full">

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{products.filter(p => p.active).length}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1"><Package size={12} /> Total productos</p>
            </div>
            <div className={`bg-white rounded-2xl border shadow-sm p-4 text-center ${lowStock.length > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'}`}>
              <p className="text-3xl font-black text-amber-500">{lowStock.length}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1"><AlertTriangle size={12} /> Stock bajo</p>
            </div>
            <div className={`bg-white rounded-2xl border shadow-sm p-4 text-center ${outOfStock.length > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'}`}>
              <p className="text-3xl font-black text-red-500">{outOfStock.length}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1"><TrendingDown size={12} /> Agotados</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Todos los productos</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {products.filter(p => p.active).map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.stock === 0 ? 'bg-red-500' : p.stock <= p.min_stock ? 'bg-amber-400' : 'bg-green-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">Mín: {p.min_stock}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-black ${p.stock === 0 ? 'text-red-500' : p.stock <= p.min_stock ? 'text-amber-500' : 'text-gray-800'}`}>
                      {p.stock}
                    </span>
                    <button onClick={() => setAdjustModal({ id: p.id, name: p.name, stock: p.stock })}
                      className="px-3 py-1.5 bg-blue-50 text-[#2563eb] rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                      Ajustar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-bold text-gray-800">Movimientos recientes</h2></div>
            <div className="divide-y divide-gray-50">
              {movements.slice(0, 20).map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.product_name}</p>
                    <p className="text-xs text-gray-400">{m.note ?? m.type} · {formatDateTime(m.created_at)}</p>
                  </div>
                  <span className={`font-black text-sm ${m.type === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                    {m.type === 'entrada' ? '+' : '-'}{m.quantity}
                  </span>
                </div>
              ))}
              {movements.length === 0 && <div className="text-center py-8 text-gray-300 text-sm">Sin movimientos</div>}
            </div>
          </div>
        </main>
      </div>

      {/* Adjust modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900">Ajustar stock</h3>
              <button onClick={() => setAdjustModal(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 font-medium">{adjustModal.name} · Stock actual: <span className="font-black">{adjustModal.stock}</span></p>
            <div className="grid grid-cols-3 gap-2">
              {(['entrada', 'salida', 'ajuste'] as const).map(t => (
                <button key={t} onClick={() => setAdjustType(t)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition ${adjustType === t ? 'bg-[#2563eb] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cantidad</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} min="1" placeholder="0"
                className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-[#2563eb]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nota (opcional)</label>
              <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Motivo del ajuste..."
                className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
            </div>
            <button onClick={handleAdjust} disabled={saving || !adjustQty}
              className="w-full py-3.5 bg-[#2563eb] text-white font-black rounded-xl hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60">
              <Check size={18} /> {saving ? 'Guardando...' : 'Confirmar ajuste'}
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
