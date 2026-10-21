'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChatConversation, ChatMessage } from '@/types';
import { DEMO_CONVERSATIONS, DEMO_MESSAGES } from '@/lib/mockData';
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
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

export default function SoportePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<ChatConversation[]>(DEMO_CONVERSATIONS);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(DEMO_CONVERSATIONS[0] || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  // Load conversations from Supabase or localStorage
  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to local / demo
        const local = localStorage.getItem('ingenium_admin_conversations');
        if (local) {
          const parsed = JSON.parse(local);
          setConversations(parsed);
          if (!selectedConv && parsed.length > 0) setSelectedConv(parsed[0]);
        } else {
          setConversations(DEMO_CONVERSATIONS);
          if (!selectedConv) setSelectedConv(DEMO_CONVERSATIONS[0]);
        }
      } else {
        setConversations(data);
        if (!selectedConv && data.length > 0) setSelectedConv(data[0]);
      }
    } catch {
      setConversations(DEMO_CONVERSATIONS);
      if (!selectedConv) setSelectedConv(DEMO_CONVERSATIONS[0]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages for selected conversation
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
        } else {
          setMessages([]);
        }
      } else {
        setMessages(data);
      }
    } catch {
      const local = localStorage.getItem(`ingenium_chat_msgs_${convId}`);
      if (local) {
        setMessages(JSON.parse(local));
      } else if (DEMO_MESSAGES[convId]) {
        setMessages(DEMO_MESSAGES[convId]);
      }
    }
  };

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtime Listener for new incoming messages and conversations
  useEffect(() => {
    try {
      const channel = supabase
        .channel('admin_chat_channel')
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
            if (selectedConv && newMsg.conversation_id === selectedConv.id) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
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
    } catch {
      // Offline fallback
    }
  }, [selectedConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      conversation_id: selectedConv.id,
      sender_type: 'admin',
      sender_name: profile?.name ? `${profile.name} (Soporte POS)` : 'Asesor INGENIUM POS',
      message: text,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`ingenium_chat_msgs_${selectedConv.id}`, JSON.stringify(updatedMessages));

    // Update conversation state
    const updatedConvs = conversations.map(c =>
      c.id === selectedConv.id
        ? {
            ...c,
            last_message: text,
            last_message_at: new Date().toISOString(),
            unread_admin_count: 0,
          }
        : c
    );
    setConversations(updatedConvs);
    localStorage.setItem('ingenium_admin_conversations', JSON.stringify(updatedConvs));

    try {
      await supabase.from('chat_messages').insert({
        conversation_id: selectedConv.id,
        sender_type: 'admin',
        sender_name: profile?.name || 'Soporte POS',
        message: text,
      });

      await supabase
        .from('chat_conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
          unread_admin_count: 0,
        })
        .eq('id', selectedConv.id);
    } catch {
      // offline fallback
    } finally {
      setIsSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.client_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    (c.client_phone || '').includes(filterSearch) ||
    (c.last_message || '').toLowerCase().includes(filterSearch.toLowerCase())
  );

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return '#';
    const clean = phone.replace(/\D/g, '');
    return `https://wa.me/${clean}?text=${encodeURIComponent('Hola! Te saluda el equipo de INGENIUM MÓVIL con respecto a tu consulta en línea.')}`;
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
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#2563eb]" />
                  <h2 className="font-bold text-sm text-gray-800">Mensajes de la Tienda</h2>
                </div>
                <span className="text-[11px] font-bold bg-blue-100 text-[#2563eb] px-2 py-0.5 rounded-full">
                  {conversations.length} activas
                </span>
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
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No hay conversaciones activas.
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const isSelected = selectedConv?.id === conv.id;
                  const hasUnread = (conv.unread_admin_count || 0) > 0;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConv(conv);
                        if (hasUnread) {
                          conv.unread_admin_count = 0;
                        }
                      }}
                      className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50/70 border-l-4 border-[#2563eb]' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white font-bold flex items-center justify-center text-xs">
                          {conv.client_name.charAt(0).toUpperCase()}
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
                            <span className="ml-auto bg-red-100 text-red-600 font-black px-1.5 py-0.2 rounded-full">
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
                    {selectedConv.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      {selectedConv.client_name}
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Cliente Web
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
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink size={13} />
                      WhatsApp Directo
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
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-gray-400 mb-0.5 px-1 font-semibold">
                          {isStaff ? 'Tú (Soporte POS)' : m.sender_name}
                        </span>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-[#1e3a5f] text-white rounded-br-none'
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
                  className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold disabled:opacity-40 transition shadow flex items-center gap-1.5"
                >
                  <Send size={14} />
                  Enviar
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <MessageSquare size={48} className="text-gray-300 mb-2" />
              <h4 className="font-bold text-gray-700 text-sm">Selecciona una conversación</h4>
              <p className="text-xs text-gray-400 mt-1">
                Atiende a tus clientes en línea directamente desde tu panel de POS.
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
