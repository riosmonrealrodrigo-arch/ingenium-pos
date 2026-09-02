'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { Product } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditarProductoPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts, updateProduct } = useProducts();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', purchase_price: '', sale_price: '', stock: '', min_stock: '', active: true });

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) loadProducts(); }, [profile]);
  useEffect(() => {
    const p = products.find(x => x.id === id);
    if (p) setForm({ code: p.code, name: p.name, description: p.description ?? '', purchase_price: String(p.purchase_price), sale_price: String(p.sale_price), stock: String(p.stock), min_stock: String(p.min_stock), active: p.active });
  }, [products, id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProduct(id, {
      code: form.code, name: form.name, description: form.description,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sale_price: parseFloat(form.sale_price),
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      active: form.active,
    });
    setSaving(false);
    router.push('/productos');
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col pb-20 lg:pb-0">
        <Header title="Editar Producto" />
        <main className="p-4 lg:p-6 max-w-2xl mx-auto w-full">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 transition">
            <ArrowLeft size={16} /> Volver
          </button>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Código SKU</label><input value={form.code} onChange={set('code')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre *</label><input required value={form.name} onChange={set('name')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Descripción</label><textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">P. Compra ({business?.currency})</label><input type="number" step="0.01" value={form.purchase_price} onChange={set('purchase_price')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">P. Venta ({business?.currency}) *</label><input required type="number" step="0.01" value={form.sale_price} onChange={set('sale_price')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Stock actual</label><input type="number" value={form.stock} onChange={set('stock')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Stock mínimo</label><input type="number" value={form.min_stock} onChange={set('min_stock')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div><p className="text-sm font-semibold text-gray-700">Producto activo</p><p className="text-xs text-gray-400">Aparece en el punto de venta</p></div>
              <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))} className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-[#2563eb]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
