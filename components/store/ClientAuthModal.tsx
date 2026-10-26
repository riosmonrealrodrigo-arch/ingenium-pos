'use client';
import { useState } from 'react';
import Link from 'next/link';
import { StorefrontCustomer } from '@/types';
import { supabase } from '@/lib/supabase';
import { User, Phone, Mail, Lock, X, CheckCircle, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react';

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
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authTermsAccepted, setAuthTermsAccepted] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ingenium_auth_target', 'client');
      }
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://ingeniummobileshop.vercel.app/auth/callback';

      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthErr) {
        if (oauthErr.message.includes('not enabled') || oauthErr.message.includes('provider is not enabled')) {
          setError('El acceso con Google se está sincronizando en el servidor. Puedes usar tu correo o acceso express mientras tanto.');
        } else {
          setError(oauthErr.message);
        }
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con Google.');
      setGoogleLoading(false);
    }
  };

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
              <h3 className="font-bold text-base">Cuenta de Cliente</h3>
              <p className="text-xs text-blue-200">{actionMessage}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex bg-gray-100 p-1 mx-6 mt-5 rounded-xl text-xs font-bold text-gray-600">
          <button
            onClick={() => { setTab('express'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${tab === 'express' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            ⚡ Exprés
          </button>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${tab === 'login' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${tab === 'register' ? 'bg-white text-[#2563eb] shadow-sm' : 'hover:text-gray-900'}`}
          >
            Crear Cuenta
          </button>
        </div>

        {tab === 'express' ? (
          /* Formulario Exprés - SIN botón de Google */
          <form onSubmit={handleExpressSubmit} className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs leading-relaxed flex items-start gap-2">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Sin contraseña. Solo tu nombre y WhatsApp para guardar tu orden o chatear con un técnico.</span>
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
                  placeholder="Ej. +52 81 1234-5678"
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

            {/* Checkbox Obligatorio Legal */}
            <label className="flex items-start gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={authTermsAccepted}
                onChange={e => setAuthTermsAccepted(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-[#2563eb] focus:ring-blue-500 border-gray-300 shrink-0 cursor-pointer"
              />
              <span className="text-[10px] text-gray-600 leading-tight">
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
              disabled={!authTermsAccepted}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle size={15} /> Continuar como Invitado
            </button>
          </form>
        ) : (
          /* Formulario Supabase Auth (Iniciar Sesión / Crear Cuenta) - CON botón de Google */
          <form onSubmit={handleSupabaseAuth} className="p-6 space-y-3.5">
            {/* Botón de Google SOLO en Iniciar Sesión o Crear Cuenta */}
            <div>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800 font-bold rounded-2xl shadow-xs hover:shadow transition flex items-center justify-center gap-3 text-xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
              </button>

              <div className="relative flex py-2.5 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  O con tus datos
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
            </div>
            {tab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    placeholder="Número de celular"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  title={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                >
                  {showPass ? <EyeOff size={15} className="text-[#2563eb]" /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">⚠️ {error}</p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold">
                ✓ {successMsg}
              </p>
            )}

            {tab === 'register' && (
              <label className="flex items-start gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={authTermsAccepted}
                  onChange={e => setAuthTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-[#2563eb] focus:ring-blue-500 border-gray-300 shrink-0 cursor-pointer"
                />
                <span className="text-[10px] text-gray-600 leading-tight">
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
            )}

            <button
              type="submit"
              disabled={loading || (tab === 'register' && !authTermsAccepted)}
              className="w-full py-3 bg-[#1e3a5f] hover:bg-[#2563eb] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition shadow mt-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Procesando...' : tab === 'login' ? 'Iniciar Sesión' : 'Crear mi Cuenta de Cliente'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
