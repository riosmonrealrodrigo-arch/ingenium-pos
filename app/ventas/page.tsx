'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSales } from '@/context/SalesContext';
import { Sale } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { ShoppingCart, X, Calendar, RotateCcw, AlertTriangle, CheckCircle, Package, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDateTime, todayISO, generateTicket, weekAgoISO, monthAgoISO } from '@/lib/utils';

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: '💵 Efectivo',
  tarjeta: '💳 Tarjeta',
  transferencia: '📱 Transferencia',
  credito: '📒 Crédito',
  mixto: '🔀 Mixto',
};

export default function VentasPage() {
  const { profile, business, loading } = useAuth();
  const { sales, loadSales, cancelSale, resetSalesAndAccounting } = useSales();
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [detail, setDetail] = useState<Sale | null>(null);

  // Cancellation / Refund Modal states
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('Devolución de producto');
  const [returnStock, setReturnStock] = useState(true);
  const [processingRefund, setProcessingRefund] = useState(false);

  // Reset accounting modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingSales, setResettingSales] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  useEffect(() => {
    if (profile) loadSales();
  }, [profile, loadSales]);

  const fromDate = period === 'today' ? todayISO() : period === 'week' ? weekAgoISO() : monthAgoISO();
  const periodSales = sales.filter(s => s.created_at >= fromDate);

  const filtered = periodSales.filter(s => {
    if (statusFilter === 'completed') return s.status === 'completed';
    if (statusFilter === 'cancelled') return s.status === 'cancelled' || s.status === 'refunded';
    return true;
  });

  const completedSales = periodSales.filter(s => s.status === 'completed');
  const cancelledSales = periodSales.filter(s => s.status === 'cancelled' || s.status === 'refunded');

  const netRevenue = completedSales.reduce((s, v) => s + v.total, 0);
  const refundedTotal = cancelledSales.reduce((s, v) => s + v.total, 0);

  const handleProcessRefund = async () => {
    if (!detail) return;
    setProcessingRefund(true);
    await cancelSale(detail.id, refundReason, returnStock);
    setProcessingRefund(false);
    setRefundModalOpen(false);

    // Update local detail state to reflect cancelled immediately
    setDetail(prev =>
      prev
        ? {
            ...prev,
            status: 'cancelled',
            cancellation_reason: refundReason,
            cancelled_at: new Date().toISOString(),
            returned_to_stock: returnStock,
          }
        : null
    );
  };

  const handleExecuteSalesReset = async () => {
    setResettingSales(true);
    try {
      await resetSalesAndAccounting();
      setResetModalOpen(false);
      setDetail(null);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setResettingSales(false);
    }
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Historial de Ventas & Devoluciones" />
        <main className="p-3 sm:p-4 lg:p-5 space-y-4 max-w-5xl mx-auto w-full">

          {resetSuccess && (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs animate-fade-in">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <span>Contabilidad y registro de ventas reiniciados a $0.00 MXN correctamente.</span>
            </div>
          )}

          {/* Period and Status Filters & Reset Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Period selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  ['today', 'Hoy'],
                  ['week', 'Esta semana'],
                  ['month', 'Este mes'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setPeriod(v as typeof period)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                      period === v ? 'bg-[#2563eb] text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Status pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  ['all', `Todas (${periodSales.length})`],
                  ['completed', `Completadas (${completedSales.length})`],
                  ['cancelled', `Devueltas / Canceladas (${cancelledSales.length})`],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setStatusFilter(v as typeof statusFilter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                      statusFilter === v
                        ? v === 'cancelled'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-gray-800 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions & Realtime status */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Nube en vivo</span>
              </span>
              <button
                type="button"
                onClick={() => loadSales()}
                className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition shadow-2xs cursor-pointer"
                title="Sincronizar ventas con Supabase"
              >
                <RefreshCw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition shadow-xs cursor-pointer"
                title="Borrar ventas de prueba y reiniciar contabilidad a $0.00"
              >
                <RotateCcw size={14} className="text-red-600" />
                <span>Reset Contabilidad ($0.00)</span>
              </button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
              <p className="text-2xl font-black text-gray-900">{completedSales.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ventas Efectivas</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
              <p className="text-2xl font-black text-[#2563eb]">{formatCurrency(netRevenue, business?.currency)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ingresos Netos</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
              <p className="text-2xl font-black text-red-500">{formatCurrency(refundedTotal, business?.currency)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cancelledSales.length} canceladas / devueltas</p>
            </div>
          </div>

          {/* Sales list */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(s => {
                const isCancelled = s.status === 'cancelled' || s.status === 'refunded';
                return (
                  <button
                    key={s.id}
                    onClick={() => setDetail(s)}
                    className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isCancelled ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {isCancelled ? <RotateCcw size={18} /> : <ShoppingCart size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-gray-800">{generateTicket(s.id)}</p>
                          {isCancelled && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Devuelto / Cancelado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.created_at)}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {PAYMENT_LABELS[s.payment_method] || s.payment_method} · {s.items.length} producto(s)
                          {s.client_name && ` · Cliente: ${s.client_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-black text-sm sm:text-base ${
                          isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(s.total, business?.currency)}
                      </p>
                      <span
                        className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          isCancelled
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isCancelled ? 'Cancelado' : 'Completada'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-300 space-y-2">
                  <Calendar size={44} className="mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-500">No hay ventas registradas con estos filtros</p>
                  <p className="text-xs text-gray-400">Intenta cambiando el rango de tiempo o el estado de búsqueda.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Sale detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`px-5 py-4 flex items-center justify-between text-white ${
              detail.status === 'cancelled' ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]'
            }`}>
              <div>
                <p className="font-black text-base">{generateTicket(detail.id)}</p>
                <p className="text-white/80 text-xs">{formatDateTime(detail.created_at)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Cancelled Alert Box */}
              {(detail.status === 'cancelled' || detail.status === 'refunded') && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-1 text-red-800">
                  <div className="flex items-center gap-1.5 font-black text-red-700">
                    <AlertTriangle size={15} />
                    <span>Venta Cancelada / Devolución Registrada</span>
                  </div>
                  {detail.cancellation_reason && (
                    <p><strong>Motivo:</strong> {detail.cancellation_reason}</p>
                  )}
                  {detail.cancelled_at && (
                    <p><strong>Fecha:</strong> {formatDateTime(detail.cancelled_at)}</p>
                  )}
                  <p><strong>Reintegro al inventario:</strong> {detail.returned_to_stock ? 'Sí (stock restaurado)' : 'No'}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos de la venta</p>
                {detail.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-gray-100">
                    <span className="text-gray-800 font-medium">
                      {item.product_name} <strong className="text-gray-500">x{item.quantity}</strong>
                    </span>
                    <span className="font-black text-gray-900">{formatCurrency(item.subtotal, business?.currency)}</span>
                  </div>
                ))}
              </div>

              {/* Financials Breakdown */}
              <div className="space-y-1.5 pt-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(detail.subtotal, business?.currency)}</span>
                </div>
                {detail.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Descuento aplicado</span>
                    <span>-{formatCurrency(detail.discount, business?.currency)}</span>
                  </div>
                )}
                {detail.tax > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Impuesto ({business?.tax_rate ?? 16}%)</span>
                    <span>{formatCurrency(detail.tax, business?.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span className={detail.status === 'cancelled' ? 'line-through text-gray-400' : 'text-[#2563eb]'}>
                    {formatCurrency(detail.total, business?.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-2xl p-3.5 text-xs space-y-1 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Método de pago:</span>
                  <span className="font-bold">{PAYMENT_LABELS[detail.payment_method] || detail.payment_method}</span>
                </div>
                {detail.client_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-bold">{detail.client_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Atendido por:</span>
                  <span className="font-bold">{detail.user_name}</span>
                </div>
              </div>

              {/* Action Button: Devolución / Cancelar */}
              {detail.status === 'completed' && (
                <div className="pt-2">
                  <button
                    onClick={() => setRefundModalOpen(true)}
                    type="button"
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={15} />
                    <span>Registrar Devolución / Cancelar Venta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Devolución / Cancelación */}
      {refundModalOpen && detail && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900">¿Cancelar esta Venta?</h3>
                <p className="text-xs text-gray-500">Ticket: {generateTicket(detail.id)}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              El importe de <strong>{formatCurrency(detail.total, business?.currency)}</strong> se descontará de la contabilidad de ingresos del día.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">Motivo de la devolución / cancelación:</label>
              <select
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="Devolución por defecto de fábrica">Devolución por defecto de fábrica</option>
                <option value="Cliente desistió de la compra">Cliente desistió de la compra</option>
                <option value="Error en cobro / producto equivocado">Error en cobro / producto equivocado</option>
                <option value="Cancelación de servicio / reparación">Cancelación de servicio / reparación</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={returnStock}
                onChange={e => setReturnStock(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-gray-700">
                Reintegrar los productos al inventario automáticamente
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                disabled={processingRefund}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={processingRefund}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {processingRefund ? 'Procesando...' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Accounting Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle size={22} />
                <h3 className="font-black text-gray-900 text-base">¿Reiniciar Contabilidad a $0.00?</h3>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-red-50 p-3.5 rounded-2xl border border-red-100 text-xs text-red-800 space-y-2">
              <p className="font-bold">Esta acción borrará todas las ventas registradas hasta ahora:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El total de ventas efectivas e ingresos netos volverán a $0.00</li>
                <li>Se vaciará el historial para arrancar con ventas reales</li>
                <li>Tus productos y el stock de inventario se mantendrán intactos</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                disabled={resettingSales}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteSalesReset}
                disabled={resettingSales}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {resettingSales ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Reiniciando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Sí, reiniciar a $0.00</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
