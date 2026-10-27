'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StorefrontCustomer } from '@/types';
import { User, Phone, X, CheckCircle, Sparkles } from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: StorefrontCustomer) => void;
  actionMessage?: string;
  initialMode?: string;
}

export default function ClientAuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionMessage = 'Identifícate para continuar con tu compra, cotización o chat',
}: ClientAuthModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Cargar datos previos si ya existen en el navegador
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_store_customer');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setName(parsed.name);
          if (parsed.phone) setPhone(parsed.phone);
          setTermsAccepted(true);
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError('Por favor ingresa un número de WhatsApp o teléfono válido (mínimo 7 dígitos)');
      return;
    }
    if (!termsAccepted) {
      setError('Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar');
      return;
    }

    const cleanPhone = phone.trim();
    const customer: StorefrontCustomer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: cleanPhone,
      email: `${cleanPhone.replace(/\D/g, '') || Date.now()}@cliente.local`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_store_customer', JSON.stringify(customer));
    }

    onSuccess(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#1e3a5f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-10 h-10 rounded-full object-cover border border-white/30 shadow"
            />
            <div>
              <h3 className="font-bold text-base">Datos de Contacto</h3>
              <p className="text-xs text-blue-200">{actionMessage}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario Exprés Directo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5">
            <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Acceso Rápido sin Contraseña</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Solo necesitamos tu nombre y WhatsApp para poder ponernos en contacto contigo y atender tu pedido o consulta.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={15} />
              </span>
              <input
                type="text"
                placeholder="Ej. Carlos Mendoza"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-[#2563eb] outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={15} />
              </span>
              <input
                type="tel"
                placeholder="Ej. 81 1234 5678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-[#2563eb] outline-none transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}

          {/* Checkbox Obligatorio Legal (PROFECO e INAI) */}
          <label className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none hover:bg-gray-100/70 transition">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#2563eb] focus:ring-blue-500 border-gray-300 shrink-0 cursor-pointer"
            />
            <span className="text-[11px] text-gray-600 leading-tight">
              He leído y acepto los{' '}
              <Link href="/terminos" target="_blank" className="font-bold text-[#2563eb] underline hover:text-blue-800">
                Términos y Condiciones
              </Link>{' '}
              y el{' '}
              <Link href="/privacidad" target="_blank" className="font-bold text-[#2563eb] underline hover:text-blue-800">
                Aviso de Privacidad
              </Link>.
            </span>
          </label>

          <button
            type="submit"
            disabled={!termsAccepted || !name.trim() || !phone.trim()}
            className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={16} /> Continuar con mi Pedido / Consulta
          </button>
        </form>
      </div>
    </div>
  );
}
