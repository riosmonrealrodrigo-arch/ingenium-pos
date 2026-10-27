'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Check,
  FileText,
  Ban,
  Copy,
  Smartphone,
  MessageSquare,
  Download,
  Share2,
  Send,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Sale, RepairOrder, TicketSettings } from '@/types';
import { DEFAULT_TICKET_SETTINGS } from '@/lib/mockData';
import { formatCurrency, formatDateTime, extractAccessories } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { MiniPatternView } from '@/components/reparaciones/DeviceSecuritySelector';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  repair?: RepairOrder | null;
  currency?: string;
}

export default function PrintTicketModal({
  isOpen,
  onClose,
  sale,
  repair,
  currency = '$ MXN',
}: PrintTicketModalProps) {
  const [settings, setSettings] = useState<TicketSettings>(DEFAULT_TICKET_SETTINGS);
  const [format, setFormat] = useState<'thermal_80' | 'thermal_58' | 'letter'>('thermal_80');
  const [copied, setCopied] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatSentStatus, setChatSentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_ticket_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings(parsed);
          if (parsed.default_format) setFormat(parsed.default_format);
        } catch {
          setSettings(DEFAULT_TICKET_SETTINGS);
        }
      }
    }

    // Inicializar teléfono si está disponible en la orden o cliente
    if (repair?.client_phone) {
      setClientPhone(repair.client_phone);
    } else {
      setClientPhone('');
    }
    setChatSentStatus('idle');
  }, [isOpen, repair]);

  if (!isOpen || (!sale && !repair)) return null;

  const getReceiptUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ingeniummobileshop.vercel.app';
    const folio = sale ? sale.id : (repair?.folio || repair?.id);
    return `${origin}/comprobante/${folio}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setFormat('letter');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopySummary = () => {
    const url = getReceiptUrl();
    let text = '';
    if (sale) {
      text = `*${settings.business_name}*\nTicket: #${sale.id.slice(-6).toUpperCase()}\nFecha: ${formatDateTime(sale.created_at)}\nCliente: ${sale.client_name || 'Consumidor Final'}\nTotal: ${formatCurrency(sale.total, currency)}\nPago: ${sale.payment_method}\n\n📄 Comprobante PDF:\n${url}`;
    } else if (repair) {
      const { cleanIssue, accessories: extAcc } = extractAccessories(repair.issue_reported);
      const accText = repair.accessories || extAcc || 'Solo equipo (sin accesorios)';
      text = `*${settings.business_name} - ORDEN DE SERVICIO*\nFolio: ${repair.folio}\nEquipo: ${repair.device_brand} ${repair.device_model}\nAccesorios: ${accText}\nFalla: ${cleanIssue}\nPresupuesto: ${formatCurrency(repair.estimated_cost, currency)}\nAnticipo: ${formatCurrency(repair.advance_payment, currency)}\nSaldo pendiente: ${formatCurrency(repair.estimated_cost - repair.advance_payment, currency)}\nGarantía: ${repair.warranty_days || 30} días\n\n📄 Comprobante PDF:\n${url}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const url = getReceiptUrl();
    let msg = '';

    if (sale) {
      const itemsList = sale.items
        .map(i => `• ${i.quantity}x ${i.product_name} (${formatCurrency(i.subtotal, currency)})`)
        .join('\n');

      msg = `*¡HOLA! INGENIUM MOBILE* 📱🧾\n` +
        `Aquí tienes tu *Comprobante de Compra Oficial*:\n\n` +
        `*Ticket:* #${sale.id.slice(-6).toUpperCase()}\n` +
        `*Cliente:* ${sale.client_name || 'Consumidor Final'}\n` +
        `*Fecha:* ${formatDateTime(sale.created_at)}\n\n` +
        `*Productos:*\n${itemsList}\n\n` +
        `*Total Pagado:* ${formatCurrency(sale.total, currency)} (${sale.payment_method.toUpperCase()})\n` +
        `*Garantía Oficial:* 30 días naturales con tu comprobante.\n\n` +
        `📄 *Descarga tu comprobante en formato PDF aquí:*\n${url}\n\n` +
        `¡Gracias por tu compra!`;
    } else if (repair) {
      const { cleanIssue, accessories: extAcc } = extractAccessories(repair.issue_reported);
      const accText = repair.accessories || extAcc || 'Solo equipo (sin accesorios)';
      msg = `*¡HOLA! INGENIUM MOBILE - TALLER* 🔧📱\n` +
        `Aquí tienes tu *Comprobante de Orden de Servicio*:\n\n` +
        `*Folio:* ${repair.folio}\n` +
        `*Cliente:* ${repair.client_name}\n` +
        `*Equipo:* ${repair.device_brand} ${repair.device_model}\n` +
        `*Accesorios Recibidos:* ${accText}\n` +
        `*Falla Reportada:* ${cleanIssue}\n` +
        `*Presupuesto:* ${formatCurrency(repair.estimated_cost, currency)}\n` +
        `*Anticipo Pagado:* ${formatCurrency(repair.advance_payment, currency)}\n` +
        `*Saldo Pendiente:* ${formatCurrency(Math.max(0, repair.estimated_cost - repair.advance_payment), currency)}\n` +
        `*Garantía Escrita:* ${repair.warranty_days || 30} días en refacción y mano de obra (vigente a partir de la entrega del equipo).\n\n` +
        `📄 *Consulta tu orden y descarga en PDF aquí:*\n${url}\n\n` +
        `¡Estamos para servirte!`;
    }

    const clean = clientPhone.replace(/\D/g, '');
    const phoneParam = clean.length >= 10 ? (clean.startsWith('52') ? clean : `52${clean}`) : '';
    const waUrl = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  const handleSendToSystemChat = async () => {
    setIsSendingChat(true);
    setChatSentStatus('idle');

    try {
      const targetName = sale?.client_name || repair?.client_name || 'Cliente';
      const cleanPhone = clientPhone.trim();
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      const url = getReceiptUrl();

      // 1. Buscar si ya existe la conversación del cliente en Supabase
      let convId: string | null = null;

      if (cleanPhone) {
        const { data } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('client_phone', cleanPhone)
          .order('last_message_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) convId = data[0].id;
      }

      if (!convId && digitsOnly.length >= 7) {
        const lastDigits = digitsOnly.slice(-8);
        const { data } = await supabase
          .from('chat_conversations')
          .select('id')
          .ilike('client_phone', `%${lastDigits}%`)
          .order('last_message_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) convId = data[0].id;
      }

      if (!convId && targetName && targetName !== 'Consumidor Final') {
        const { data } = await supabase
          .from('chat_conversations')
          .select('id')
          .ilike('client_name', targetName)
          .order('last_message_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) convId = data[0].id;
      }

      // 2. Si no existe, crear la conversación para este cliente
      if (!convId) {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            client_name: targetName,
            client_phone: cleanPhone || '+528139629319',
            status: 'open',
            unread_admin_count: 0,
            unread_client_count: 1,
          })
          .select()
          .single();
        if (newConv) convId = newConv.id;
      }

      if (!convId) {
        setChatSentStatus('error');
        return;
      }

      // 3. Redactar el comprobante oficial
      let receiptMessage = '';

      if (sale) {
        const itemsList = sale.items
          .map(i => `• ${i.quantity}x ${i.product_name} (${formatCurrency(i.subtotal, currency)})`)
          .join('\n');

        receiptMessage = `🧾 *COMPROBANTE OFICIAL DE VENTA*\n` +
          `*Folio:* #${sale.id.slice(-6).toUpperCase()}\n` +
          `*Cliente:* ${sale.client_name || 'Consumidor Final'}\n` +
          `*Fecha:* ${formatDateTime(sale.created_at)}\n\n` +
          `*Artículos:*\n${itemsList}\n\n` +
          `*TOTAL PAGADO:* ${formatCurrency(sale.total, currency)} (${sale.payment_method.toUpperCase()})\n` +
          `*Garantía:* 30 días naturales con tu comprobante.\n\n` +
          `📄 *Descarga tu comprobante oficial en formato PDF aquí:*\n${url}`;
      } else if (repair) {
        const { cleanIssue, accessories: extAcc } = extractAccessories(repair.issue_reported);
        const accText = repair.accessories || extAcc || 'Solo equipo (sin accesorios)';
        receiptMessage = `🛡️ *ORDEN DE SERVICIO / TALLER*\n` +
          `*Folio:* ${repair.folio}\n` +
          `*Cliente:* ${repair.client_name}\n` +
          `*Equipo:* ${repair.device_brand} ${repair.device_model}\n` +
          `*Accesorios Recibidos:* ${accText}\n` +
          `*Falla Reportada:* ${cleanIssue}\n` +
          `*Presupuesto:* ${formatCurrency(repair.estimated_cost, currency)}\n` +
          `*Anticipo:* ${formatCurrency(repair.advance_payment, currency)}\n` +
          `*Saldo Pendiente:* ${formatCurrency(Math.max(0, repair.estimated_cost - repair.advance_payment), currency)}\n` +
          `*Garantía:* ${repair.warranty_days || 30} días en refacción y mano de obra.\n\n` +
          `📄 *Descarga tu orden en formato PDF aquí:*\n${url}`;
      }

      // 4. Insertar el mensaje en chat_messages
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        sender_name: 'INGENIUM POS (Comprobante)',
        sender_type: 'admin',
        message: receiptMessage,
      });

      await supabase
        .from('chat_conversations')
        .update({
          last_message: `🧾 Comprobante enviado: ${sale ? `#${sale.id.slice(-6).toUpperCase()}` : repair?.folio}`,
          last_message_at: new Date().toISOString(),
          unread_client_count: 1,
        })
        .eq('id', convId);

      setChatSentStatus('success');
    } catch (err) {
      console.error('Error al enviar al chat:', err);
      setChatSentStatus('error');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:z-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-gray-100 print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Header - Hidden in Print */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/30 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2563eb] flex items-center justify-center shadow-xs">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm sm:text-base">
                {sale ? 'Comprobante de Venta' : 'Orden de Reparación'}
              </h3>
              <p className="text-xs text-gray-500">¿Deseas enviar el comprobante en PDF al cliente o imprimir?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* =========================================================================
            PANEL DE ENVÍO DIRECTO AL CLIENTE (WHATSAPP, CHAT DEL SISTEMA O PDF)
           ========================================================================= */}
        <div className="px-4 py-3 bg-blue-50/60 border-b border-blue-100 space-y-2.5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-[#1e3a5f] flex items-center gap-1.5 shrink-0">
                <Smartphone size={15} className="text-[#2563eb]" />
                <span>Mandar comprobante:</span>
              </span>
              <input
                type="tel"
                placeholder="Teléfono / WhatsApp cliente..."
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 font-medium outline-none focus:ring-2 focus:ring-[#2563eb] flex-1 max-w-[210px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Opción 1: Enviar por WhatsApp */}
              <button
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Mandar comprobante y enlace PDF por WhatsApp"
              >
                <Share2 size={13} />
                <span>WhatsApp</span>
              </button>

              {/* Opción 2: Enviar al Chat Web del Sistema */}
              <button
                onClick={handleSendToSystemChat}
                disabled={isSendingChat}
                className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Enviar comprobante al chat interno del cliente"
              >
                <MessageSquare size={13} />
                <span>{isSendingChat ? 'Enviando...' : 'Chat Web'}</span>
              </button>

              {/* Opción 3: Descargar PDF */}
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Descargar o Guardar como PDF"
              >
                <Download size={13} className="text-[#2563eb]" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Avisos de estado de envío */}
          {chatSentStatus === 'success' && (
            <div className="p-2 bg-emerald-100/90 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border border-emerald-200 animate-fade-in">
              <span className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-700" />
                ¡Comprobante enviado exitosamente al chat del cliente!
              </span>
              <a
                href={getReceiptUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] underline text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Ver PDF público</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {chatSentStatus === 'error' && (
            <p className="p-2 bg-red-100 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-red-200">
              ⚠️ No se pudo enviar al chat. Puedes enviárselo directamente por WhatsApp con el botón verde.
            </p>
          )}
        </div>

        {/* Format Selector Bar - Hidden in Print */}
        <div className="px-4 py-2 bg-gray-100/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 mr-1">Vista previa:</span>
            <button
              onClick={() => setFormat('thermal_80')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                format === 'thermal_80'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span>🧾 Térmico 80mm</span>
            </button>
            <button
              onClick={() => setFormat('thermal_58')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                format === 'thermal_58'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span>🎟️ Térmico 58mm</span>
            </button>
            <button
              onClick={() => setFormat('letter')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                format === 'letter'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span>📄 Media Carta / PDF</span>
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center gap-1 cursor-pointer"
            title="Copiar texto resumen"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            <span>{copied ? 'Copiado!' : 'Copiar texto'}</span>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/50 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {/* =========================================================================
              DOCUMENT TO PRINT (Container with print styling)
             ========================================================================= */}
          <div
            ref={printRef}
            id="printable-ticket"
            className={`bg-white shadow-md print:shadow-none transition-all duration-200 ${
              format === 'thermal_58'
                ? 'w-[260px] p-3 text-[11px] font-mono leading-tight'
                : format === 'thermal_80'
                ? 'w-[320px] p-4 text-xs font-mono leading-relaxed'
                : 'w-full max-w-xl p-6 text-sm font-sans leading-normal border border-gray-200 rounded-2xl'
            }`}
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h2 className="font-black text-base sm:text-lg tracking-wide uppercase text-gray-900">
                {settings.business_name}
              </h2>
              {settings.tax_id && <p className="text-gray-600 text-xs">{settings.tax_id}</p>}
              {settings.address && <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">{settings.address}</p>}
              {settings.phone && <p className="text-gray-600 font-semibold text-xs">Tel: {settings.phone}</p>}
              <p className="text-gray-400 text-[10px]">ingeniummobile0@gmail.com</p>
            </div>

            {/* Document Title & Meta */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-gray-700">
              {sale && (
                <>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>TICKET DE VENTA:</span>
                    <span>#{sale.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>Fecha:</span>
                    <span>{formatDateTime(sale.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Atendió:</span>
                    <span>{sale.user_name || 'Cajero POS'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-800 font-medium mt-1">
                    <span>Cliente:</span>
                    <span>{sale.client_name || 'Consumidor Final'}</span>
                  </div>
                </>
              )}

              {repair && (
                <>
                  <div className="flex justify-between font-black text-blue-900 text-sm">
                    <span>ORDEN TALLER:</span>
                    <span>{repair.folio}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>Fecha ingreso:</span>
                    <span>{formatDateTime(repair.received_at || repair.created_at)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-800 font-medium">
                    <span>Cliente:</span>
                    <span>{repair.client_name}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-800 font-medium">
                    <span>Teléfono:</span>
                    <span>{repair.client_phone}</span>
                  </div>
                </>
              )}
            </div>

            {/* SALE ITEMS LIST */}
            {sale && (
              <div className="py-2.5 border-b border-dashed border-gray-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200">
                      <th className="pb-1">Cant.</th>
                      <th className="pb-1">Prod.</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.items.map((it, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 align-top font-bold text-gray-700">{it.quantity}x</td>
                        <td className="py-1 align-top pr-1">
                          <p className="font-medium text-gray-900 leading-tight">{it.product_name}</p>
                          <span className="text-[10px] text-gray-400 font-sans">
                            {formatCurrency(it.unit_price, currency)} c/u
                          </span>
                        </td>
                        <td className="py-1 align-top text-right font-bold text-gray-900">
                          {formatCurrency(it.subtotal, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Breakdown */}
                <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal, currency)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Descuento:</span>
                      <span>-{formatCurrency(sale.discount, currency)}</span>
                    </div>
                  )}
                  {sale.tax > 0 && (
                    <div className="flex justify-between text-gray-500 text-[10px]">
                      <span>IVA (incluido):</span>
                      <span>{formatCurrency(sale.tax, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm sm:text-base text-gray-900 pt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total, currency)}</span>
                  </div>

                  {/* Payment Details */}
                  <div className="pt-2 text-[11px] text-gray-600 border-t border-dashed border-gray-200">
                    <div className="flex justify-between">
                      <span>Método de pago:</span>
                      <span className="uppercase font-semibold">{sale.payment_method}</span>
                    </div>
                    {sale.cash_given != null && (
                      <div className="flex justify-between">
                        <span>Efectivo entregado:</span>
                        <span>{formatCurrency(sale.cash_given, currency)}</span>
                      </div>
                    )}
                    {sale.change != null && (
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Cambio devuelto:</span>
                        <span>{formatCurrency(sale.change, currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REPAIR ORDER DETAILS */}
            {repair && (() => {
              const { cleanIssue, accessories: extAcc } = extractAccessories(repair.issue_reported);
              const accText = repair.accessories || extAcc || 'Solo equipo (sin accesorios)';
              return (
              <div className="py-2.5 border-b border-dashed border-gray-300 space-y-2">
                <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[11px] space-y-1">
                  <p className="font-bold text-gray-900">DATOS DEL DISPOSITIVO:</p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Marca/Modelo:</span>
                    <span className="font-semibold text-gray-800">{repair.device_brand} {repair.device_model}</span>
                  </p>
                  {repair.device_color && (
                    <p className="flex justify-between">
                      <span className="text-gray-500">Color:</span>
                      <span>{repair.device_color}</span>
                    </p>
                  )}
                  {repair.imei_serial && (
                    <p className="flex justify-between">
                      <span className="text-gray-500">IMEI/Serie:</span>
                      <span className="font-mono">{repair.imei_serial}</span>
                    </p>
                  )}
                  <p className="flex justify-between">
                    <span className="text-gray-500">Accesorios:</span>
                    <span className="font-semibold text-gray-800">{accText}</span>
                  </p>
                  {repair.unlock_pattern && (
                    <div className="bg-amber-50 p-2 rounded border border-amber-200 text-amber-950 space-y-1">
                      <p className="font-bold text-[10px] text-amber-900">SEGURIDAD / CLAVE DEL EQUIPO:</p>
                      <MiniPatternView patternString={repair.unlock_pattern} size={50} />
                    </div>
                  )}
                </div>

                <div className="text-[11px] space-y-1 pt-1">
                  <p className="font-bold text-gray-700">FALLA REPORTADA:</p>
                  <p className="text-gray-600 italic bg-gray-50 p-1.5 rounded">{cleanIssue}</p>
                </div>

                {repair.technician_diagnosis && (
                  <div className="text-[11px] space-y-1">
                    <p className="font-bold text-gray-700">DIAGNÓSTICO TÉCNICO:</p>
                    <p className="text-gray-600 bg-gray-50 p-1.5 rounded">{repair.technician_diagnosis}</p>
                  </div>
                )}

                {/* Warranty details in print ticket */}
                <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[11px] font-sans space-y-0.5">
                  <p className="font-black flex items-center justify-between text-gray-900">
                    <span>🛡️ GARANTÍA ESCRITA:</span>
                    <span>{repair.warranty_days || 30} DÍAS</span>
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Válida por {repair.warranty_days || 30} días a partir de la fecha de entrega del equipo reparado conforme a PROFECO.
                  </p>
                </div>

                {/* Balance breakdown */}
                <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-700">
                    <span>Presupuesto estimado:</span>
                    <span className="font-bold">{formatCurrency(repair.estimated_cost, currency)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Anticipo recibido:</span>
                    <span>{formatCurrency(repair.advance_payment, currency)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-red-600 pt-1 border-t border-gray-300">
                    <span>SALDO PENDIENTE:</span>
                    <span>{formatCurrency(Math.max(0, repair.estimated_cost - repair.advance_payment), currency)}</span>
                  </div>
                </div>

                {/* Signatures for letter format */}
                {format === 'letter' && (
                  <div className="grid grid-cols-2 gap-6 pt-8 pb-2 text-center text-xs">
                    <div className="border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">Firma del Cliente</p>
                      <p className="text-[10px] text-gray-400">Acepto términos y condiciones</p>
                    </div>
                    <div className="border-t border-gray-400 pt-1">
                      <p className="font-bold text-gray-800">Firma Técnico / Taller</p>
                      <p className="text-[10px] text-gray-400">{repair.assigned_technician || 'INGENIUM Taller'}</p>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* Terms and Warranty Footer */}
            <div className="pt-3 text-center space-y-2">
              {settings.warranty_note && (
                <div className="text-[9px] sm:text-[10px] text-gray-500 leading-tight font-sans">
                  <p className="font-bold uppercase text-gray-600 mb-0.5">Política de Garantía:</p>
                  <p>{settings.warranty_note}</p>
                </div>
              )}

              {repair && settings.repair_terms && (
                <div className="text-[9px] sm:text-[10px] text-gray-500 leading-tight font-sans border-t border-dashed border-gray-200 pt-2">
                  <p className="font-bold uppercase text-gray-600 mb-0.5">Términos del Servicio:</p>
                  <p>{settings.repair_terms}</p>
                </div>
              )}

              <p className="font-bold text-xs text-gray-800 tracking-wider pt-2">
                ¡GRACIAS POR SU PREFERENCIA!
              </p>
              <p className="text-[9px] text-gray-400">
                Software INGENIUM POS · Sombrerete, Zacatecas
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons - Hidden in Print */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Ban size={15} /> Omitir / No enviar al cliente
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 text-xs sm:text-sm transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
