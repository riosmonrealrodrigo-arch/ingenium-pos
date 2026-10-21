'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Wrench,
  Package,
  MessageSquare,
  Sparkles,
  Printer,
  ShieldCheck,
  X,
  Keyboard,
  ArrowRight,
  Database
} from 'lucide-react';

interface WelcomeScreenProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export default function WelcomeScreen({
  isOpen: propIsOpen,
  onClose: propOnClose,
  forceShow = false,
}: WelcomeScreenProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (forceShow) {
        setIsOpen(true);
      } else if (propIsOpen !== undefined) {
        setIsOpen(propIsOpen);
      } else {
        const dismissed = localStorage.getItem('ingenium_pos_welcome_dismissed');
        if (!dismissed) {
          setIsOpen(true);
        }
      }
    }
  }, [propIsOpen, forceShow]);

  // Keyboard shortcut listener (F1, F2, F3, F4, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleNavigate('/pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleNavigate('/reparaciones');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleNavigate('/productos');
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleNavigate('/soporte');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('ingenium_pos_welcome_dismissed', 'true');
    }
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleNavigate = (path: string) => {
    handleClose();
    router.push(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#1e3a5f] via-[#152a45] to-[#0e1d30] border border-blue-500/30 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden animate-scale-up">
        {/* Subtle decorative circuit glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
          title="Cerrar (Esc)"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="text-center relative z-10 flex flex-col items-center">
          {/* Logo Showcase */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2563eb] to-[#f59e0b] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#1e3a5f] shadow-2xl"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-2 border border-amber-400/30">
            <Sparkles size={13} /> Sistema Oficial INGENIUM POS & Tienda Web
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            ¡Hola! Bienvenido a tu Punto de Venta <span className="text-[#f59e0b]">INGENIUM POS</span>
          </h2>
          <p className="text-sm font-semibold text-blue-200 mt-1">
            Vende inteligente, cobra rápido
          </p>
          <p className="text-xs text-gray-300 max-w-lg mt-2 leading-relaxed">
            La plataforma definitiva para control de inventario, ventas rápidas de mostrador y servicio técnico especializado de celulares con tickets en <span className="text-amber-300 font-bold">$ MXN</span>.
          </p>
        </div>

        {/* Quick Launch Cards (with keyboard shortcuts) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 relative z-10">
          {/* Card 1: POS (F1) */}
          <button
            onClick={() => handleNavigate('/pos')}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/10 hover:bg-[#2563eb]/30 border border-blue-400/30 hover:border-blue-400 transition-all text-left group cursor-pointer shadow-lg hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <ShoppingCart size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition">
                  Abrir Punto de Venta
                </h4>
                <kbd className="px-2 py-0.5 text-[10px] font-black bg-white/15 text-white rounded-md border border-white/20">
                  F1
                </kbd>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Cobro rápido en caja, escaneo de código de barras e impresión de tickets.
              </p>
            </div>
          </button>

          {/* Card 2: Reparaciones (F2) */}
          <button
            onClick={() => handleNavigate('/reparaciones')}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/10 hover:bg-amber-500/20 border border-amber-400/30 hover:border-amber-400 transition-all text-left group cursor-pointer shadow-lg hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <Wrench size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                  Registrar Nueva Reparación
                </h4>
                <kbd className="px-2 py-0.5 text-[10px] font-black bg-white/15 text-white rounded-md border border-white/20">
                  F2
                </kbd>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Ingreso de equipos a taller, folios ORD, diagnóstico y patrón de desbloqueo.
              </p>
            </div>
          </button>

          {/* Card 3: Productos (F3) */}
          <button
            onClick={() => handleNavigate('/productos')}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/10 hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-400 transition-all text-left group cursor-pointer shadow-lg hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <Package size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                  Catálogo de Productos
                </h4>
                <kbd className="px-2 py-0.5 text-[10px] font-black bg-white/15 text-white rounded-md border border-white/20">
                  F3
                </kbd>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Gestión de inventario, precios en $ MXN y publicación en tienda web en tiempo real.
              </p>
            </div>
          </button>

          {/* Card 4: Soporte / Chat en Vivo (F4) */}
          <button
            onClick={() => handleNavigate('/soporte')}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/10 hover:bg-purple-500/20 border border-purple-400/30 hover:border-purple-400 transition-all text-left group cursor-pointer shadow-lg hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shrink-0 shadow-md">
              <MessageSquare size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                  Ver Mensajes de Clientes
                </h4>
                <kbd className="px-2 py-0.5 text-[10px] font-black bg-white/15 text-white rounded-md border border-white/20">
                  F4
                </kbd>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                Bandeja en tiempo real conectada con la tienda web y WhatsApp directo.
              </p>
            </div>
          </button>
        </div>

        {/* System Badges */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70 relative z-10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase Cloud Conectado
            </span>
            <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
              <Database size={13} />
              Moneda Oficial: $ MXN
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="rounded bg-white/10 border-white/30 text-blue-600 focus:ring-0 cursor-pointer"
            />
            No volver a mostrar al iniciar
          </label>
        </div>
      </div>
    </div>
  );
}
