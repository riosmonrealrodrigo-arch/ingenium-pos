'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import { useCart } from '@/context/CartContext';
import { useSales } from '@/context/SalesContext';
import { useClients } from '@/context/ClientContext';
import { Product, PaymentMethod, Client, Sale } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import PrintTicketModal from '@/components/pos/PrintTicketModal';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Banknote, CreditCard, Smartphone, BookUser } from 'lucide-react';
import { formatCurrency, generateTicket } from '@/lib/utils';

export default function POSPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts, updateStock } = useProducts();
  const { items, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, totalDiscount, total, itemCount } = useCart();
  const { createSale } = useSales();
  const { clients, loadClients } = useClients();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!profile) router.replace('/login');
      else if (profile.role === 'cliente') router.replace('/tienda');
    }
  }, [profile, loading, router]);
  useEffect(() => { if (profile) { loadProducts(); loadClients(); } }, [profile]);

  const filtered = products.filter(p =>
    p.active && p.stock > 0 &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCheckout = async () => {
    if (items.length === 0 || processing) return;
    setProcessing(true);
    try {
      const sale = await createSale(items, payMethod, selectedClient?.id, selectedClient?.name,
        payMethod === 'efectivo' ? parseFloat(cashGiven) || undefined : undefined);
      clearCart();
      setShowPayment(false);
      setCashGiven('');
      setSelectedClient(null);
      setSuccess(generateTicket(sale.id));
      setCompletedSale(sale);
      setShowPrintModal(true);
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setProcessing(false);
    }
  };

  const change = payMethod === 'efectivo' && cashGiven ? parseFloat(cashGiven) - total : 0;

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 bg-[#f59e0b] rounded-2xl flex items-center justify-center font-black text-[#1e3a5f] text-3xl shadow-2xl mb-4 animate-bounce">
          I
        </div>
        <h2 className="text-xl font-bold tracking-wide">INGENIUM POS</h2>
        <p className="text-white/60 text-xs mt-1">Cargando catálogo y caja de cobro...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 flex flex-col h-screen pb-16 lg:pb-0">
        <Header title="Punto de Venta" />

        {/* Success toast */}
        {success && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold text-sm">
            <Check size={18} /> Venta {success} registrada
          </div>
        )}

        <div className="flex flex-1 overflow-hidden lg:gap-4 lg:p-4">
          {/* Products */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-100">
            <div className="p-2.5 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto o código..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-gray-50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-[#2563eb] rounded-xl p-2.5 text-left transition-all active:scale-95 group">
                  <div className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center mb-1 text-xs shadow-2xs">📦</div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Stock: {p.stock}</p>
                  <p className="text-xs font-black text-[#2563eb] mt-0.5">{formatCurrency(p.sale_price, business?.currency)}</p>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-300">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Sin productos disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart — desktop */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-1.5 text-sm">
                <ShoppingCart size={15} /> Carrito
                {itemCount > 0 && <span className="bg-[#2563eb] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-black">{itemCount}</span>}
              </h2>
              {items.length > 0 && (
                <button onClick={clearCart} className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1 transition">
                  <Trash2 size={11} /> Limpiar
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {items.length === 0
                ? <div className="text-center py-12 text-gray-300"><ShoppingCart size={28} className="mx-auto mb-1 opacity-60" /><p className="text-xs text-gray-400">Carrito vacío</p></div>
                : items.map(item => (
                    <div key={item.product.id} className="bg-gray-50 rounded-xl p-2.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <p className="text-xs font-semibold text-gray-800 flex-1 leading-tight">{item.product.name}</p>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-red-400 transition shrink-0"><X size={12} /></button>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 transition"><Minus size={10} /></button>
                          <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-100 transition"><Plus size={10} /></button>
                        </div>
                        <span className="text-xs font-black text-gray-800">{formatCurrency(item.product.sale_price * item.quantity, business?.currency)}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
            {items.length > 0 && (
              <div className="p-3 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal, business?.currency)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Descuento</span><span>-{formatCurrency(totalDiscount, business?.currency)}</span></div>}
                <div className="flex justify-between font-black text-lg text-gray-900 pt-0.5"><span>Total</span><span>{formatCurrency(total, business?.currency)}</span></div>
                <button onClick={() => setShowPayment(true)}
                  className="w-full py-2.5 bg-[#2563eb] text-white font-black rounded-xl hover:bg-[#1d4ed8] transition text-xs active:scale-95 shadow-md shadow-blue-500/20">
                  💳 Cobrar {formatCurrency(total, business?.currency)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile cobrar button */}
        {itemCount > 0 && (
          <div className="lg:hidden fixed bottom-16 left-4 right-4 z-30">
            <button onClick={() => setShowPayment(true)}
              className="w-full py-4 bg-[#2563eb] text-white font-black rounded-2xl shadow-2xl flex items-center justify-between px-5 text-sm active:scale-95 transition">
              <span className="bg-white text-[#2563eb] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">{itemCount}</span>
              <span>Cobrar</span>
              <span>{formatCurrency(total, business?.currency)}</span>
            </button>
          </div>
        )}

        {/* Payment modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-gray-900">Confirmar cobro</h3>
                <button onClick={() => setShowPayment(false)} className="p-1 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
              </div>

              <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] rounded-xl p-4 flex justify-between items-center">
                <span className="text-white/70 text-sm">Total a cobrar</span>
                <span className="text-3xl font-black text-white">{formatCurrency(total, business?.currency)}</span>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 mb-2 tracking-wider">MÉTODO DE PAGO</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['efectivo', '💵 Efectivo', Banknote],
                    ['tarjeta', '💳 Tarjeta', CreditCard],
                    ['transferencia', '📱 Transferencia', Smartphone],
                    ['credito', '📒 Crédito', BookUser],
                  ] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setPayMethod(val)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition text-left
                        ${payMethod === val ? 'border-[#2563eb] bg-blue-50 text-[#2563eb]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 'efectivo' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 tracking-wider">EFECTIVO RECIBIDO</label>
                  <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-[#2563eb] transition" />
                  {cashGiven && change >= 0 && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between">
                      <span className="text-green-700 text-sm font-medium">Cambio</span>
                      <span className="text-green-700 font-black">{formatCurrency(change, business?.currency)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-400 tracking-wider">CLIENTE (opcional)</label>
                <select className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  value={selectedClient?.id ?? ''} onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) ?? null)}>
                  <option value="">Sin cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button onClick={handleCheckout} disabled={processing}
                className="w-full py-4 bg-green-500 text-white font-black rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2 text-base disabled:opacity-60 active:scale-95">
                <Check size={20} /> {processing ? 'Procesando...' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        )}
        {/* Print ticket modal */}
        <PrintTicketModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setCompletedSale(null);
          }}
          sale={completedSale}
          currency={business?.currency}
        />
      </div>
      <BottomNav />
    </div>
  );
}
