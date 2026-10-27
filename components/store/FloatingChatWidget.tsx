'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Send,
  User,
  Phone,
  CheckCheck,
  ExternalLink,
  Sparkles,
  Search,
  Bot,
  RotateCcw,
  Smartphone,
  Wrench,
  HelpCircle,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatConversation, StorefrontCustomer } from '@/types';
import { DEMO_REPAIRS } from '@/lib/mockData';

interface FloatingChatWidgetProps {
  businessPhone?: string;
  businessName?: string;
}

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const COMMON_FAULTS = [
  { id: 'pantalla', label: 'Pantalla / Display roto o sin imagen', icon: '📱' },
  { id: 'bateria', label: 'Batería se descarga rápido o inflada', icon: '🔋' },
  { id: 'carga', label: 'No carga / Centro de carga flojo', icon: '🔌' },
  { id: 'mojado', label: 'Equipo mojado o no enciende', icon: '💧' },
  { id: 'camara', label: 'Cámara no enfoca o cristal estrellado', icon: '📷' },
  { id: 'refaccion', label: 'Cotizar refacción o accesorio', icon: '🧩' },
  { id: 'otro', label: 'Otra falla / Diagnóstico general', icon: '🛠️' },
];

export default function FloatingChatWidget({
  businessPhone = '+52 81 3962 9319',
  businessName = 'INGENIUM MOBILE',
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp_form' | 'pos_chat' | 'rastreo'>('whatsapp_form');

  // WhatsApp Guided Questionnaire States
  const [waName, setWaName] = useState('');
  const [waDevice, setWaDevice] = useState('');
  const [waFault, setWaFault] = useState('Pantalla / Display roto o sin imagen');
  const [waDetail, setWaDetail] = useState('');
  const [waSent, setWaSent] = useState(false);
  const [waTermsAccepted, setWaTermsAccepted] = useState(false);

  // Live POS Chat & Tracking States
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState('');
  const [chatTermsAccepted, setChatTermsAccepted] = useState(false);

  // Form states if identifying for internal chat
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Draggable position states
  const [position, setPosition] = useState<{ x?: number; y?: number }>({});
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPos = localStorage.getItem('ingenium_chat_pos');
      if (savedPos) {
        try {
          setPosition(JSON.parse(savedPos));
        } catch {}
      }
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
      moved: false,
    };
    setIsDragging(true);
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }

    if (typeof window !== 'undefined') {
      const newX = Math.max(10, Math.min(window.innerWidth - 75, dragRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 75, dragRef.current.initialY + dy));
      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (dragRef.current.moved && position.x !== undefined && position.y !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('ingenium_chat_pos', JSON.stringify(position));
    }
  };

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setIsOpen(true);
    setUnreadBadge(0);
  };

  // Load customer info if saved in storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_store_customer');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCustomer(parsed);
          setName(parsed.name || '');
          setPhone(parsed.phone || '');
          if (parsed.name && !waName) setWaName(parsed.name);
        } catch {}
      }

      const savedConv = localStorage.getItem('ingenium_client_chat_conv');
      if (savedConv) {
        try {
          const parsed = JSON.parse(savedConv);
          if (parsed && isValidUUID(parsed.id)) {
            setConversation(parsed);
            loadMessages(parsed.id);
          } else {
            localStorage.removeItem('ingenium_client_chat_conv');
            setConversation(null);
          }
        } catch {
          localStorage.removeItem('ingenium_client_chat_conv');
          setConversation(null);
        }
      } else if (saved) {
        // Si no había conversación en caché pero sí hay cliente guardado, buscar en Supabase si ya tenía chat
        try {
          const parsed = JSON.parse(saved);
          const cleanPhone = (parsed.phone || '').trim();
          const cleanName = (parsed.name || '').trim();
          if (cleanPhone || cleanName) {
            (async () => {
              try {
                let found: ChatConversation | null = null;
                if (cleanPhone) {
                  const { data } = await supabase
                    .from('chat_conversations')
                    .select('*')
                    .eq('client_phone', cleanPhone)
                    .order('last_message_at', { ascending: false })
                    .limit(1);
                  if (data && data.length > 0 && isValidUUID(data[0].id)) {
                    found = data[0];
                  }
                }
                if (!found && cleanName) {
                  const { data } = await supabase
                    .from('chat_conversations')
                    .select('*')
                    .ilike('client_name', cleanName)
                    .order('last_message_at', { ascending: false })
                    .limit(1);
                  if (data && data.length > 0 && isValidUUID(data[0].id)) {
                    found = data[0];
                  }
                }
                if (found) {
                  setConversation(found);
                  localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(found));
                  loadMessages(found.id);
                }
              } catch {}
            })();
          }
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, activeTab]);

  // Real-time listener for POS internal chat messages
  useEffect(() => {
    if (!conversation?.id || !isValidUUID(conversation.id)) return;

    try {
      const channel = supabase
        .channel(`client_chat_${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          payload => {
            const newMsg = payload.new as ChatMessage;
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (!isOpen && newMsg.sender_type !== 'client') {
              setUnreadBadge(b => b + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {}
  }, [conversation?.id, isOpen]);

  const loadMessages = async (convId: string) => {
    if (!isValidUUID(convId)) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch {}
  };

  // Compile and send WhatsApp Message
  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waName.trim() || !waDevice.trim() || !waTermsAccepted) return;

    const compiledMessage =
      `*¡HOLA INGENIUM MOBILE!* 🤖📱\n` +
      `Vengo desde la tienda en línea y solicito atención técnica:\n\n` +
      `👤 *Cliente:* ${waName.trim()}\n` +
      `📱 *Equipo / Modelo:* ${waDevice.trim()}\n` +
      `🔧 *Falla o Servicio:* ${waFault}\n` +
      (waDetail.trim() ? `📝 *Detalle:* ${waDetail.trim()}\n\n` : `\n`) +
      `¿Me podrían apoyar con la cotización estimada y tiempo de reparación? ¡Muchas gracias!`;

    const cleanPhone = businessPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(compiledMessage)}`;
    
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    setWaSent(true);
    setTimeout(() => setWaSent(false), 5000);
  };

  // Tracking functionality
  const handleTrackRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError('');
    setTrackingResult(null);
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;

    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .ilike('order_number', `%${code}%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        setTrackingResult(data[0]);
        return;
      }

      const local = DEMO_REPAIRS.find(r => ((r.folio || (r as any).order_number || '') as string).toUpperCase().includes(code));
      if (local) {
        setTrackingResult(local);
        return;
      }

      setTrackingError('No se encontró ninguna orden con ese folio. Verifica tu ticket.');
    } catch {
      setTrackingError('Error al consultar. Por favor intenta de nuevo.');
    }
  };

  // Start internal chat conversation
  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    const cust: StorefrontCustomer = {
      id: customer?.id || 'cust-' + Date.now(),
      name: cleanName,
      phone: cleanPhone,
      email: `${cleanPhone}@cliente.com`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_store_customer', JSON.stringify(cust));
    }
    setCustomer(cust);

    try {
      // 1. Buscar si ya existe una conversación previa con este número de teléfono o nombre
      let existingConv: ChatConversation | null = null;

      // Buscar por coincidencia directa de teléfono
      const { data: phoneMatches } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('client_phone', cleanPhone)
        .order('last_message_at', { ascending: false })
        .limit(1);

      if (phoneMatches && phoneMatches.length > 0 && isValidUUID(phoneMatches[0].id)) {
        existingConv = phoneMatches[0];
      }

      // Si no se halló por teléfono exacto y tenemos dígitos, buscar por los últimos 7-10 dígitos
      if (!existingConv && digitsOnly.length >= 7) {
        const lastDigits = digitsOnly.slice(-8);
        const { data: digitMatches } = await supabase
          .from('chat_conversations')
          .select('*')
          .ilike('client_phone', `%${lastDigits}%`)
          .order('last_message_at', { ascending: false })
          .limit(1);

        if (digitMatches && digitMatches.length > 0 && isValidUUID(digitMatches[0].id)) {
          existingConv = digitMatches[0];
        }
      }

      // Si aún no se encontró, buscar por nombre exacto o muy similar
      if (!existingConv && cleanName.length >= 3) {
        const { data: nameMatches } = await supabase
          .from('chat_conversations')
          .select('*')
          .ilike('client_name', cleanName)
          .order('last_message_at', { ascending: false })
          .limit(1);

        if (nameMatches && nameMatches.length > 0 && isValidUUID(nameMatches[0].id)) {
          existingConv = nameMatches[0];
        }
      }

      // 2. Si ya existe una conversación previa: REUTILIZARLA (no crear chats duplicados)
      if (existingConv) {
        await supabase
          .from('chat_conversations')
          .update({
            status: 'open',
            client_name: cleanName,
            client_phone: cleanPhone,
          })
          .eq('id', existingConv.id);

        setConversation(existingConv);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(existingConv));
        }

        await loadMessages(existingConv.id);
      } else {
        // 3. Si es un cliente completamente nuevo: crear una nueva conversación
        const { data: conv, error: convErr } = await supabase
          .from('chat_conversations')
          .insert({
            client_name: cleanName,
            client_phone: cleanPhone,
            status: 'open',
            unread_admin_count: 1,
            unread_client_count: 0,
          })
          .select()
          .single();

        if (!convErr && conv && isValidUUID(conv.id)) {
          setConversation(conv);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(conv));
          }

          const welcomeText = `¡Hola ${cleanName.split(' ')[0]}! 👋 Soy el asistente virtual de INGENIUM MOBILE. Un técnico en el Punto de Venta te atenderá en unos momentos.`;
          await supabase.from('chat_messages').insert({
            conversation_id: conv.id,
            sender_name: 'Robot INGENIUM',
            sender_type: 'bot',
            message: welcomeText,
          });

          loadMessages(conv.id);
        }
      }
    } catch (err) {
      console.error('Error al iniciar/vincular conversación:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send message in POS internal chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !conversation?.id || !isValidUUID(conversation.id)) return;

    const text = inputMsg.trim();
    setInputMsg('');

    const tempMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: conversation.id,
      sender_name: customer?.name || 'Cliente',
      sender_type: 'client',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await supabase.from('chat_messages').insert({
        conversation_id: conversation.id,
        sender_name: customer?.name || 'Cliente',
        sender_type: 'client',
        message: text,
      });

      await supabase
        .from('chat_conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_admin_count: ((conversation as any).unread_admin_count || 0) + 1,
        })
        .eq('id', conversation.id);
    } catch {}
  };

  // Position calculations clamped within viewport
  const isCustomPosition = position.x !== undefined && position.y !== undefined;

  const getBubbleStyle = (): React.CSSProperties => {
    if (isCustomPosition) {
      return {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '56px',
        height: '56px',
      };
    }
    return {
      right: '20px',
      bottom: '20px',
      width: '56px',
      height: '56px',
    };
  };

  const getModalStyle = (): React.CSSProperties => {
    if (typeof window === 'undefined') {
      return { right: '20px', bottom: '20px' };
    }
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return {
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '12px',
        margin: '0 auto',
      };
    }
    if (!isCustomPosition) {
      return { right: '20px', bottom: '20px' };
    }
    const modalWidth = Math.min(390, window.innerWidth - 20);
    const modalHeight = 580;

    let left = (position.x ?? 0) - modalWidth + 70;
    let top = (position.y ?? 0) - modalHeight + 20;

    // Viewport clamping
    if (left < 10) left = 10;
    if (left + modalWidth > window.innerWidth - 10) left = window.innerWidth - modalWidth - 10;
    if (top < 10) top = 10;
    if (top + modalHeight > window.innerHeight - 10) top = window.innerHeight - modalHeight - 10;

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  return (
    <>
      {/* CUTE ROBOT CIRCULAR FLOATING BUBBLE (DRAGGABLE) */}
      {!isOpen && (
        <div
          style={getBubbleStyle()}
          className="fixed z-50 select-none touch-none w-14 h-14"
        >
          <div className="relative group w-14 h-14">
            {/* Tooltip flotante amigable */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0d1b2a] text-white text-xs font-bold py-1.5 px-3 rounded-2xl shadow-xl border border-emerald-400/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-1.5">
              <span>¡Hola! Cotiza por WhatsApp</span>
              <span className="text-[10px] text-gray-400 font-normal">(Arrastra para mover)</span>
              <span className="text-emerald-400">🤖💬</span>
            </div>

            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleBubbleClick}
              role="button"
              tabIndex={0}
              aria-label="Abrir Asistente WhatsApp (Arrastrable)"
              style={{
                width: '56px',
                height: '56px',
                minWidth: '56px',
                minHeight: '56px',
                maxWidth: '56px',
                maxHeight: '56px',
                touchAction: 'none',
              }}
              className={`relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#34D399] p-0.5 shadow-2xl shadow-emerald-900/40 hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center border-2 border-white/70 select-none shrink-0 ${
                isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
              }`}
            >
              {/* Anillo de pulso sutil */}
              <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />

              {/* Robot SVG Animado y Cute */}
              <div
                style={{ width: '48px', height: '48px' }}
                className="w-12 h-12 rounded-full bg-gradient-to-b from-[#1e3a5f] to-[#0d1b2a] flex items-center justify-center p-1.5 overflow-hidden pointer-events-none shrink-0"
              >
                <svg
                  style={{ width: '32px', height: '32px' }}
                  className="w-8 h-8 transform group-hover:rotate-6 transition-transform duration-300"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  {/* Antena del Robot con esfera luminosa */}
                  <line x1="32" y1="13" x2="32" y2="5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="32" cy="5" r="3.5" fill="#34D399" className="animate-pulse" />

                  {/* Orejas de audífono */}
                  <rect x="7" y="23" width="5" height="14" rx="2" fill="#F59E0B" />
                  <rect x="52" y="23" width="5" height="14" rx="2" fill="#F59E0B" />

                  {/* Cabeza del Robot */}
                  <rect x="12" y="13" width="40" height="34" rx="10" fill="#1E3A5F" stroke="#38BDF8" strokeWidth="2.2" />

                  {/* Pantalla digital oscura */}
                  <rect x="18" y="20" width="28" height="18" rx="6" fill="#0D1B2A" />

                  {/* Ojos expresivos cyan estilo anime */}
                  <ellipse cx="25" cy="27" rx="3.5" ry="4" fill="#38BDF8" />
                  <circle cx="26" cy="25.5" r="1.2" fill="#FFFFFF" />
                  <ellipse cx="39" cy="27" rx="3.5" ry="4" fill="#38BDF8" />
                  <circle cx="40" cy="25.5" r="1.2" fill="#FFFFFF" />

                  {/* Sonrisa robótica tierna */}
                  <path d="M28 32 Q32 35.5 36 32" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                  {/* Mejillas sonrojadas rosas */}
                  <circle cx="21" cy="31" r="2" fill="#F43F5E" opacity="0.75" />
                  <circle cx="43" cy="31" r="2" fill="#F43F5E" opacity="0.75" />
                </svg>
              </div>

              {/* Mini badge oficial de WhatsApp en la esquina */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#25D366] border-2 border-white flex items-center justify-center shadow-md pointer-events-none">
                <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.777.818 2.796.818 3.179 0 5.765-2.587 5.766-5.766.001-3.182-2.585-5.769-5.766-5.769zm3.393 8.163c-.144.405-.837.774-1.17.822-.312.043-.637.067-1.802-.416-.838-.348-1.465-.898-1.89-1.328l-.022-.022c-.419-.44-1.077-1.285-1.077-2.316 0-1.026.54-1.53.734-1.741.194-.212.423-.264.564-.264.141 0 .283.003.407.009.131.006.304-.05.476.363.177.426.602 1.468.654 1.574.053.106.089.23.018.371-.071.141-.106.23-.212.353-.106.124-.222.277-.318.371-.106.106-.217.221-.093.434.124.212.551.909 1.18 1.469.811.722 1.494.945 1.706 1.051.212.106.336.089.459-.053.124-.141.53-.618.672-.83.141-.212.283-.177.476-.106.195.071 1.237.583 1.449.689.212.106.353.159.407.247.053.088.053.512-.091.917z" />
                </svg>
              </div>

              {/* Indicador de mensaje no leído */}
              {unreadBadge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-bounce border-2 border-white pointer-events-none">
                  {unreadBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASISTENTE MODAL / DIALOG */}
      {isOpen && (
        <div
          style={getModalStyle()}
          className="fixed z-50"
        >
          <div className="w-[92vw] max-w-[390px] h-[580px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slideUp">
          {/* Header Tecnológico */}
          <div className="bg-gradient-to-r from-[#1e3a5f] via-[#162e4c] to-[#075E54] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white/60 flex items-center justify-center shadow">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1e3a5f] animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Asistente INGENIUM 🤖
                </h4>
                <p className="text-[11px] text-emerald-200">Atención Directa por WhatsApp</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={19} />
            </button>
          </div>

          {/* Selector de pestañas */}
          <div className="flex bg-gray-100 p-1 border-b border-gray-200 text-xs font-bold text-gray-600">
            <button
              onClick={() => setActiveTab('whatsapp_form')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'whatsapp_form' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              <Phone size={13} className="text-[#25D366]" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('pos_chat')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pos_chat' ? 'bg-white text-[#2563eb] shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              <MessageSquare size={13} />
              <span>Chat POS</span>
            </button>
            <button
              onClick={() => setActiveTab('rastreo')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'rastreo' ? 'bg-white text-amber-600 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              <Search size={13} />
              <span>Rastreo</span>
            </button>
          </div>

          {/* PESTAÑA 1: CUESTIONARIO GUIADO PARA WHATSAPP */}
          {activeTab === 'whatsapp_form' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50 flex flex-col justify-between">
              <form onSubmit={handleSendWhatsApp} className="space-y-3.5">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-2xl text-xs leading-relaxed flex items-start gap-2">
                  <span className="text-base">🤖</span>
                  <div>
                    <strong className="block font-bold">¡Hola! Te armo tu consulta técnica:</strong>
                    <span className="text-[11px] text-emerald-800">
                      Completa estas breves preguntas y te redirigiré a WhatsApp con todo redactado y listo para enviar.
                    </span>
                  </div>
                </div>

                {/* Pregunta 1: Nombre */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    1. ¿Cuál es tu nombre? *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Ej. Rodrigo Pérez"
                      value={waName}
                      onChange={e => setWaName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-[#25D366] outline-none"
                    />
                  </div>
                </div>

                {/* Pregunta 2: Dispositivo / Modelo */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    2. ¿Qué celular o equipo tienes? *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Smartphone size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Ej. iPhone 13, Samsung S22, Redmi Note 11..."
                      value={waDevice}
                      onChange={e => setWaDevice(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-[#25D366] outline-none"
                    />
                  </div>
                </div>

                {/* Pregunta 3: Falla o Motivo */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    3. ¿Qué problema o falla presenta? *
                  </label>
                  <select
                    value={waFault}
                    onChange={e => setWaFault(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#25D366] outline-none font-medium text-gray-900"
                  >
                    {COMMON_FAULTS.map(f => (
                      <option key={f.id} value={f.label}>
                        {f.icon} {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pregunta 4: Detalle adicional */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    4. Detalle o síntoma adicional (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Se cayó al agua, parpadea la pantalla, no retiene carga..."
                    value={waDetail}
                    onChange={e => setWaDetail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium focus:ring-2 focus:ring-[#25D366] outline-none resize-none"
                  />
                </div>

                {/* Checkbox Obligatorio de Aceptación Legal (PROFECO & LFPDPPP) */}
                <label className="flex items-start gap-2 p-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={waTermsAccepted}
                    onChange={e => setWaTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 shrink-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-600 leading-tight">
                    He leído y acepto los{' '}
                    <Link href="/terminos" target="_blank" className="font-bold text-emerald-700 underline hover:text-emerald-900">
                      Términos y Condiciones
                    </Link>{' '}
                    y el{' '}
                    <Link href="/privacidad" target="_blank" className="font-bold text-emerald-700 underline hover:text-emerald-900">
                      Aviso de Privacidad
                    </Link>.
                  </span>
                </label>

                {/* Botón Principal de Envío a WhatsApp */}
                <button
                  type="submit"
                  disabled={!waName.trim() || !waDevice.trim() || !waTermsAccepted}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.777.818 2.796.818 3.179 0 5.765-2.587 5.766-5.766.001-3.182-2.585-5.769-5.766-5.769zm3.393 8.163c-.144.405-.837.774-1.17.822-.312.043-.637.067-1.802-.416-.838-.348-1.465-.898-1.89-1.328l-.022-.022c-.419-.44-1.077-1.285-1.077-2.316 0-1.026.54-1.53.734-1.741.194-.212.423-.264.564-.264.141 0 .283.003.407.009.131.006.304-.05.476.363.177.426.602 1.468.654 1.574.053.106.089.23.018.371-.071.141-.106.23-.212.353-.106.124-.222.277-.318.371-.106.106-.217.221-.093.434.124.212.551.909 1.18 1.469.811.722 1.494.945 1.706 1.051.212.106.336.089.459-.053.124-.141.53-.618.672-.83.141-.212.283-.177.476-.106.195.071 1.237.583 1.449.689.212.106.353.159.407.247.053.088.053.512-.091.917z" />
                  </svg>
                  <span>Enviar Consulta a WhatsApp Oficial 🚀</span>
                </button>
              </form>

              {waSent && (
                <p className="text-center text-[11px] font-bold text-emerald-700 bg-emerald-100 p-2 rounded-xl mt-2 animate-bounce">
                  ✓ ¡Abriendo WhatsApp con tu mensaje recopilado!
                </p>
              )}

              <p className="text-center text-[10px] text-gray-400 mt-2">
                Atención oficial: +52 81 3962 9319 · Sombrerete, Zacatecas, México.
              </p>
            </div>
          )}

          {/* PESTAÑA 2: CHAT INTERNO EN VIVO CON EL POS */}
          {activeTab === 'pos_chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
              {!conversation ? (
                /* Identificación para chat interno */
                <div className="flex-1 p-5 flex flex-col justify-center">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                      <MessageSquare size={24} />
                    </div>
                    <h5 className="font-bold text-gray-800 text-sm">Chat en Vivo con Mostrador POS</h5>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Tus mensajes llegarán directamente a la pantalla del técnico en la tienda.
                    </p>
                  </div>

                  <form onSubmit={startConversation} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Tu nombre *"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp / Teléfono *"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />

                    {/* Checkbox Obligatorio de Aceptación Legal */}
                    <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={chatTermsAccepted}
                        onChange={e => setChatTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shrink-0 cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-600 leading-tight">
                        He leído y acepto los{' '}
                        <Link href="/terminos" target="_blank" className="font-bold text-blue-600 underline hover:text-blue-800">
                          Términos y Condiciones
                        </Link>{' '}
                        y el{' '}
                        <Link href="/privacidad" target="_blank" className="font-bold text-blue-600 underline hover:text-blue-800">
                          Aviso de Privacidad
                        </Link>.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading || !name.trim() || !phone.trim() || !chatTermsAccepted}
                      className="w-full py-2.5 bg-[#1e3a5f] hover:bg-[#2563eb] text-white font-bold rounded-xl text-xs transition shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Conectando...' : 'Iniciar Conversación'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Ventana de mensajes activos */
                <>
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                    {messages.map(m => {
                      const isMe = m.sender_type === 'client';
                      const isBot = m.sender_type === 'bot';
                      return (
                        <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-gray-400 px-1 font-semibold">
                            {isBot ? '🤖 Robot' : isMe ? 'Tú' : m.sender_name}
                          </span>
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs shadow-xs leading-relaxed whitespace-pre-line ${
                              isMe
                                ? 'bg-[#2563eb] text-white rounded-br-none'
                                : isBot
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-bl-none'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}
                          >
                            {m.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Escribe tu mensaje al técnico..."
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                    <button
                      type="submit"
                      disabled={!inputMsg.trim()}
                      className="p-2 bg-[#2563eb] text-white rounded-xl disabled:opacity-40 transition"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* PESTAÑA 3: RASTREO DE ORDEN DE REPARACIÓN */}
          {activeTab === 'rastreo' && (
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Search size={22} />
                  </div>
                  <h5 className="font-bold text-gray-800 text-sm">Consultar Estado de Reparación</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Ingresa el número de folio ORD que aparece en tu ticket impreso.
                  </p>
                </div>

                <form onSubmit={handleTrackRepair} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Ej. ORD-001 o tu nombre..."
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer"
                  >
                    Buscar Estado de mi Equipo
                  </button>
                </form>

                {trackingError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    ⚠️ {trackingError}
                  </p>
                )}

                {trackingResult && (
                  <div className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-mono font-bold text-[#1e3a5f]">
                        {trackingResult.folio || trackingResult.order_number || 'ORD-INFO'}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase">
                        {trackingResult.status}
                      </span>
                    </div>
                    <p className="text-gray-700"><strong>Equipo:</strong> {trackingResult.device_model || 'Dispositivo'}</p>
                    <p className="text-gray-700"><strong>Falla:</strong> {trackingResult.issue_reported || trackingResult.issue_description || 'En diagnóstico'}</p>
                    {trackingResult.estimated_cost && (
                      <p className="text-emerald-700 font-bold">
                        Costo Estimado: ${trackingResult.estimated_cost} MXN
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t text-center">
                <a
                  href={`https://wa.me/528139629319?text=${encodeURIComponent('Hola INGENIUM MOBILE, quiero consultar el estado de mi orden ORD.')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center justify-center gap-1"
                >
                  ¿Dudas? Preguntar a un técnico por WhatsApp &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}
