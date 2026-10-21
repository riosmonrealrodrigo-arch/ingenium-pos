'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Phone, CheckCheck, ExternalLink, ShieldCheck, Sparkles, Wrench, Search, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChatMessage, ChatConversation, StorefrontCustomer } from '@/types';
import { DEMO_MESSAGES, DEMO_REPAIRS } from '@/lib/mockData';

interface FloatingChatWidgetProps {
  businessPhone?: string;
  businessName?: string;
}

export default function FloatingChatWidget({
  businessPhone = '+502 5555-0199',
  businessName = 'INGENIUM MÓVIL',
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(0);

  // Form states if not identified
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load customer and existing conversation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_store_customer');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCustomer(parsed);
          setName(parsed.name);
          setPhone(parsed.phone);
        } catch {}
      }

      const savedConv = localStorage.getItem('ingenium_client_chat_conv');
      if (savedConv) {
        try {
          const parsed = JSON.parse(savedConv);
          setConversation(parsed);
          loadMessages(parsed.id);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Real-time listener for customer
  useEffect(() => {
    if (!conversation) return;

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
  }, [conversation, isOpen]);

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        const local = localStorage.getItem(`ingenium_chat_msgs_${convId}`);
        if (local) {
          setMessages(JSON.parse(local));
        } else if (DEMO_MESSAGES[convId]) {
          setMessages(DEMO_MESSAGES[convId]);
        }
      } else {
        setMessages(data);
      }
    } catch {
      const local = localStorage.getItem(`ingenium_chat_msgs_${convId}`);
      if (local) setMessages(JSON.parse(local));
    }
  };

  const initBotConversation = (convId: string, clientName: string) => {
    const welcomeMsg: ChatMessage = {
      id: 'bot-welcome-' + Date.now(),
      conversation_id: convId,
      sender_type: 'bot',
      sender_name: 'Asistente Virtual INGENIUM',
      message: `¡Hola ${clientName}! 👋 Bienvenido a ${businessName}. ¿En qué podemos ayudarte hoy? Un asesor humano también te responderá en breve si lo requieres.`,
      created_at: new Date().toISOString(),
    };
    return [welcomeMsg];
  };

  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newCust: StorefrontCustomer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: `${phone.trim()}@cliente.com`,
    };

    setCustomer(newCust);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_store_customer', JSON.stringify(newCust));
    }

    setLoading(true);
    const convId = 'conv-' + Date.now();
    const newConv: ChatConversation = {
      id: convId,
      business_id: 'demo-biz-1',
      client_name: newCust.name,
      client_phone: newCust.phone,
      client_email: newCust.email,
      status: 'open',
      unread_admin_count: 1,
      unread_client_count: 0,
      last_message: 'Inició chat con asistente virtual',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          client_name: newCust.name,
          client_phone: newCust.phone,
          client_email: newCust.email,
          status: 'open',
        })
        .select()
        .single();

      if (data && !error) {
        setConversation(data);
        localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(data));
      } else {
        setConversation(newConv);
        localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(newConv));
      }
    } catch {
      setConversation(newConv);
      localStorage.setItem('ingenium_client_chat_conv', JSON.stringify(newConv));
    }

    const initialMsgs = initBotConversation(convId, newCust.name);
    setMessages(initialMsgs);
    localStorage.setItem(`ingenium_chat_msgs_${convId}`, JSON.stringify(initialMsgs));
    setLoading(false);
  };

  const handleQuickBotAction = async (option: 'reparacion' | 'cotizar' | 'humano') => {
    if (!conversation || !customer) return;

    let userText = '';
    let botReply = '';

    if (option === 'reparacion') {
      userText = '🔍 Consultar estado de una reparación';
      botReply = 'Por favor escribe tu número de folio (ej. ORD-1001) o tu número de teléfono para buscar el diagnóstico y avance de tu dispositivo en el taller.';
    } else if (option === 'cotizar') {
      userText = '📱 Cotizar un repuesto o pantalla';
      botReply = 'Escríbenos la marca y modelo exacto de tu celular (ej. iPhone 13 Pro o Samsung A54). Contamos con pantallas OLED originales, baterías y accesorios listos para entrega.';
    } else {
      userText = '👤 Quiero hablar con un asesor técnico';
      botReply = '¡Entendido! Hemos alertado al personal del taller en el POS de escritorio. Tu consulta está en cola prioritaria. También puedes tocar el botón de WhatsApp arriba si prefieres.';
    }

    await appendMessage(userText, 'client', customer.name);

    setTimeout(async () => {
      await appendMessage(botReply, 'bot', 'Asistente Virtual INGENIUM');
    }, 600);
  };

  const appendMessage = async (text: string, senderType: 'client' | 'admin' | 'bot', senderName: string) => {
    if (!conversation) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      conversation_id: conversation.id,
      sender_type: senderType,
      sender_name: senderName,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev, newMsg];
      localStorage.setItem(`ingenium_chat_msgs_${conversation.id}`, JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('chat_messages').insert({
        conversation_id: conversation.id,
        sender_type: senderType,
        sender_name: senderName,
        message: text,
      });

      await supabase
        .from('chat_conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_admin_count: senderType === 'client' ? (conversation.unread_admin_count || 0) + 1 : 0,
        })
        .eq('id', conversation.id);
    } catch {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !conversation || !customer) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    await appendMessage(userText, 'client', customer.name);

    // Auto bot logic if user is searching for a repair order
    const upperText = userText.toUpperCase();
    if (upperText.includes('ORD-') || upperText.match(/\d{8,10}/)) {
      setTimeout(async () => {
        // Search in DEMO_REPAIRS or Supabase
        const found = DEMO_REPAIRS.find(
          r => r.folio.toUpperCase() === upperText || r.client_phone.includes(userText)
        );

        if (found) {
          const statusLabels: Record<string, string> = {
            recibido: '🟡 Recibido en recepción',
            en_diagnostico: '🔍 En diagnóstico en mesa de trabajo',
            esperando_repuesto: '⏳ Esperando pieza o repuesto en camino',
            listo_entrega: '🟢 ¡LISTO PARA ENTREGA! Puedes pasar a recogerlo.',
            entregado: '✅ Entregado al cliente con garantía',
          };

          const reply = `📱 *Información de Orden ${found.folio}:*\n• Dispositivo: ${found.device_brand} ${found.device_model}\n• Estado actual: ${statusLabels[found.status] || found.status}\n• Falla: ${found.issue_reported}\n• Diagnóstico: ${found.technician_diagnosis || 'En revisión'}\n• Saldo pendiente: Q ${(found.estimated_cost - found.advance_payment).toFixed(2)}`;
          await appendMessage(reply, 'bot', 'Sistema de Taller INGENIUM');
        } else {
          await appendMessage('No encontramos una orden con ese folio exacto en el sistema. Un técnico humano revisará tus datos en el POS y te responderá en breve.', 'bot', 'Asistente Virtual INGENIUM');
        }
      }, 800);
    }
  };

  const whatsappUrl = `https://wa.me/${businessPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hola ${businessName}, estoy en su catálogo online y requiero atención técnica.`
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadBadge(0);
          }}
          className="relative flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-[#128C7E] text-white font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition group border-2 border-white/40"
        >
          <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-ping" />
          <MessageSquare size={19} />
          <span className="text-sm font-semibold tracking-wide">WhatsApp / Asistente Online</span>
          {unreadBadge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-black flex items-center justify-center animate-pulse border-2 border-white">
              {unreadBadge}
            </span>
          )}
        </button>
      )}

      {/* WhatsApp Style Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slide-up">
          {/* Header */}
          <div className="bg-[#075E54] p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-[#075E54] font-black flex items-center justify-center text-sm shadow">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#075E54]"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  {businessName}
                  <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.2 rounded font-mono">BOT & POS</span>
                </h4>
                <p className="text-[11px] text-emerald-200">En línea · Respuesta inmediata</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir en WhatsApp Web / App"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!conversation ? (
            /* Express ID Form */
            <div className="flex-1 p-6 flex flex-col justify-center bg-gray-50/50">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                  <Bot size={26} />
                </div>
                <h5 className="font-bold text-gray-800 text-base">Asistente Virtual & Soporte POS</h5>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa tus datos una sola vez para consultar reparaciones, cotizar repuestos o chatear con un técnico.
                </p>
              </div>

              <form onSubmit={startConversation} className="space-y-3.5">
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Tu nombre completo *"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone size={15} />
                    </span>
                    <input
                      type="tel"
                      placeholder="WhatsApp / Teléfono *"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <MessageSquare size={15} />
                  Empezar a Chatear
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-center gap-1"
                >
                  O escríbenos a WhatsApp Directo &rarr;
                </a>
              </div>
            </div>
          ) : (
            /* Active Messages Window */
            <>
              {/* WhatsApp background pattern style */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#E5DDD5]/40 text-xs">
                {/* Bot Quick Option Pills */}
                <div className="p-3 bg-white/90 backdrop-blur-xs rounded-2xl border border-emerald-100 shadow-xs mb-2">
                  <p className="text-[11px] font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" /> Opciones rápidas de atención:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleQuickBotAction('reparacion')}
                      className="text-left px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#075E54] font-semibold rounded-xl text-[11px] transition flex items-center gap-1.5 border border-emerald-200"
                    >
                      <Search size={12} /> 1. Consultar estado de reparación
                    </button>
                    <button
                      onClick={() => handleQuickBotAction('cotizar')}
                      className="text-left px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-xl text-[11px] transition flex items-center gap-1.5 border border-blue-200"
                    >
                      <Sparkles size={12} /> 2. Cotizar repuesto o pantalla
                    </button>
                    <button
                      onClick={() => handleQuickBotAction('humano')}
                      className="text-left px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-xl text-[11px] transition flex items-center gap-1.5 border border-amber-200"
                    >
                      <User size={12} /> 3. Hablar con soporte técnico humano
                    </button>
                  </div>
                </div>

                {messages.map(m => {
                  const isMe = m.sender_type === 'client';
                  const isBot = m.sender_type === 'bot';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-gray-500 mb-0.5 px-1 font-semibold flex items-center gap-1">
                        {isBot ? <Bot size={11} className="text-emerald-600" /> : null}
                        {isMe ? 'Tú' : m.sender_name}
                      </span>
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-xs leading-relaxed whitespace-pre-line ${
                          isMe
                            ? 'bg-[#E7FFDB] text-gray-900 rounded-br-none border border-emerald-200'
                            : isBot
                            ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            : 'bg-[#1e3a5f] text-white rounded-bl-none shadow-sm'
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-0.5 px-1 flex items-center gap-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <CheckCheck size={12} className="text-emerald-600" />}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu mensaje o número de orden..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs outline-none focus:border-emerald-600 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="p-2.5 bg-[#075E54] hover:bg-[#128C7E] text-white rounded-full disabled:opacity-40 transition shadow-sm"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
