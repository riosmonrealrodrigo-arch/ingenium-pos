'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ArrowLeft, Save, Globe, Smartphone, Zap, Wrench, CheckCircle2 } from 'lucide-react';
import { CATEGORY_UUIDS } from '@/lib/categories';

const CATEGORY_OPTIONS = [
  {
    id: CATEGORY_UUIDS.repuestos,
    name: 'Repuestos & Pantallas',
    label: 'Repuestos',
    icon: Smartphone,
    desc: 'Displays, pantallas OLED, baterías, flexores, centros de carga y piezas.',
  },
  {
    id: CATEGORY_UUIDS.accesorios,
    name: 'Cargadores & Accesorios',
    label: 'Accesorios',
    icon: Zap,
    desc: 'Cables, cargadores rápidos, fundas de uso rudo, micas de cristal, audio.',
  },
  {
    id: CATEGORY_UUIDS.servicios,
    name: 'Servicio de Reparación',
    label: 'Servicios de reparación',
    icon: Wrench,
    desc: 'Mantenimiento, diagnóstico, baño químico, soldadura o cotización en taller.',
  },
];

export default function NuevoProductoPage() {
  const { profile, business, loading } = useAuth();
  const { addProduct } = useProducts();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    code: '',
    name: '',
    category_id: CATEGORY_UUIDS.repuestos as string,
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

  const isService =
    form.category_id === CATEGORY_UUIDS.servicios ||
    form.category_id === 'cat-3' ||
    form.category_id === 'servicios';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('idle');

    if (!form.name.trim()) {
      alert('Por favor escribe el nombre del producto o servicio.');
      return;
    }

    if (!isService && (!form.sale_price || isNaN(parseFloat(form.sale_price)))) {
      alert('Por favor ingresa un precio de venta para repuestos o accesorios.');
      return;
    }

    setSaving(true);
    const prefix = isService ? 'SRV' : form.category_id === CATEGORY_UUIDS.accesorios ? 'ACC' : 'REP';
    const finalCode = form.code.trim() || `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    try {
      await addProduct({
        code: finalCode,
        name: form.name.trim(),
        category_id: form.category_id,
        description: form.description,
        commercial_description: form.commercial_description || form.description,
        image_url: form.image_url,
        visible_en_tienda: form.visible_en_tienda,
        purchase_price: parseFloat(form.purchase_price) || 0,
        sale_price: form.sale_price !== '' && !isNaN(parseFloat(form.sale_price)) ? parseFloat(form.sale_price) : 0,
        stock: isService ? (parseInt(form.stock) || 999) : (parseInt(form.stock) || 0),
        min_stock: parseInt(form.min_stock) || (isService ? 0 : 5),
        active: form.active,
      });

      setSaveStatus('success');
      setTimeout(() => {
        router.push('/productos');
      }, 700);
    } catch (err: any) {
      console.error('Error al agregar producto:', err);
      setSaveStatus('error');
      alert(`⚠️ No se pudo guardar el producto: ${err?.message || 'Error de conexión con la base de datos'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Nuevo Producto o Servicio" />
        <main className="p-4 lg:p-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          {/* Banner de Éxito al Guardar */}
          {saveStatus === 'success' && (
            <div className="mb-4 p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-fade-in">
              <CheckCircle2 size={22} className="shrink-0" />
              <div>
                <p className="font-bold text-sm">¡Guardado con éxito!</p>
                <p className="text-xs text-emerald-100">Sincronizando con catálogo y tienda web...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            
            {/* Clasificación de Producto / Servicio */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                Clasificación del Producto o Servicio *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORY_OPTIONS.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = form.category_id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          category_id: cat.id,
                          stock: cat.id === CATEGORY_UUIDS.servicios && (!f.stock || f.stock === '0') ? '999' : f.stock,
                        }));
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#2563eb] bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-[#2563eb] text-white shadow-xs' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon size={16} />
                        </div>
                        {isSelected && (
                          <span className="text-[#2563eb] text-xs">
                            <CheckCircle2 size={16} />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-tight">{cat.name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight mt-1 line-clamp-2">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Aviso explicativo para Servicios de Reparación */}
              {isService && (
                <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in">
                  <div className="p-1 bg-amber-200/70 rounded-lg text-amber-900 shrink-0 mt-0.5">
                    <Wrench size={14} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold">🔧 Modo Servicio de Reparación activado</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      El precio de venta es <strong>opcional</strong>. Si lo dejas vacío, en la tienda web <strong>no aparecerá ningún precio</strong> y los clientes verán el botón directo para <strong>"Cotizar Reparación"</strong> por WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Código SKU"
                placeholder={isService ? 'Ej: SRV-001 o MAN-001' : form.category_id === CATEGORY_UUIDS.accesorios ? 'Ej: ACC-001' : 'Ej: REP-001'}
                value={form.code}
                onChange={set('code')}
              />
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Nombre del {isService ? 'Servicio' : 'Producto'} *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder={isService ? 'Ej: Mantenimiento Xbox / Cambio de Pantalla' : 'Nombre del producto'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Descripción Interna (POS / Taller)
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={2}
                placeholder="Notas técnicas internas, tiempo estimado de trabajo o insumos..."
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
                    <p className="text-[11px] text-gray-500">¿Estará visible para clientes en la web?</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-bold select-none ${form.visible_en_tienda ? 'text-[#2563eb]' : 'text-gray-400'}`}>
                    {form.visible_en_tienda ? 'Visible' : 'Oculto'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.visible_en_tienda}
                    onClick={() => setForm(f => ({ ...f, visible_en_tienda: !f.visible_en_tienda }))}
                    className="relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] rounded-full shrink-0"
                    style={{
                      width: '48px',
                      height: '28px',
                      backgroundColor: form.visible_en_tienda ? '#2563eb' : '#d1d5db',
                      borderRadius: '9999px',
                    }}
                  >
                    <span
                      className="absolute bg-white shadow-md transition-all duration-200 ease-in-out pointer-events-none"
                      style={{
                        top: '4px',
                        left: form.visible_en_tienda ? '24px' : '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '9999px',
                      }}
                    />
                  </button>
                </div>
              </div>

              {form.visible_en_tienda && (
                <>
                  <Field
                    label="URL de Foto (Opcional)"
                    placeholder="https://ejemplo.com/foto.jpg"
                    value={form.image_url}
                    onChange={set('image_url')}
                  />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Descripción Comercial (Catálogo Web)
                    </label>
                    <textarea
                      value={form.commercial_description}
                      onChange={set('commercial_description')}
                      rows={2}
                      placeholder={isService ? 'Explica lo que incluye el servicio, garantía en mano de obra o tiempo estimado...' : 'Garantía, calidad o compatibilidad...'}
                      className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={`Precio de compra / costo (${business?.currency ?? '$'})`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.purchase_price}
                onChange={set('purchase_price')}
              />
              <Field
                label={
                  isService
                    ? `Precio de venta (${business?.currency ?? '$'}) (Opcional)`
                    : `Precio de venta (${business?.currency ?? '$'}) *`
                }
                type="number"
                step="0.01"
                placeholder={isService ? 'Opcional (Dejar vacío para cotizar)' : '0.00'}
                value={form.sale_price}
                onChange={set('sale_price')}
                required={!isService}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label={isService ? 'Disponibilidad / Cupos' : 'Stock inicial'}
                type="number"
                placeholder={isService ? '999' : '0'}
                value={form.stock}
                onChange={set('stock')}
              />
              <Field
                label="Stock mínimo de alerta"
                type="number"
                placeholder={isService ? '0' : '5'}
                value={form.min_stock}
                onChange={set('min_stock')}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Activo en POS</p>
                <p className="text-xs text-gray-400">Aparece en el catálogo de cobro</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-bold select-none ${form.active ? 'text-[#2563eb]' : 'text-gray-400'}`}>
                  {form.active ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] rounded-full shrink-0"
                  style={{
                    width: '48px',
                    height: '28px',
                    backgroundColor: form.active ? '#2563eb' : '#d1d5db',
                    borderRadius: '9999px',
                  }}
                >
                  <span
                    className="absolute bg-white shadow-md transition-all duration-200 ease-in-out pointer-events-none"
                    style={{
                      top: '4px',
                      left: form.active ? '24px' : '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '9999px',
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60 shadow cursor-pointer"
              >
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar producto / servicio'}
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