'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { playNotificationChime } from '@/components/admin/AdminNotificationSystem';
import {
  ShieldCheck,
  Zap,
  Smartphone,
  Bell,
  ArrowRight,
  Store,
  CheckCircle,
  HelpCircle,
  Lock,
  Volume2
} from 'lucide-react';

export default function AdminDirectAccessPage() {
  const router = useRouter();
  const { profile, loginAsAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testedSound, setTestedSound] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  useEffect(() => {
    // Si viene con auto=1 o desde acceso PWA, entrar directo
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isAuto = params.get('auto') === '1' || params.get('source') === 'pwa';
      if (isAuto) {
        handleDirectAccess();
      }
    }
  }, []);

  const handleDirectAccess = async () => {
    setLoading(true);
    try {
      await loginAsAdmin();
      router.push('/pos');
    } catch (err) {
      console.error('Error al ingresar como admin:', err);
      router.push('/pos');
    }
  };

  const handleTestNotifications = async () => {
    playNotificationChime();
    setTestedSound(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification('💬 ¡Notificaciones Activas en INGENIUM MOBILE!', {
            body: 'Tu dispositivo te avisará con sonido cada vez que un cliente te mande mensaje.',
            icon: '/images/logo.jpg',
          });
        }
      } else if (Notification.permission === 'granted') {
        new Notification('🔔 Prueba de Alerta de Mensaje', {
          body: 'Así sonará y se verá cuando un cliente te escriba en la tienda web.',
          icon: '/images/logo.jpg',
        });
      }
    }

    setTimeout(() => setTestedSound(false), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1f38] via-[#1e3a5f] to-[#0f1f38] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-fade-in">
        {/* Cabecera Ejecutiva */}
        <div className="bg-[#1e3a5f] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative inline-block mb-3">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-20 h-20 rounded-full object-cover border-3 border-amber-400 shadow-xl mx-auto"
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-[#1e3a5f] rounded-full flex items-center justify-center text-[10px] text-white">
              ✓
            </span>
          </div>

          <h1 className="text-xl font-black tracking-tight text-white">Acceso Directo Maestro</h1>
          <p className="text-xs text-blue-200 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-amber-400" />
            Rodrigo Ríos · Administrador Oficial
          </p>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-950 p-3.5 rounded-2xl text-xs leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 text-blue-900">
              <Zap size={15} className="text-amber-500" /> Acceso Rápido Sin Contraseñas
            </p>
            <p className="text-blue-800 text-[11px] mt-1">
              Este enlace es tu entrada privada directa al Punto de Venta, Taller y Mensajes de clientes.
            </p>
          </div>

          {/* Botón Principal de Entrada */}
          <button
            onClick={handleDirectAccess}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-2xl transition transform active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ingresando al POS...</span>
              </>
            ) : (
              <>
                <Zap size={18} className="text-amber-300" />
                <span>Entrar al POS Directamente</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>

          {/* Botón de Prueba de Notificaciones y Sonido */}
          <button
            onClick={handleTestNotifications}
            type="button"
            className="w-full py-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Bell size={16} className="text-amber-600 animate-bounce" />
            <span>{testedSound ? '🔔 ¡Campana y Notificación Probadas!' : 'Probar Notificaciones y Sonido'}</span>
          </button>

          {/* Guía para Instalar en Pantalla de Inicio del Celular */}
          <div className="border border-gray-200 rounded-2xl p-3.5 bg-gray-50/70">
            <button
              type="button"
              onClick={() => setShowPwaGuide(v => !v)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Smartphone size={16} className="text-[#2563eb]" />
                <span>Tener como App en la pantalla de tu celular</span>
              </div>
              <span className="text-xs text-blue-600 font-bold">
                {showPwaGuide ? 'Ocultar' : '¿Cómo?'}
              </span>
            </button>

            {showPwaGuide && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] text-gray-700 space-y-2 animate-fade-in leading-relaxed">
                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-900 mb-0.5">🤖 En Celular Android (Google Chrome):</p>
                  <p>1. Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha en Chrome.</p>
                  <p>2. Selecciona <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</p>
                  <p className="text-emerald-700 font-semibold mt-1">✓ Se creará el ícono de INGENIUM POS junto a tus otras aplicaciones.</p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                  <p className="font-bold text-gray-900 mb-0.5">🍎 En iPhone (Safari):</p>
                  <p>1. Toca el botón <strong>Compartir</strong> (el ícono del cuadro con la flecha hacia arriba).</p>
                  <p>2. Baja y selecciona <strong>"Agregar al inicio"</strong>.</p>
                  <p className="text-emerald-700 font-semibold mt-1">✓ Tendrás acceso con 1 solo toque.</p>
                </div>
              </div>
            )}
          </div>

          {/* Enlaces Secundarios */}
          <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
            <Link
              href="/tienda"
              className="flex items-center gap-1 hover:text-[#2563eb] transition font-semibold"
            >
              <Store size={13} />
              <span>Ver Tienda Pública</span>
            </Link>

            <Link
              href="/login"
              className="flex items-center gap-1 hover:text-gray-800 transition"
            >
              <Lock size={12} />
              <span>Login tradicional</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
