'use client';
import { useState } from 'react';
import { StorefrontCustomer } from '@/types';
import { supabase } from '@/lib/supabase';
import { User, Phone, Mail, Lock, X, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface ClientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: StorefrontCustomer) => void;
  actionMessage?: string;
  initialMode?: 'express' | 'auth';
}

export default function ClientAuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionMessage = 'Identifícate para continuar con tu compra, cotización o chat',
  initialMode = 'express',
}: ClientAuthModalProps) {
  const [tab, setTab] = useState<'express' | 'login' | 'register'>(initialMode === 'auth' ? 'login' : 'express');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleExpressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!phone.trim()) {
      setError('Por favor ingresa tu número de WhatsApp / Teléfono');
      return;
    }

    const customer: StorefrontCustomer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${phone.trim()}@cliente.com`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_store_customer', JSON.stringify(customer));
    }

    onSuccess(customer);
    onClose();
  };

  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authErr) {
          setError(authErr.message.includes('Invalid') ? 'Correo o contraseña incorrectos' : authErr.message);
          setLoading(false);
          return;
        }

        const cust: StorefrontCustomer = {
          id: data.user?.id || 'cust-' + Date.now(),
          name: data.user?.user_metadata?.full_name || email.split('@')[0],
          phone: data.user?.user_metadata?.phone || '',
          email: data.user?.email || email,
        };

        localStorage.setItem('ingenium_store_customer', JSON.stringify(cust));
        onSuccess(cust);
        onClose();
      } else {
        // Register
        if (!name.trim() || !phone.trim() || password.length < 6) {
          setError('Completa todos los campos obligatorios (contraseña mín. 6 carácteres)');
          setLoading(false);
          return;
        }

        const { data, error: regErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
            },
          },
        });

        if (regErr) {
          setError(regErr.message);
          setLoading(false);
          return;
        }

        const cust: StorefrontCustomer = {
          id: data.user?.id || 'cust-' + Date.now(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        };

        localStorage.setItem('ingenium_store_customer', JSON.stringify(cust));
        setSuccessMsg('¡Cuenta registrada exitosamente!');
        setTimeout(() => {
          onSuccess(cust);
          onClose();
        }, 1200);
      }
    } catch {
      // Local fallback
      const cust: StorefrontCustomer = {
        id: 'cust-' + Date.now(),
        name: name.trim() || email.split('@')[0],
        phone: phone.trim() || '',
        email: email.trim(),
      };
      localStorage.setItem('ingenium_store_customer', JSON.stringify(cust));
      onSuccess(cust);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-[#1e3a5f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-10 h-10 rounded-full object-cover border border-white/30 shadow"
            />
            <div>
              <h3 className="font-bold text-base">Identificación de Cliente</h3>
              <p className="text-xs text-blue-200">{actionMessage}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex bg-gray-100 p-1 mx-6 mt-5 rounded-xl text-xs font-bold text-gray-600">
          <button
            onClick={() => { setTab('express'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${tab === 'express' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            ⚡ Acceso Rápido
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${tab === 'login' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${tab === 'register' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            Crear Cuenta
          </button>
        </div>

        {tab === 'express' ? (
          /* Formulario Exprés */
          <form onSubmit={handleExpressSubmit} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs leading-relaxed flex items-start gap-2">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>No necesitas contraseña. Solo tu nombre y WhatsApp para coordinar tu pedido o responderte en el chat.</span>
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
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
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
                  placeholder="Ej. +502 4123-4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">⚠️ {error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={15} /> Continuar como Invitado
            </button>
          </form>
        ) : (
          /* Formulario Supabase Auth */
          <form onSubmit={handleSupabaseAuth} className="p-6 space-y-3.5">
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    placeholder="+502 0000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">⚠️ {error}</p>
            )}

            {successMsg && (
              <p className="text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 flex items-center gap-1 font-semibold">
                <CheckCircle size={14} /> {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? 'Procesando...' : tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
