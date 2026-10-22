'use client';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function AnimatedIntroLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('ingenium_intro_loader_shown');
      if (shown) {
        setVisible(false);
        return;
      }
    }

    // Animación de progreso
    const timer1 = setTimeout(() => setProgress(45), 250);
    const timer2 = setTimeout(() => setProgress(80), 650);
    const timer3 = setTimeout(() => setProgress(100), 1050);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1300);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ingenium_intro_loader_shown', 'true');
      }
    }, 1750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0d1b2a] text-white transition-opacity duration-500 selection:bg-transparent ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col items-center text-center px-4 max-w-sm">
        {/* Animated Brand Logo with Spinning Ring */}
        <div className="relative mb-6">
          {/* Glowing rotating ring */}
          <div className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-400/50 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-amber-400 blur-md opacity-70 animate-pulse" />
          
          <img
            src="/images/logo.jpg"
            alt="INGENIUM MOBILE"
            className="relative w-24 h-24 rounded-full object-cover border-2 border-white/40 shadow-2xl"
          />

          {/* Cute mini robot badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-[#0d1b2a] flex items-center justify-center shadow-lg animate-bounce">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="7" width="14" height="12" rx="3" fill="#065f46" />
              <line x1="12" y1="3" x2="12" y2="7" />
              <circle cx="12" cy="2.5" r="1.5" fill="#34d399" />
              <circle cx="9" cy="11.5" r="1.5" fill="#34d399" />
              <circle cx="15" cy="11.5" r="1.5" fill="#34d399" />
              <path d="M9 15 Q12 17 15 15" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Brand Text */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/10 mb-2">
          <Sparkles size={12} className="text-amber-400" />
          Tecnología & Reparaciones
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white mb-1">
          INGENIUM MOBILE SHOP
        </h1>
        <p className="text-xs text-blue-200/80 mb-6">
          Vende inteligente · Cobra rápido
        </p>

        {/* Progress bar */}
        <div className="w-64 bg-white/10 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-64 text-[10px] text-gray-400 font-mono mt-2">
          <span>Iniciando catálogo...</span>
          <span className="text-amber-400 font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
