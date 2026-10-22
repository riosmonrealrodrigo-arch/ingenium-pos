'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Save, Check, Printer, ChevronRight, Palette, RotateCcw, AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useStoreTheme } from '@/context/StoreThemeContext';
import StoreThemeModal from '@/components/store/StoreThemeModal';

export default function ConfiguracionPage() {
  const { profile, business, loading } = useAuth();
  const { currentTheme } = useStoreTheme();
  const { resetSalesAndAccounting } = useSales();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', currency: '$ MXN', tax_rate: '16' });

  // Reset modal state
  const [resetModalType, setResetModalType] = useState<'ventas' | 'reparaciones' | 'todo' | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => {
    if (business) setForm({ name: business.name, address: business.address ?? '', phone: business.phone ?? '', email: business.email ?? '', currency: business.currency ?? '$ MXN', tax_rate: String(business.tax_rate ?? 16) });
  }, [business]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    try {
      await supabase.from('businesses').update({
        name: form.name, address: form.address, phone: form.phone,
        email: form.email, currency: form.currency, tax_rate: parseFloat(form.tax_rate) || 0,
      }).eq('id', business.id);
    } catch {
      // In demo mode or offline, state is kept
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExecuteReset = async () => {
    if (!resetModalType) return;
    setResetting(true);

    try {
      if (resetModalType === 'ventas' || resetModalType === 'todo') {
        await resetSalesAndAccounting();
      }

      if (resetModalType === 'reparaciones' || resetModalType === 'todo') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_repairs', JSON.stringify([]));
        }
        if (business && business.id !== 'demo-biz-1') {
          try {
            await supabase.from('repair_orders').delete().eq('business_id', business.id);
          } catch (err) {
            console.warn('Error clearing repair orders in Supabase:', err);
          }
        }
      }

      let msg = '';
      if (resetModalType === 'ventas') {
        msg = 'Contabilidad y registro de ventas reiniciados a $0.00 MXN correctamente.';
      } else if (resetModalType === 'reparaciones') {
        msg = 'Historial de reparaciones y trabajos técnicos reiniciado a 0 correctamente.';
      } else {
        msg = 'Reinicio total completado: Contabilidad a $0.00 y reparaciones en blanco.';
      }

      setResetSuccessMessage(msg);
      setTimeout(() => setResetSuccessMessage(null), 5000);
    } catch (e) {
      console.error('Error during reset:', e);
    } finally {
      setResetting(false);
      setResetModalType(null);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Configuración" />
        <main className="p-4 lg:p-6 space-y-5 max-w-2xl mx-auto w-full">

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Check size={16} /> Configuración guardada correctamente
            </div>
          )}

          {resetSuccessMessage && (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
              <Check size={18} className="text-emerald-600 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* Quick link to Web Themes (Visible en celular y PC) */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border border-purple-200/80 rounded-2xl hover:border-purple-400 transition group shadow-sm text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Palette size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition">
                    Temáticas de la Tienda Web
                  </p>
                  <span className="text-[11px] bg-purple-200/80 text-purple-900 font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                    {currentTheme?.emoji} {currentTheme?.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Halloween, Navidad, Buen Fin o Cyber Blue en tiempo real
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-purple-700 shrink-0 ml-2">
              <span>Cambiar</span>
              <ChevronRight size={16} />
            </div>
          </button>

          {/* Quick link to ticket format settings */}
          <Link
            href="/configuracion/tickets"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl hover:border-[#2563eb] transition group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-md">
                <Printer size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm group-hover:text-[#2563eb] transition">
                  Personalizar Tickets y Recibos
                </p>
                <p className="text-xs text-gray-500">
                  Formato 58mm/80mm, NIT, datos fiscales, cláusula de taller y garantías
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#2563eb]">
              <span>Configurar</span>
              <ChevronRight size={16} />
            </div>
          </Link>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-base">Información del negocio</h2>
              <Field label="Nombre del negocio *" value={form.name} onChange={set('name')} required />
              <Field label="Dirección" value={form.address} onChange={set('address')} placeholder="Dirección del negocio" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Teléfono" value={form.phone} onChange={set('phone')} placeholder="+502 0000-0000" />
                <Field label="Correo" type="email" value={form.email} onChange={set('email')} placeholder="negocio@email.com" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-bold text-gray-800 text-base">Configuración fiscal</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Moneda Oficial</label>
                  <select value={form.currency} onChange={set('currency')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                    <option value="$ MXN">$ MXN - Pesos Mexicanos (México)</option>
                    <option value="$">$ USD - Dólares</option>
                    <option value="Q">Q - Quetzal (Guatemala)</option>
                    <option value="L">L - Lempira (Honduras)</option>
                    <option value="C$">C$ - Córdoba (Nicaragua)</option>
                    <option value="₡">₡ - Colón (Costa Rica)</option>
                  </select>
                </div>
                <Field label="Impuesto (%)" type="number" step="0.01" value={form.tax_rate} onChange={set('tax_rate')} placeholder="12" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="font-bold text-gray-800 text-base">Tu cuenta</h2>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-black">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{profile.name}</p>
                  <p className="text-xs text-gray-400">{profile.email} · <span className="capitalize font-semibold">{profile.role}</span></p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-4 bg-[#2563eb] text-white font-black rounded-xl hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60 text-base">
              <Save size={18} /> {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </form>

          {/* Zona de Gestión y Reinicio de Datos Operativos */}
          <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">Reinicio de Contabilidad y Operaciones</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Limpia ventas de prueba, resetea la contabilidad a $0.00 o vacía los trabajos de taller para iniciar operaciones reales.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalType('ventas')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100/70 text-red-700 transition group cursor-pointer text-center"
              >
                <RotateCcw size={20} className="mb-1 text-red-600 group-hover:rotate-[-45deg] transition" />
                <span className="text-xs font-black">Reiniciar Contabilidad</span>
                <span className="text-[10px] text-red-600/80">Pone ventas y caja en $0.00</span>
              </button>

              <button
                type="button"
                onClick={() => setResetModalType('reparaciones')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 transition group cursor-pointer text-center"
              >
                <RefreshCw size={20} className="mb-1 text-amber-600 group-hover:rotate-180 transition duration-300" />
                <span className="text-xs font-black">Reiniciar Taller</span>
                <span className="text-[10px] text-amber-700/80">Borra órdenes de reparación</span>
              </button>

              <button
                type="button"
                onClick={() => setResetModalType('todo')}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 text-white transition group cursor-pointer text-center shadow-sm"
              >
                <Trash2 size={20} className="mb-1 text-white/90 group-hover:scale-110 transition" />
                <span className="text-xs font-black">Reinicio Completo</span>
                <span className="text-[10px] text-white/80">Ventas + Taller en blanco</span>
              </button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
      <StoreThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Safety Confirmation Modal for Reset */}
      {resetModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle size={22} />
                <h3 className="font-black text-gray-900 text-base">
                  {resetModalType === 'ventas'
                    ? '¿Reiniciar Contabilidad y Ventas?'
                    : resetModalType === 'reparaciones'
                    ? '¿Reiniciar Trabajos de Taller?'
                    : '¿Reinicio Total de Operaciones?'}
                </h3>
              </div>
              <button
                onClick={() => setResetModalType(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-100 text-xs text-red-800 space-y-2">
              <p className="font-bold">Esta acción borrará de forma permanente:</p>
              <ul className="list-disc list-inside space-y-1">
                {(resetModalType === 'ventas' || resetModalType === 'todo') && (
                  <li>Todo el historial de ventas registradas y devoluciones</li>
                )}
                {(resetModalType === 'ventas' || resetModalType === 'todo') && (
                  <li>El balance acumulado en caja y métricas de ingresos del dashboard (volverán a $0.00 MXN)</li>
                )}
                {(resetModalType === 'reparaciones' || resetModalType === 'todo') && (
                  <li>Todas las órdenes de servicio de taller, diagnósticos y garantías activas</li>
                )}
              </ul>
              <p className="text-[11px] text-red-600 font-semibold pt-1">
                ℹ️ Los productos de tu inventario y catálogo de la tienda web no se perderán.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalType(null)}
                disabled={resetting}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetting}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Reiniciando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Sí, reiniciar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <input {...props} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
    </div>
  );
}
