'use client';
import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

export default function OfflineNoticeModal() {
  const [isOffline, setIsOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setReconnected(true);
      setTimeout(() => {
        setIsOffline(false);
        setReconnected(false);
      }, 1500);
    };

    const handleOffline = () => {
      setReconnected(false);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificación periódica ligera por si el evento no dispara en algunos navegadores
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        if (!navigator.onLine && !isOffline) {
          setIsOffline(true);
        } else if (navigator.onLine && isOffline && !reconnected) {
          handleOnline();
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline, reconnected]);

  const handleManualCheck = () => {
    setChecking(true);
    if (typeof window !== 'undefined') {
      if (navigator.onLine) {
        setReconnected(true);
        setTimeout(() => {
          setIsOffline(false);
          setReconnected(false);
          setChecking(false);
        }, 1200);
      } else {
        setTimeout(() => {
          setChecking(false);
        }, 800);
      }
    }
  };

  if (!isOffline && !reconnected) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0d1b2a]/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#112233] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {reconnected ? (
          /* Estado: Conexión Recuperada */
          <div className="py-6 space-y-4 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Wifi size={40} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">¡Conexión Restablecida!</h3>
              <p className="text-xs text-emerald-300 mt-1">
                La señal ha vuelto. Reanudando tu experiencia en INGENIUM...
              </p>
            </div>
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full overflow-hidden mt-4">
              <div className="bg-emerald-400 h-full w-full animate-pulse" />
            </div>
          </div>
        ) : (
          /* Estado: Sin Conexión */
          <div className="space-y-5">
            {/* Robot buscando señal animado */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Ondas de radar de señal perdida */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-red-500/40 animate-pulse" />

              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-[#0d1b2a] border-2 border-amber-400/60 flex items-center justify-center shadow-xl">
                {/* SVG Robot preocupado sin Wi-Fi */}
                <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
                  {/* Antena con señal cortada */}
                  <line x1="32" y1="12" x2="32" y2="4" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="32" cy="4" r="3" fill="#EF4444" className="animate-ping" />
                  
                  {/* Cabeza */}
                  <rect x="14" y="14" width="36" height="28" rx="8" fill="#1E3A5F" stroke="#60A5FA" strokeWidth="2" />
                  
                  {/* Orejas */}
                  <rect x="8" y="22" width="6" height="12" rx="2" fill="#F59E0B" />
                  <rect x="50" y="22" width="6" height="12" rx="2" fill="#F59E0B" />
                  
                  {/* Pantalla / Ojos */}
                  <rect x="20" y="20" width="24" height="16" rx="4" fill="#0D1B2A" />
                  <circle cx="26" cy="28" r="2.5" fill="#EF4444" />
                  <circle cx="38" cy="28" r="2.5" fill="#EF4444" />
                  
                  {/* Boquita confundida */}
                  <path d="M28 33 Q32 30 36 33" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </div>

              <div className="absolute -bottom-1 -right-1 p-1 bg-red-600 rounded-full border-2 border-[#112233]">
                <WifiOff size={14} className="text-white" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 mb-2">
                <AlertCircle size={13} />
                Señal de Red Desconectada
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">
                ¡Sin Acceso a Internet!
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed max-w-xs mx-auto">
                No podemos conectar con el servidor. Revisa tu conexión Wi-Fi o datos móviles.
              </p>
            </div>

            {/* Radar status */}
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-blue-200 flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
              <span>Esperando que regrese tu conexión a Internet...</span>
            </div>

            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full py-3 bg-gradient-to-r from-[#2563eb] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Verificando señal...' : 'Reintentar Conexión Ahora'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
