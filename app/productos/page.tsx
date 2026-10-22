'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Search, Plus, Edit2, ToggleLeft, ToggleRight, Package, Globe, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ProductosPage() {
  const { profile, business, loading } = useAuth();
  const { products, loadProducts, toggleActive, toggleStorefront, deleteProduct, purgeDemoProducts } = useProducts();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'active'|'inactive'|'low'|'store'>('all');
  const [purging, setPurging] = useState(false);

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) loadProducts(); }, [profile, loadProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}"? Esta acción se sincronizará de inmediato con la base de datos y la tienda web.`)) {
      await deleteProduct(id);
    }
  };

  const handlePurgeDemo = async () => {
    if (confirm('⚠️ ¿DESEAS VACIAR Y ELIMINAR TODOS LOS PRODUCTOS DE PRUEBA (DEMO)?\n\nEsta acción dejará tu inventario limpio desde CERO para que puedas ingresar únicamente tus productos y refacciones reales.')) {
      setPurging(true);
      await purgeDemoProducts();
      setPurging(false);
    }
  };

  const filtered = products.filter(p => {
    const s = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const f =
      filter === 'all' ||
      (filter === 'active' && p.active) ||
      (filter === 'inactive' && !p.active) ||
      (filter === 'low' && p.stock <= p.min_stock) ||
      (filter === 'store' && p.visible_en_tienda !== false);
    return s && f;
  });

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header title="Productos e Inventario" subtitle={`${products.length} productos registrados · Moneda: $ MXN`} />
        <main className="p-3 sm:p-4 lg:p-5 space-y-3.5 max-w-7xl mx-auto w-full">

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código SKU..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
            </div>
            
            <div className="flex items-center gap-2">
              {products.length > 0 && (
                <button
                  onClick={handlePurgeDemo}
                  disabled={purging}
                  title="Eliminar todos los productos de prueba y empezar desde ceros"
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 size={13} />
                  <span>{purging ? 'Limpiando...' : 'Vaciar Catálogo Demo'}</span>
                </button>
              )}

              <Link href="/productos/nuevo"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold hover:bg-[#1d4ed8] transition whitespace-nowrap active:scale-95 shadow-sm shadow-blue-500/20">
                <Plus size={14} /> Nuevo producto
              </Link>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[['all','Todos'],['active','Activos'],['store','En Tienda Web'],['low','Stock bajo'],['inactive','Inactivos']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v as typeof filter)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition
                  ${filter === v ? 'bg-[#2563eb] text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-20">Código</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider">Nombre / Refacción</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-24">P. Compra</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-28">P. Venta</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-16 text-center">Stock</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-24 text-center">Tienda Web</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-20 text-center">Estado</th>
                    <th className="px-3 py-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-wider w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const isVisibleInStore = p.visible_en_tienda !== false;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="px-3 py-2 font-mono text-[11px] text-gray-500 bg-gray-50/50">{p.code}</td>
                        <td className="px-3 py-2">
                          <p className="font-bold text-gray-800 text-xs">{p.name}</p>
                          {p.commercial_description && (
                            <p className="text-[10px] text-gray-400 truncate max-w-xs">{p.commercial_description}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-medium text-xs">{formatCurrency(p.purchase_price)}</td>
                        <td className="px-3 py-2 font-black text-[#2563eb] text-xs">{formatCurrency(p.sale_price)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-black text-xs ${p.stock === 0 ? 'text-red-500' : p.stock <= p.min_stock ? 'text-amber-500' : 'text-green-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => toggleStorefront(p.id, !isVisibleInStore)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition ${
                              isVisibleInStore
                                ? 'bg-blue-100 text-[#2563eb] hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title="Haz clic para activar o desactivar de la tienda web"
                          >
                            <Globe size={11} />
                            {isVisibleInStore ? 'Visible' : 'Oculto'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/productos/${p.id}`} className="p-1 hover:bg-blue-50 rounded text-blue-500 transition" title="Editar"><Edit2 size={13} /></Link>
                            <button onClick={() => toggleActive(p.id, !p.active)} className="p-1 hover:bg-gray-100 rounded transition" title="Cambiar estado">
                              {p.active ? <ToggleRight size={15} className="text-green-500" /> : <ToggleLeft size={15} className="text-gray-400" />}
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1 hover:bg-red-50 rounded text-red-500 transition"
                              title="Eliminar producto"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filtered.map(p => (
                <div key={p.id} className="p-4 flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.code} · Stock: <span className={p.stock <= p.min_stock ? 'text-amber-500 font-bold' : ''}>{p.stock}</span></p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-black text-[#2563eb]">{formatCurrency(p.sale_price)}</p>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/productos/${p.id}`} className="text-xs text-blue-500 font-medium">Editar</Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="text-xs text-red-500 font-medium">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <Package size={48} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No hay productos registrados en el inventario</p>
                <p className="text-xs max-w-sm mx-auto">
                  Tu catálogo está limpio y listo. Haz clic en <strong>"Nuevo producto"</strong> para ingresar tus refacciones y accesorios reales.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
