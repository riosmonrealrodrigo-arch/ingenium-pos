'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Bell, X, ArrowRight, Volume2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PendingToast {
  id: string;
  clientName: string;
  message: string;
  conversationId: string;
  timestamp: number;
}

// Generador de sonido de campana digital mediante Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Primer tono (campana aguda 784 Hz - Sol5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Segundo tono (campana armónica 1046.5 Hz - Do6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('No se pudo reproducir el tono de audio:', err);
  }
};

export default function AdminNotificationSystem() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isDemo } = useAuth();
  const [toast, setToast] = useState<PendingToast | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // No activar si el usuario está en la tienda pública o páginas legales
  const isPublicStorefront =
    pathname === '/tienda' ||
    pathname.startsWith('/tienda') ||
    pathname === '/privacidad' ||
    pathname === '/terminos' ||
    pathname === '/garantias' ||
    pathname === '/login';

  // Verificar estado del permiso del navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default' && !isPublicStorefront) {
        // Mostrar aviso sutil para que el dueño active las notificaciones
        const dismissed = sessionStorage.getItem('ingenium_notif_banner_dismissed');
        if (!dismissed) {
          setShowPromptBanner(true);
        }
      }
    }
  }, [isPublicStorefront]);

  // Solicitar permiso de notificaciones al navegador
  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        setShowPromptBanner(false);
        if (res === 'granted') {
          playNotificationChime();
          new Notification('🔔 ¡Notificaciones Activadas!', {
            body: 'Recibirás avisos sonoros y en pantalla cuando los clientes envíen mensajes a INGENIUM MOBILE.',
            icon: '/images/logo.jpg',
          });
        }
      } catch (err) {
        console.warn('Error al solicitar permiso:', err);
      }
    }
  };

  // Probar sonido y notificación
  const testNotification = () => {
    playNotificationChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('💬 Mensaje de Prueba: Cliente Demo', {
        body: 'Hola, ¿tienen disponibilidad de display para iPhone 12?',
        icon: '/images/logo.jpg',
      });
    }
    setToast({
      id: 'test-' + Date.now(),
      clientName: 'Cliente Ejemplo (Prueba)',
      message: 'Hola, ¿tienen pantalla para iPhone 12 en existencia?',
      conversationId: '',
      timestamp: Date.now(),
    });
  };

  // Escuchar mensajes entrantes en Supabase Realtime
  useEffect(() => {
    if (isPublicStorefront) return;

    try {
      const channel = supabase
        .channel('admin_global_notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          async payload => {
            const newMsg = payload.new as any;
            if (!newMsg || newMsg.sender_type !== 'client') return;

            // 1. Reproducir sonido de campana inmediatamente
            playNotificationChime();

            // 2. Vibrar dispositivo móvil si está disponible
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([250, 100, 250]);
              } catch {}
            }

            // 3. Obtener nombre del cliente de la conversación
            let clientName = 'Cliente de la Tienda';
            try {
              if (newMsg.conversation_id) {
                const { data: conv } = await supabase
                  .from('chat_conversations')
                  .select('client_name')
                  .eq('id', newMsg.conversation_id)
                  .single();
                if (conv?.client_name) {
                  clientName = conv.client_name;
                }
              }
            } catch {
              // fallback
            }

            // 4. Disparar notificación nativa del navegador
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const notif = new Notification(`💬 Mensaje de ${clientName}`, {
                  body: newMsg.message || 'Nuevo mensaje recibido',
                  icon: '/images/logo.jpg',
                  tag: `chat-${newMsg.conversation_id || Date.now()}`,
                });

                notif.onclick = () => {
                  window.focus();
                  router.push(`/soporte${newMsg.conversation_id ? `?convId=${newMsg.conversation_id}` : ''}`);
                };
              } catch (err) {
                console.warn('Error al mostrar notificación nativa:', err);
              }
            }

            // 5. Mostrar Toast interactivo en pantalla
            setToast({
              id: newMsg.id || String(Date.now()),
              clientName,
              message: newMsg.message || '',
              conversationId: newMsg.conversation_id || '',
              timestamp: Date.now(),
            });

            // Disparar evento para que otras partes de la app refresquen conteos
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ingenium_client_message_received', { detail: newMsg }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Error en listener de notificaciones:', err);
    }
  }, [isPublicStorefront, router]);

  // Auto-ocultar toast después de 12 segundos
  useEffect(() => {
    if (toast) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 12000);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toast]);

  if (isPublicStorefront) return null;

  return (
    <>
      {/* Banner flotante discreto para solicitar permiso la primera vez */}
      {showPromptBanner && permission === 'default' && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white p-3.5 rounded-2xl shadow-2xl border border-white/20 animate-fade-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl shrink-0 text-amber-300">
              <Bell size={18} className="animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">¿Activar alertas de clientes?</p>
              <p className="text-[10px] text-blue-100 leading-tight mt-0.5">
                Recibe sonido y notificación en tu teléfono/PC cuando te manden mensaje.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#1e3a5f] font-black rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Activar
            </button>
            <button
              onClick={() => {
                setShowPromptBanner(false);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('ingenium_notif_banner_dismissed', '1');
                }
              }}
              className="p-1 text-white/60 hover:text-white rounded-lg cursor-pointer"
              title="Ignorar por ahora"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Toast Interactivo Flotante de Nuevo Mensaje de Cliente */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-[92%] sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#2563eb] overflow-hidden animate-slide-up">
          <div className="bg-[#1e3a5f] px-3.5 py-2.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-black tracking-wide uppercase text-amber-300 flex items-center gap-1">
                <MessageSquare size={12} /> Nuevo Mensaje de Cliente
              </span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-3.5 space-y-2">
            <div>
              <p className="text-xs font-black text-gray-900">{toast.clientName}</p>
              <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed bg-gray-50 p-2 rounded-xl border border-gray-100 italic">
                "{toast.message}"
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setToast(null);
                  router.push(`/soporte${toast.conversationId ? `?convId=${toast.conversationId}` : ''}`);
                }}
                className="flex-1 py-2 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Responder Ahora</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => setToast(null)}
                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
