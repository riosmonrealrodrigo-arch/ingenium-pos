'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChatConversation, ChatMessage } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Mail,
  ExternalLink,
  CheckCheck,
  Search,
  RefreshCw,
  Sparkles,
  Bot
} from 'lucide-react';

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export default function SoportePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedConvRef = useRef<ChatConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync ref with selectedConv state
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  // Audio cue for incoming messages
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Load conversations from Supabase
  const loadConversations = async (autoSelect = false) => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error al consultar chat_conversations:', error);
        return;
      }

      const validList = (data || []).filter(c => isValidUUID(c.id));
      setConversations(validList);

      const current = selectedConvRef.current;
      if (!current || !isValidUUID(current.id) || autoSelect) {
        if (validList.length > 0) {
          setSelectedConv(validList[0]);
        }
      } else {
        const found = validList.find(c => c.id === current.id);
        if (found) {
          setSelectedConv(found);
        } else if (validList.length > 0) {
          setSelectedConv(validList[0]);
        }
      }
    } catch (err) {
      console.error('Excepción en loadConversations:', err);
    } finally {
      setIsLoadingConvs(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations(true);
  }, []);

  // Supabase Realtime Listener (Registered once)
  useEffect(() => {
    try {
      const channel = supabase
        .channel('admin_soporte_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'chat_conversations' },
          () => {
            loadConversations();
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          payload => {
            const newMsg = payload.new as ChatMessage;
            const currentSelected = selectedConvRef.current;

            if (newMsg.sender_type === 'client') {
              playChime();
            }

            if (currentSelected && newMsg.conversation_id === currentSelected.id) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                // If replacing an optimistic message
                const tempMatch = prev.find(
                  m => m.id.startsWith('staff-temp-') && m.sender_type === newMsg.sender_type && m.message === newMsg.message
                );
                if (tempMatch) {
                  return prev.map(m => m.id === tempMatch.id ? newMsg : m);
                }
                return [...prev, newMsg];
              });
            }

            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Error en suscripción realtime de soporte:', err);
    }
  }, []);

  // Load messages whenever selected conversation changes
  const loadMessages = async (convId: string) => {
    if (!convId || !isValidUUID(convId)) {
      setMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error cargando mensajes:', error);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (selectedConv?.id) {
      loadMessages(selectedConv.id);
    } else {
      setMessages([]);
    }
  }, [selectedConv?.id]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || isSending) return;

    if (!isValidUUID(selectedConv.id)) {
      alert('La conversación seleccionada no cuenta con un identificador válido.');
      return;
    }

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    const staffName = profile?.name ? `${profile.name} (Soporte POS)` : 'Asesor INGENIUM POS';
    const tempId = 'staff-temp-' + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: selectedConv.id,
      sender_type: 'admin',
      sender_name: staffName,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConv.id,
          sender_type: 'admin',
          sender_name: staffName,
          message: text,
        })
        .select()
        .single();

      if (error) {
        console.error('Error al insertar mensaje de admin:', error);
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }

      await supabase
        .from('chat_conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_admin_count: 0,
        })
        .eq('id', selectedConv.id);

      loadConversations();
    } catch (err) {
      console.error('Error enviando mensaje admin:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = async (conv: ChatConversation) => {
    setSelectedConv(conv);
    if ((conv.unread_admin_count || 0) > 0) {
      try {
        await supabase
          .from('chat_conversations')
          .update({ unread_admin_count: 0 })
          .eq('id', conv.id);
      } catch {}
    }
  };

  const createTestConversation = async () => {
    setIsRefreshing(true);
    try {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const testName = `Cliente Web ${randNum}`;
      const { data: conv, error: convErr } = await supabase
        .from('chat_conversations')
        .insert({
          client_name: testName,
          client_phone: '+528139629319',
          client_email: `cliente${randNum}@gmail.com`,
          status: 'open',
          unread_admin_count: 1,
          last_message: 'Hola! Necesito informes sobre cambio de pantalla.',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (conv && !convErr) {
        await supabase.from('chat_messages').insert({
          conversation_id: conv.id,
          sender_type: 'client',
          sender_name: testName,
          message: 'Hola! Necesito informes sobre cambio de pantalla para iPhone.',
        });

        await loadConversations(true);
      }
    } catch (err) {
      console.error('Error creando conversación de prueba:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    (c.client_name || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.client_phone || '').includes(filterSearch) ||
    (c.last_message || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return '#';
    const clean = phone.replace(/\D/g, '');
    const full = clean.startsWith('52') ? clean : '52' + clean;
    return `https://wa.me/${full}?text=${encodeURIComponent('Hola! Te saluda el equipo de INGENIUM MÓVIL con respecto a tu consulta en la tienda en línea.')}`;
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col pb-20 lg:pb-0 h-screen overflow-hidden">
        <Header title="Soporte y Mensajes de Clientes en Vivo" />

        <div className="flex-1 flex overflow-hidden p-4 lg:p-6 gap-6 max-w-7xl mx-auto w-full">
          {/* Conversation List Panel */}
          <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {/* Search and Action Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#2563eb]" />
                  <h2 className="font-bold text-sm text-gray-800">Mensajes de la Tienda</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsRefreshing(true);
                      loadConversations();
                    }}
                    title="Actualizar lista"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#2563eb] hover:bg-blue-50 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#2563eb]' : ''} />
                  </button>
                  <span className="text-[11px] font-bold bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-full">
                    {conversations.length} activas
                  </span>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por cliente o teléfono..."
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {isLoadingConvs ? (
                <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={20} className="animate-spin text-blue-500" />
                  <span>Sincronizando con Supabase...</span>
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-3">
                  <MessageSquare size={32} className="text-gray-300" />
                  <p>No hay mensajes en línea todavía.</p>
                  <button
                    onClick={createTestConversation}
                    disabled={isRefreshing}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563eb] font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    Crear Mensaje de Prueba
                  </button>
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const isSelected = selectedConv?.id === conv.id;
                  const hasUnread = (conv.unread_admin_count || 0) > 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 border-l-4 border-[#2563eb]' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white font-bold flex items-center justify-center text-xs">
                          {(conv.client_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        {hasUnread && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-xs text-gray-900 truncate">
                            {conv.client_name}
                          </h4>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(conv.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 truncate mb-1">
                          {conv.last_message || 'Sin mensajes recientes'}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          {conv.client_phone && <span>📱 {conv.client_phone}</span>}
                          {hasUnread && (
                            <span className="ml-auto bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                              Nuevo
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation Panel */}
          {selectedConv ? (
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              {/* Header with Client Info & WhatsApp Action */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-[#1e3a5f] font-black flex items-center justify-center text-sm shadow">
                    {(selectedConv.client_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      {selectedConv.client_name}
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Cliente Web en Vivo
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {selectedConv.client_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" /> {selectedConv.client_phone}
                        </span>
                      )}
                      {selectedConv.client_email && (
                        <span className="hidden sm:flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" /> {selectedConv.client_email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConv.client_phone && (
                    <a
                      href={getWhatsAppLink(selectedConv.client_phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      WhatsApp Directo (+52)
                    </a>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4 bg-gray-50/70">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    No hay mensajes en esta conversación aún. Escribe el primer mensaje abajo.
                  </div>
                ) : (
                  messages.map(m => {
                    const isStaff = m.sender_type === 'admin';
                    const isBot = m.sender_type === 'bot';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-gray-400 mb-0.5 px-1 font-semibold flex items-center gap-1">
                          {isBot ? <Bot size={11} className="text-emerald-600" /> : null}
                          {isStaff ? 'Tú (Soporte POS)' : m.sender_name}
                        </span>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed whitespace-pre-line ${
                            isStaff
                              ? 'bg-[#1e3a5f] text-white rounded-br-none'
                              : isBot
                              ? 'bg-amber-50 text-gray-800 border border-amber-200 rounded-bl-none'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          {m.message}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isStaff && <CheckCheck size={12} className="text-blue-400" />}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-gray-100 flex items-center gap-3">
                <input
                  type="text"
                  placeholder={`Responder a ${selectedConv.client_name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  Enviar al Cliente
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare size={48} className="text-gray-300 mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">Selecciona una conversación</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Atiende a tus clientes en línea directamente desde tu panel de POS. Cuando un cliente escriba en la tienda web, aparecerá aquí al instante.
              </p>
              <button
                onClick={createTestConversation}
                disabled={isRefreshing}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                Crear Mensaje de Prueba
              </button>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
