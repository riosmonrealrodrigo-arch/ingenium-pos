'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { Product } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ArrowLeft, Save, Globe, Trash2 } from 'lucide-react';

export default function EditarProductoPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts, updateProduct, deleteProduct } = useProducts();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    commercial_description: '',
    image_url: '',
    visible_en_tienda: true,
    purchase_price: '',
    sale_price: '',
    stock: '',
    min_stock: '',
    active: true,
  });

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  useEffect(() => {
    if (profile) loadProducts();
  }, [profile, loadProducts]);

  useEffect(() => {
    const p = products.find(x => x.id === id);
    if (p) {
      setForm({
        code: p.code,
        name: p.name,
        description: p.description ?? '',
        commercial_description: p.commercial_description ?? p.description ?? '',
        image_url: p.image_url ?? '',
        visible_en_tienda: p.visible_en_tienda !== false,
        purchase_price: String(p.purchase_price),
        sale_price: String(p.sale_price),
        stock: String(p.stock),
        min_stock: String(p.min_stock),
        active: p.active,
      });
    }
  }, [products, id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProduct(id, {
      code: form.code,
      name: form.name,
      description: form.description,
      commercial_description: form.commercial_description,
      image_url: form.image_url,
      visible_en_tienda: form.visible_en_tienda,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sale_price: parseFloat(form.sale_price),
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      active: form.active,
    });
    setSaving(false);
    router.push('/productos');
  };

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de eliminar permanentemente "${form.name}"? Esta acción se reflejará de inmediato en Supabase y la tienda web.`)) {
      setDeleting(true);
      await deleteProduct(id);
      setDeleting(false);
      router.push('/productos');
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Editar Producto" />
        <main className="p-4 lg:p-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 transition"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Código SKU</label>
                <input
                  value={form.code}
                  onChange={set('code')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Descripción Interna</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
              />
            </div>

            {/* Storefront Section */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-[#2563eb]" />
                  <div>
                    <p className="text-sm font-bold text-[#1e3a5f]">Tienda Web Pública (Catálogo)</p>
                    <p className="text-[11px] text-gray-500">Visible para clientes y visitantes en la web</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visible_en_tienda: !f.visible_en_tienda }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                    form.visible_en_tienda ? 'bg-[#2563eb]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      form.visible_en_tienda ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {form.visible_en_tienda && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      URL de Foto del Producto
                    </label>
                    <input
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={form.image_url}
                      onChange={set('image_url')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Descripción Comercial (Catálogo Web)
                    </label>
                    <textarea
                      value={form.commercial_description}
                      onChange={set('commercial_description')}
                      rows={2}
                      placeholder="Garantía, especificaciones para el cliente..."
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  P. Compra ({business?.currency ?? '$'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={set('purchase_price')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  P. Venta ({business?.currency ?? '$'}) *
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={form.sale_price}
                  onChange={set('sale_price')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Stock actual</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={set('stock')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Stock mínimo</label>
                <input
                  type="number"
                  value={form.min_stock}
                  onChange={set('min_stock')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Producto activo en POS</p>
                <p className="text-xs text-gray-400">Aparece en el punto de venta</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
                  form.active ? 'bg-[#2563eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    form.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>{deleting ? 'Eliminando...' : 'Eliminar Producto'}</span>
              </button>
              <div className="flex-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60 shadow"
                >
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
