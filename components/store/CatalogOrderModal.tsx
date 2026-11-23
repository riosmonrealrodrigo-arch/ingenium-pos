'use client';
import { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  Search,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Star,
  RefreshCw,
  Loader2,
  Package,
  Layers,
  Sparkles,
  ArrowDownToLine,
} from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { isRepuesto, isAccesorio, isServicio } from '@/lib/categories';
import { getCatalogOrder, saveCatalogOrder, applyCatalogOrder } from '@/lib/storeCatalogOrder';

interface CatalogOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSaved?: () => void;
}

export default function CatalogOrderModal({
  isOpen,
  onClose,
  onOrderSaved,
}: CatalogOrderModalProps) {
  const { products } = useProducts();
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Cargar orden actual al abrir
  useEffect(() => {
    if (isOpen) {
      const storeOnly = products.filter(
        p => p.visible_en_tienda !== false && p.active !== false
      );
      getCatalogOrder().then(savedOrder => {
        const sorted = applyCatalogOrder(storeOnly, savedOrder);
        setOrderedProducts(sorted);
      });
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= orderedProducts.length) return;
    const next = [...orderedProducts];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedProducts(next);
  };

  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const next = [...orderedProducts];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    setOrderedProducts(next);
  };

  const handleMoveToBottom = (index: number) => {
    if (index === orderedProducts.length - 1) return;
    const next = [...orderedProducts];
    const [item] = next.splice(index, 1);
    next.push(item);
    setOrderedProducts(next);
  };

  const handleSetPosition = (index: number, newPositionOneBased: number) => {
    if (isNaN(newPositionOneBased)) return;
    const targetIdx = Math.max(0, Math.min(orderedProducts.length - 1, newPositionOneBased - 1));
    if (targetIdx === index) return;

    const next = [...orderedProducts];
    const [item] = next.splice(index, 1);
    next.splice(targetIdx, 0, item);
    setOrderedProducts(next);
  };

  const handleReset = () => {
    if (confirm('¿Restablecer el orden del catálogo a la fecha de creación?')) {
      const storeOnly = products.filter(
        p => p.visible_en_tienda !== false && p.active !== false
      );
      setOrderedProducts(storeOnly);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const orderIds = orderedProducts.map(p => p.id);
    await saveCatalogOrder(orderIds);
    setSaving(false);
    setSuccess('¡Orden del catálogo web guardado exitosamente!');
    if (onOrderSaved) onOrderSaved();
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const filteredList = orderedProducts.filter(
    p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#2563eb] flex items-center justify-center shadow-xs">
              <ArrowUpDown size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base leading-tight">
                Organizar Orden de la Tienda Web
              </h3>
              <p className="text-xs text-gray-500">
                Acomoda tus productos y refacciones en la posición exacta donde quieras que aparezcan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0">
            <Check size={16} /> {success}
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#2563eb] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-gray-500">
              {orderedProducts.length} productos en tienda
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              title="Restablecer orden por defecto"
            >
              <RefreshCw size={12} /> Restablecer
            </button>
          </div>
        </div>

        {/* Tip de orden rápido */}
        <div className="mt-2.5 px-3 py-1.5 bg-blue-50/80 border border-blue-100 rounded-xl flex items-center justify-between gap-2 text-[11px] text-blue-900 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#2563eb] shrink-0" />
            <span>
              <strong>Organización Rápida:</strong> Escribe el número en la casilla <strong>Posición</strong> (ej. 1, 3, 10) y presiona Enter, o usa <strong>Primero</strong> y <strong>Al Final</strong> para acomodar de inmediato.
            </span>
          </span>
        </div>

        {/* Product Items List */}
        <div className="overflow-y-auto p-1 flex-1 mt-3 space-y-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <Package size={32} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500 font-semibold">
                No se encontraron productos visibles en tienda.
              </p>
            </div>
          ) : (
            filteredList.map(product => {
              // Buscar índice real en el arreglo completo
              const realIndex = orderedProducts.findIndex(p => p.id === product.id);
              const position = realIndex + 1;
              const isServiceItem = isServicio(product);
              const isAccItem = isAccesorio(product);

              return (
                <div
                  key={product.id}
                  className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Posición Numérica Editable */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <div className="flex flex-col items-center" title="Escribe el número de orden y presiona Enter">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Posición</span>
                      <input
                        type="number"
                        min={1}
                        max={orderedProducts.length}
                        defaultValue={position}
                        key={`pos-${product.id}-${position}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val) && val !== position) {
                              handleSetPosition(realIndex, val);
                            }
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onBlur={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val !== position) {
                            handleSetPosition(realIndex, val);
                          }
                        }}
                        className="w-12 h-8 rounded-xl bg-blue-50 hover:bg-blue-100/70 focus:bg-white text-[#2563eb] font-black text-xs text-center border border-blue-200 shadow-2xs focus:ring-2 focus:ring-[#2563eb] outline-none transition cursor-text"
                      />
                    </div>

                    {/* Foto */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                      <img
                        src={
                          product.image_url ||
                          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80'
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        {product.code}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isServiceItem
                            ? 'bg-blue-100 text-blue-700'
                            : isAccItem
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isServiceItem ? 'Servicio' : isAccItem ? 'Accesorio' : 'Repuesto'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-gray-900 truncate mt-0.5">
                      {product.name}
                    </h4>

                    <span className="text-xs font-black text-[#1e3a5f]">
                      {isServiceItem && (!product.sale_price || product.sale_price <= 0)
                        ? 'A cotizar'
                        : formatCurrency(product.sale_price)}
                    </span>
                  </div>

                  {/* Acciones de Orden */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Botón Mover al Frente (Top 1) */}
                    <button
                      type="button"
                      onClick={() => handleMoveToTop(realIndex)}
                      disabled={realIndex === 0}
                      className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] font-bold border border-amber-200 transition disabled:opacity-20 flex items-center gap-1 cursor-pointer"
                      title="Poner en la posición #1 al frente de la tienda"
                    >
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                      <span className="hidden sm:inline">Primero</span>
                    </button>

                    {/* Botón Poner al Final */}
                    <button
                      type="button"
                      onClick={() => handleMoveToBottom(realIndex)}
                      disabled={realIndex === orderedProducts.length - 1}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 transition disabled:opacity-20 flex items-center gap-1 cursor-pointer"
                      title="Enviar este producto a la última posición de la tienda"
                    >
                      <ArrowDownToLine size={12} className="text-slate-600" />
                      <span className="hidden sm:inline">Al Final</span>
                    </button>

                    {/* Botón Subir */}
                    <button
                      type="button"
                      onClick={() => handleMove(realIndex, -1)}
                      disabled={realIndex === 0}
                      className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-600 disabled:opacity-20 border border-gray-200 transition cursor-pointer"
                      title="Subir un lugar"
                    >
                      <ChevronUp size={16} />
                    </button>

                    {/* Botón Bajar */}
                    <button
                      type="button"
                      onClick={() => handleMove(realIndex, 1)}
                      disabled={realIndex === orderedProducts.length - 1}
                      className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-600 disabled:opacity-20 border border-gray-200 transition cursor-pointer"
                      title="Bajar un lugar"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span>Los clientes verán los productos en este mismo orden exacto.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-300 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className="px-4 py-2 bg-[#2563eb] text-white text-xs font-bold rounded-xl hover:bg-[#1d4ed8] transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Guardar Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
