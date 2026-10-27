'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sale, RepairOrder } from '@/types';
import { formatCurrency, formatDateTime, isUUID, extractAccessories, extractDiagnosisAndEvidence } from '@/lib/utils';
import {
  Download,
  Printer,
  Share2,
  CheckCircle,
  ShieldCheck,
  Store,
  MessageSquare,
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import { MiniPatternView } from '@/components/reparaciones/DeviceSecuritySelector';

export default function ComprobantePage() {
  const params = useParams();
  const rawId = (params?.id as string) || '';

  const [sale, setSale] = useState<Sale | null>(null);
  const [repair, setRepair] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!rawId) return;

    const fetchReceipt = async () => {
      setLoading(true);
      try {
        const isIdUUID = isUUID(rawId);

        // 1. Intentar buscar en ventas por ID UUID exacto
        if (isIdUUID) {
          const { data: saleData } = await supabase
            .from('sales')
            .select('*')
            .eq('id', rawId)
            .maybeSingle();

          if (saleData) {
            setSale(saleData);
            setLoading(false);
            return;
          }
        }

        // 2. Si no es venta, buscar en órdenes de reparación por folio o id
        let repairQuery = supabase.from('repair_orders').select('*');
        if (isIdUUID) {
          repairQuery = repairQuery.or(`id.eq.${rawId},folio.eq.${rawId}`);
        } else {
          repairQuery = repairQuery.or(`folio.eq.${rawId},folio.ilike.%${rawId}%`);
        }

        const { data: repairData } = await repairQuery.limit(1);

        if (repairData && repairData.length > 0) {
          setRepair(repairData[0]);
          setLoading(false);
          return;
        }

        // 3. Fallback en localStorage (modo demo / sin internet)
        if (typeof window !== 'undefined') {
          const cachedSales = localStorage.getItem('ingenium_demo_sales');
          if (cachedSales) {
            const parsed: Sale[] = JSON.parse(cachedSales);
            const foundSale = parsed.find(s => s.id === rawId || s.id.includes(rawId));
            if (foundSale) {
              setSale(foundSale);
              setLoading(false);
              return;
            }
          }

          const cachedRepairs = localStorage.getItem('ingenium_repairs');
          if (cachedRepairs) {
            const parsed: RepairOrder[] = JSON.parse(cachedRepairs);
            const foundRepair = parsed.find(r => r.folio === rawId || r.id === rawId);
            if (foundRepair) {
              setRepair(foundRepair);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar comprobante:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [rawId]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = sale
      ? `Hola! Aquí está mi comprobante de compra de INGENIUM MOBILE:\n${url}`
      : `Hola! Aquí está el folio de mi orden de reparación de INGENIUM MOBILE:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-700">Cargando comprobante oficial...</p>
        </div>
      </div>
    );
  }

  if (!sale && !repair) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4 border border-gray-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
            !
          </div>
          <h2 className="text-lg font-black text-gray-900">Comprobante No Encontrado</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            No se encontró ninguna venta u orden de servicio registrada con el folio <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono font-bold">{rawId}</code>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/tienda"
              className="py-2.5 bg-[#1e3a5f] text-white rounded-xl text-xs font-bold hover:bg-[#2563eb] transition"
            >
              Ir a la Tienda en Línea
            </Link>
            <a
              href="https://wa.me/528139629319"
              target="_blank"
              rel="noreferrer"
              className="py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              Contactar Soporte por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isSale = !!sale;
  const folioText = isSale ? `#VTA-${sale.id.slice(-6).toUpperCase()}` : repair?.folio || 'ORD-000';
  const clientName = isSale ? (sale.client_name || 'Consumidor Final') : repair?.client_name;
  const createdAt = isSale ? sale.created_at : (repair?.received_at || repair?.created_at || new Date().toISOString());
  const totalAmount = isSale ? sale.total : (repair?.estimated_cost || 0);

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-3 sm:px-4 print:p-0 print:bg-white text-gray-900">
      {/* Barra Superior de Acciones (Oculta al Imprimir/Guardar PDF) */}
      <div className="max-w-xl mx-auto mb-5 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        <Link
          href="/tienda"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3 py-2 rounded-xl shadow-xs border border-gray-200 transition"
        >
          <ArrowLeft size={14} />
          <span>Volver a la Tienda</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 text-xs font-black text-white bg-[#1e3a5f] hover:bg-[#2563eb] px-4 py-2 rounded-xl shadow-md transition cursor-pointer"
            title="Descargar o Guardar como PDF"
          >
            <Download size={14} />
            <span>Descargar en PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] px-3.5 py-2 rounded-xl shadow-md transition cursor-pointer"
            title="Compartir por WhatsApp"
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl shadow-xs transition cursor-pointer"
            title="Copiar enlace"
          >
            {copied ? <CheckCircle size={15} className="text-emerald-600" /> : <Printer size={15} />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONTENEDOR DEL COMPROBANTE OFICIAL (Imprimible y descargable como PDF)
         ========================================================================= */}
      <div
        id="printable-ticket"
        className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl print:shadow-none border border-gray-200 print:border-none p-6 sm:p-8 space-y-6"
      >
        {/* Encabezado Institucional */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-md shrink-0"
            />
            <div>
              <h1 className="font-black text-lg text-gray-900 leading-tight">INGENIUM MOBILE</h1>
              <p className="text-xs text-gray-500 font-semibold">Servicio Técnico & Accesorios de Telefonía</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Sombrerete, Zacatecas, México</p>
            </div>
          </div>

          <div className="sm:text-right w-full sm:w-auto bg-blue-50/70 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-blue-100 sm:border-none">
            <span className="inline-block px-2.5 py-1 bg-[#1e3a5f] text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
              {isSale ? 'Comprobante de Venta' : 'Orden de Servicio'}
            </span>
            <p className="text-lg font-black text-[#1e3a5f] mt-1 font-mono">{folioText}</p>
            <p className="text-[10px] text-gray-500 flex sm:justify-end items-center gap-1 mt-0.5">
              <Calendar size={11} /> {formatDateTime(createdAt)}
            </p>
          </div>
        </div>

        {/* Datos del Cliente y Transacción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cliente:</p>
            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mt-0.5">
              <User size={13} className="text-[#2563eb]" />
              <span>{clientName}</span>
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {isSale ? 'Método de Pago:' : 'Contacto / Teléfono:'}
            </p>
            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mt-0.5">
              {isSale ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="uppercase">{sale.payment_method}</span>
                </>
              ) : (
                <>
                  <Phone size={13} className="text-emerald-600" />
                  <span>{repair?.client_phone || 'Mostrador'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* CONTENIDO 1: ARTÍCULOS DE VENTA */}
        {isSale && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5">
              Detalle de Productos / Servicios
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-200">
                  <th className="pb-2 font-bold">Cant.</th>
                  <th className="pb-2 font-bold">Descripción</th>
                  <th className="pb-2 font-bold text-right">Precio</th>
                  <th className="pb-2 font-bold text-right">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items.map((it, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 font-bold text-gray-800">{it.quantity}x</td>
                    <td className="py-2.5 font-semibold text-gray-900">{it.product_name}</td>
                    <td className="py-2.5 text-right text-gray-500 font-mono">
                      {formatCurrency(it.unit_price, '$ MXN')}
                    </td>
                    <td className="py-2.5 text-right font-bold text-gray-900 font-mono">
                      {formatCurrency(it.subtotal, '$ MXN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(sale.subtotal, '$ MXN')}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono">-{formatCurrency(sale.discount, '$ MXN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>TOTAL PAGADO:</span>
                <span className="font-mono text-lg text-[#1e3a5f]">{formatCurrency(sale.total, '$ MXN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO 2: DETALLES DE REPARACIÓN */}
        {repair && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1.5">
              Datos del Dispositivo en Taller
            </h3>

            {(() => {
              const { cleanIssue, accessories: extAcc } = extractAccessories(repair.issue_reported);
              const accText = repair.accessories || extAcc || 'Solo equipo (sin accesorios adicionales)';
              return (
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold">Equipo / Modelo:</p>
                    <p className="font-bold text-gray-900 text-sm">{repair.device_brand} {repair.device_model}</p>
                  </div>
                  {repair.imei_serial && (
                    <div>
                      <p className="text-gray-400 text-[10px] font-bold">IMEI / Número de Serie:</p>
                      <p className="font-mono text-gray-800">{repair.imei_serial}</p>
                    </div>
                  )}
                  <div className="col-span-2 pt-1 border-t border-gray-200">
                    <p className="text-gray-400 text-[10px] font-bold">Accesorios Recibidos:</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                      <span>🎒</span>
                      <span>{accText}</span>
                    </p>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-gray-200">
                    <p className="text-gray-400 text-[10px] font-bold">Falla Reportada:</p>
                    <p className="font-medium text-gray-800 italic mt-0.5">{cleanIssue}</p>
                  </div>
                  {repair.unlock_pattern && (
                    <div className="col-span-2 pt-2 border-t border-gray-200 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80">
                      <p className="text-amber-900 text-[10px] font-bold mb-1">SEGURIDAD / PATRÓN O PIN:</p>
                      <MiniPatternView patternString={repair.unlock_pattern} size={50} />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Presupuesto y Saldos */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Presupuesto Estimado:</span>
                <span className="font-bold font-mono">{formatCurrency(repair.estimated_cost, '$ MXN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Anticipo Pagado:</span>
                <span className="font-mono">{formatCurrency(repair.advance_payment, '$ MXN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-red-600 pt-1.5 border-t border-blue-200">
                <span>Saldo Pendiente al Entregar:</span>
                <span className="font-mono text-base">
                  {formatCurrency(Math.max(0, repair.estimated_cost - repair.advance_payment), '$ MXN')}
                </span>
              </div>
            </div>

            {/* Estado de Entrega y Cobertura de Garantía */}
            <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
              repair.status === 'entregado'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-blue-50/70 border-blue-200 text-blue-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={15} className={repair.status === 'entregado' ? 'text-emerald-600' : 'text-blue-600'} />
                  Garantía del Servicio: {repair.warranty_days || 30} días
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  repair.status === 'entregado' ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                }`}>
                  {repair.status === 'entregado' ? 'Garantía en Curso' : 'Inicia al Entregar'}
                </span>
              </div>
              <p className="text-[11px] opacity-80 pt-0.5">
                {repair.status === 'entregado'
                  ? `Equipo entregado formalmente el ${formatDateTime(repair.delivered_at || repair.warranty_starts_at || repair.created_at)}.`
                  : `El plazo de garantía de ${repair.warranty_days || 30} días comenzará a contar estrictamente a partir de la fecha en que recibas tu equipo reparado.`}
              </p>
            </div>

            {/* Evidencias Fotográficas de la Reparación */}
            {(() => {
              const { evidence: diagEv } = extractDiagnosisAndEvidence(repair.technician_diagnosis);
              const evList = (repair.evidence && repair.evidence.length > 0) ? repair.evidence : diagEv;
              if (!evList || evList.length === 0) return null;

              return (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                    <Camera size={14} className="text-amber-600" />
                    <span>Evidencias Fotográficas del Taller ({evList.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {evList.map((photo, pIdx) => (
                      <div key={photo.id || pIdx} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden text-[10px] space-y-1">
                        <img
                          src={photo.image_url}
                          alt={photo.comment || 'Evidencia'}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-2 space-y-0.5">
                          {photo.comment ? (
                            <p className="font-semibold text-gray-800 leading-tight">
                              {photo.comment}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic">
                              Foto de proceso técnico
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400">
                            {formatDateTime(photo.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Póliza Oficial de Garantía (PROFECO) */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-950 space-y-1 leading-relaxed">
          <p className="font-black flex items-center gap-1.5 text-amber-900 uppercase">
            <ShieldCheck size={14} className="text-amber-600" />
            Póliza de Garantía Oficial INGENIUM MOBILE
          </p>
          <p>
            • <strong>Servicio Técnico y Refacciones:</strong> 30 días naturales de garantía en mano de obra y componentes instalados a partir de la fecha de entrega.
          </p>
          <p className="text-[10px] text-amber-800">
            • <strong>Restricciones legales:</strong> La garantía no aplica en equipos previamente mojados, con sellos violados, caídas o golpes posteriores a la entrega conforme a la Ley Federal de Protección al Consumidor.
          </p>
        </div>

        {/* Pie del Comprobante y Contacto */}
        <div className="text-center pt-4 border-t border-dashed border-gray-300 text-xs space-y-2 text-gray-500">
          <p className="font-bold text-gray-800">¡Gracias por tu confianza y preferencia!</p>
          <p className="text-[11px]">
            Soporte oficial: <strong>ingeniummobile0@gmail.com</strong> · WhatsApp: <strong>+52 81 3962 9319</strong>
          </p>
          <p className="text-[10px] text-gray-400">
            Comprobante emitido por Software INGENIUM POS · Sombrerete, Zacatecas, México
          </p>
        </div>
      </div>
    </div>
  );
}
