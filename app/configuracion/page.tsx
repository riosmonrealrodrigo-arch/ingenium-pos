'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Save, Check, Printer, ChevronRight, Palette } from 'lucide-react';
import Link from 'next/link';
import { useStoreTheme } from '@/context/StoreThemeContext';
import StoreThemeModal from '@/components/store/StoreThemeModal';

export default function ConfiguracionPage() {
  const { profile, business, loading } = useAuth();
  const { currentTheme } = useStoreTheme();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', currency: '$ MXN', tax_rate: '16' });

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
        </main>
      </div>
      <BottomNav />
      <StoreThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
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
