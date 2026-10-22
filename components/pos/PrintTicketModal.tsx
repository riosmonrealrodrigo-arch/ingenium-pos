'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, Check, FileText, Ban, Copy, Smartphone } from 'lucide-react';
import { Sale, RepairOrder, TicketSettings } from '@/types';
import { DEFAULT_TICKET_SETTINGS } from '@/lib/mockData';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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
  }, [isOpen]);

  if (!isOpen || (!sale && !repair)) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    let text = '';
    if (sale) {
      text = `*${settings.business_name}*\nTicket: #${sale.id.slice(-6).toUpperCase()}\nFecha: ${formatDateTime(sale.created_at)}\nCliente: ${sale.client_name || 'Consumidor Final'}\nTotal: ${formatCurrency(sale.total, currency)}\nPago: ${sale.payment_method}`;
    } else if (repair) {
      text = `*${settings.business_name} - ORDEN DE SERVICIO*\nFolio: ${repair.folio}\nEquipo: ${repair.device_brand} ${repair.device_model}\nFalla: ${repair.issue_reported}\nPresupuesto: ${formatCurrency(repair.estimated_cost, currency)}\nAnticipo: ${formatCurrency(repair.advance_payment, currency)}\nSaldo pendiente: ${formatCurrency(repair.estimated_cost - repair.advance_payment, currency)}\nGarantía: ${repair.warranty_days || 30} días`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:z-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100 print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Header - Hidden in Print */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2563eb] flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm sm:text-base">
                {sale ? 'Comprobante de Venta' : 'Orden de Reparación'}
              </h3>
              <p className="text-xs text-gray-400">Selecciona el formato o imprime directamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Bar - Hidden in Print */}
        <div className="px-4 py-2.5 bg-gray-100/70 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFormat('thermal_80')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                format === 'thermal_80'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span>🧾 Térmico 80mm</span>
            </button>
            <button
              onClick={() => setFormat('thermal_58')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                format === 'thermal_58'
                  ? 'bg-white text-[#2563eb] shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <span>🎟️ Térmico 58mm</span>
            </button>
            <button
              onClick={() => setFormat('letter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
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
            className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Copiar texto para enviar por WhatsApp"
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
                : 'w-full max-w-xl p-6 text-sm font-sans leading-normal border border-gray-200'
            }`}
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h2 className="font-black text-base sm:text-lg tracking-wide uppercase text-gray-900">
                {settings.business_name}
              </h2>
              {settings.tax_id && <p className="text-gray-600">{settings.tax_id}</p>}
              {settings.address && <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">{settings.address}</p>}
              {settings.phone && <p className="text-gray-600 font-semibold">Tel: {settings.phone}</p>}
              {settings.social_media && <p className="text-gray-400 text-[10px]">{settings.social_media}</p>}
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
            {repair && (
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
                  {repair.unlock_pattern && (
                    <p className="flex justify-between bg-amber-50 p-1 rounded border border-amber-200 font-semibold text-amber-900">
                      <span>Seguridad/PIN:</span>
                      <span>{repair.unlock_pattern}</span>
                    </p>
                  )}
                </div>

                <div className="text-[11px] space-y-1 pt-1">
                  <p className="font-bold text-gray-700">FALLA REPORTADA:</p>
                  <p className="text-gray-600 italic bg-gray-50 p-1.5 rounded">{repair.issue_reported}</p>
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
                    Válida por defectos de fabricación del repuesto o mano de obra técnica.
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
            )}

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
              <p className="text-[9px] text-gray-400">Software INGENIUM POS</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons - Hidden in Print */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 text-sm transition flex items-center justify-center gap-2"
          >
            <Ban size={16} /> Omitir impresión
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#2563eb] text-white rounded-xl font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 text-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer size={16} /> Imprimir Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
