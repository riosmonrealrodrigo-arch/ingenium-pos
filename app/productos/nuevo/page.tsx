'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ArrowLeft, Save, Globe, Image as ImageIcon } from 'lucide-react';

export default function NuevoProductoPage() {
  const { profile, business, loading } = useAuth();
  const { addProduct } = useProducts();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
    min_stock: '5',
    active: true,
  });

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sale_price) return;
    setSaving(true);
    await addProduct({
      code: form.code || `PROD-${Date.now().toString(36).toUpperCase()}`,
      name: form.name,
      description: form.description,
      commercial_description: form.commercial_description || form.description,
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

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col pb-20 lg:pb-0">
        <Header title="Nuevo Producto" />
        <main className="p-4 lg:p-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 transition"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Código SKU" placeholder="Ej: PROD-001" value={form.code} onChange={set('code')} />
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Nombre del producto"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Descripción Interna (POS)
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                placeholder="Notas técnicas o internas..."
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
                    <p className="text-[11px] text-gray-500">¿Este producto estará visible para clientes en internet?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visible_en_tienda: !f.visible_en_tienda }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    form.visible_en_tienda ? 'bg-[#2563eb]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.visible_en_tienda ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {form.visible_en_tienda && (
                <>
                  <Field
                    label="URL de Foto del Producto"
                    placeholder="https://ejemplo.com/foto-pantalla.jpg"
                    value={form.image_url}
                    onChange={set('image_url')}
                  />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Descripción Comercial (para clientes web)
                    </label>
                    <textarea
                      value={form.commercial_description}
                      onChange={set('commercial_description')}
                      rows={2}
                      placeholder="Explica la garantía, calidad de repuesto o compatibilidad..."
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Precio de compra (${business?.currency ?? 'Q'})`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.purchase_price}
                onChange={set('purchase_price')}
              />
              <Field
                label={`Precio de venta (${business?.currency ?? 'Q'}) *`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.sale_price}
                onChange={set('sale_price')}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Stock inicial"
                type="number"
                placeholder="0"
                value={form.stock}
                onChange={set('stock')}
              />
              <Field
                label="Stock mínimo de alerta"
                type="number"
                placeholder="5"
                value={form.min_stock}
                onChange={set('min_stock')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Producto activo en POS</p>
                <p className="text-xs text-gray-400">Aparece en el buscador de ventas</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.active ? 'bg-[#2563eb]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.active ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
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
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
      />
    </div>
  );
}
