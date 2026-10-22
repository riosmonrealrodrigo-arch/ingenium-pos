'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Save, Check, Printer, ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { TicketSettings } from '@/types';
import { DEFAULT_TICKET_SETTINGS } from '@/lib/mockData';

export default function ConfiguracionTicketsPage() {
  const { profile, business, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<TicketSettings>(DEFAULT_TICKET_SETTINGS);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ingenium_ticket_settings');
      if (stored) {
        try {
          setSettings(JSON.parse(stored));
        } catch {
          setSettings(DEFAULT_TICKET_SETTINGS);
        }
      } else if (business) {
        setSettings(prev => ({
          ...prev,
          business_name: business.name || prev.business_name,
          address: business.address || prev.address,
          phone: business.phone || prev.phone,
          email: business.email || prev.email,
        }));
      }
    }
  }, [business]);

  const handleChange = (k: keyof TicketSettings, val: string) => {
    setSettings(prev => ({ ...prev, [k]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Save locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_ticket_settings', JSON.stringify(settings));
    }

    // Attempt save to Supabase if connected
    if (business && business.id !== 'demo-biz-1') {
      try {
        await supabase
          .from('ticket_settings')
          .upsert({
            business_id: business.id,
            business_name: settings.business_name,
            tax_id: settings.tax_id,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            social_media: settings.social_media,
            warranty_note: settings.warranty_note,
            repair_terms: settings.repair_terms,
            default_format: settings.default_format,
            logo_url: settings.logo_url,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'business_id' });
      } catch (err) {
        console.warn('Saved in local storage; Supabase error:', err);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Deseas restablecer los valores por defecto del ticket?')) {
      setSettings(DEFAULT_TICKET_SETTINGS);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ingenium_ticket_settings', JSON.stringify(DEFAULT_TICKET_SETTINGS));
      }
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 flex flex-col pb-20 lg:pb-0">
        <Header
          title="Configuración de Tickets y Recibos"
          subtitle="Personaliza el encabezado, políticas y formato térmico de impresión"
        />

        <main className="p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-5">
          <div className="flex items-center justify-between">
            <Link
              href="/configuracion"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-semibold transition"
            >
              <ArrowLeft size={16} /> Volver a Configuración General
            </Link>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1.5 transition"
            >
              <RefreshCw size={13} /> Restablecer valores estándar
            </button>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
              <Check size={18} /> Configuración de tickets guardada con éxito
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
              
              {/* Business Identity */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-800 font-black text-sm uppercase tracking-wider">
                  <Printer size={16} className="text-[#2563eb]" />
                  <span>Encabezado del Ticket</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Nombre Comercial en el Ticket *
                  </label>
                  <input
                    required
                    value={settings.business_name}
                    onChange={e => handleChange('business_name', e.target.value)}
                    placeholder="Ej: INGENIUM MOBILE"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                      Identificación Fiscal (NIT / RFC)
                    </label>
                    <input
                      value={settings.tax_id || ''}
                      onChange={e => handleChange('tax_id', e.target.value)}
                      placeholder="Ej: NIT: 10482910-3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                      Teléfono / WhatsApp de Atención
                    </label>
                    <input
                      value={settings.phone || ''}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="Ej: +502 5555-0199"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Dirección Física del Local
                  </label>
                  <input
                    value={settings.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                    placeholder="Ej: 6ta Avenida 12-34, Zona 1, Ciudad de Guatemala"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                      Redes Sociales
                    </label>
                    <input
                      value={settings.social_media || ''}
                      onChange={e => handleChange('social_media', e.target.value)}
                      placeholder="Ej: FB & IG: @ingeniummovil"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                      Formato Predeterminado
                    </label>
                    <select
                      value={settings.default_format}
                      onChange={e => handleChange('default_format', e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="thermal_80">Ticket Térmico 80mm (Estándar)</option>
                      <option value="thermal_58">Ticket Térmico 58mm (Portátil)</option>
                      <option value="letter">Media Carta / A4 (Oficial)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Policy & Warranty Clauses */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-800 font-black text-sm uppercase tracking-wider">
                  <span>📜 Términos, Garantías y Condiciones Legales</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Pie de Página / Política de Garantía (Ventas y Reparaciones)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.warranty_note}
                    onChange={e => handleChange('warranty_note', e.target.value)}
                    placeholder="Garantía en repuestos instalados..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Este texto se imprimirá al final de cada ticket emitido.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Cláusula de Abandono y Riesgo de Taller (Órdenes de Servicio)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.repair_terms}
                    onChange={e => handleChange('repair_terms', e.target.value)}
                    placeholder="Todo equipo no retirado causará abandono tras 60 días..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Protege tu taller legalmente contra equipos abandonados o fallas previas.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60 active:scale-95"
              >
                <Save size={16} /> {saving ? 'Guardando cambios...' : 'Guardar Configuración del Ticket'}
              </button>
            </form>

            {/* Live Interactive Preview Column */}
            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase">
                    <Eye size={14} className="text-[#2563eb]" />
                    <span>Vista Previa en Vivo ({settings.default_format})</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-full font-bold">
                    Tiempo Real
                  </span>
                </div>

                <div className="flex justify-center bg-gray-100 p-4 rounded-xl overflow-x-auto">
                  <div
                    className={`bg-white shadow-md p-4 transition-all duration-200 ${
                      settings.default_format === 'thermal_58'
                        ? 'w-[240px] text-[10px] font-mono leading-tight'
                        : 'w-[290px] text-[11px] font-mono leading-relaxed'
                    }`}
                  >
                    <div className="text-center pb-2 border-b border-dashed border-gray-300">
                      <p className="font-black text-sm uppercase text-gray-900">{settings.business_name || 'MI NEGOCIO'}</p>
                      {settings.tax_id && <p className="text-gray-500">{settings.tax_id}</p>}
                      {settings.address && <p className="text-[9px] text-gray-400">{settings.address}</p>}
                      {settings.phone && <p className="text-gray-600 font-semibold text-[10px]">Tel: {settings.phone}</p>}
                      {settings.social_media && <p className="text-[9px] text-gray-400">{settings.social_media}</p>}
                    </div>

                    <div className="py-2 border-b border-dashed border-gray-300 space-y-0.5 text-gray-600 text-[10px]">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>TICKET: #10029</span>
                        <span>02/11/2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cajero: Rodrigo</span>
                        <span>15:30 hrs</span>
                      </div>
                      <div className="flex justify-between text-gray-800">
                        <span>Cliente: Carlos Mendoza</span>
                      </div>
                    </div>

                    <div className="py-2 border-b border-dashed border-gray-300 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span>1x Pantalla OLED iPhone 13</span>
                        <span className="font-bold">$850.00 MXN</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Cristal Templado 9D</span>
                        <span className="font-bold">$35.00 MXN</span>
                      </div>
                      <div className="flex justify-between font-black text-xs text-gray-900 pt-1 border-t border-gray-200">
                        <span>TOTAL:</span>
                        <span>$885.00 MXN</span>
                      </div>
                      <div className="flex justify-between text-gray-500 text-[9px]">
                        <span>Pago: EFECTIVO</span>
                        <span>Cambio: $115.00 MXN</span>
                      </div>
                    </div>

                    <div className="pt-2 text-center text-[8px] text-gray-400 space-y-1 leading-tight">
                      {settings.warranty_note && (
                        <p className="italic text-gray-500 font-sans">{settings.warranty_note}</p>
                      )}
                      <p className="font-bold font-mono text-[9px] text-gray-800 pt-1 uppercase">
                        ¡GRACIAS POR SU PREFERENCIA!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
