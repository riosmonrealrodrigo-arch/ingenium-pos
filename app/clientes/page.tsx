'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useClients } from '@/context/ClientContext';
import { useSales } from '@/context/SalesContext';
import { Client } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import { Search, Plus, X, Check, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ClientesPage() {
  const { profile, business, loading } = useAuth();
  const { clients, loadClients, addClient } = useClients();
  const { sales, loadSales } = useSales();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => { if (!loading && !profile) router.replace('/login'); }, [profile, loading, router]);
  useEffect(() => { if (profile) { loadClients(); loadSales(); } }, [profile]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const clientSales = selected ? sales.filter(s => s.client_id === selected.id) : [];
  const clientTotal = clientSales.reduce((s, v) => s + v.total, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await addClient({ name: form.name, phone: form.phone || undefined, email: form.email || undefined });
    setSaving(false);
    setShowModal(false);
    setForm({ name: '', phone: '', email: '' });
  };

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col pb-20 lg:pb-0">
        <Header title="Clientes" subtitle={`${clients.length} clientes registrados`} />
        <main className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto w-full">

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, teléfono o correo..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] transition whitespace-nowrap">
              <Plus size={16} /> Nuevo cliente
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(c => {
                const cSales = sales.filter(s => s.client_id === c.id);
                return (
                  <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2563eb] to-[#1e3a5f] rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone ?? c.email ?? 'Sin contacto'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{cSales.length} compras</p>
                      <p className="text-sm font-black text-gray-700">{formatCurrency(cSales.reduce((s, v) => s + v.total, 0), business?.currency)}</p>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-300"><Users size={48} className="mx-auto mb-3" /><p className="text-sm">Sin clientes registrados</p></div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add client modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900">Nuevo cliente</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              {[['name','Nombre *','Nombre completo',true],['phone','Teléfono','Número de teléfono',false],['email','Correo','correo@ejemplo.com',false]].map(([k,l,p,r]) => (
                <div key={k as string}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{l as string}</label>
                  <input type={k === 'email' ? 'email' : 'text'} required={!!r} value={(form as Record<string,string>)[k as string]}
                    onChange={e => setForm(f => ({ ...f, [k as string]: e.target.value }))} placeholder={p as string}
                    className="w-full mt-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
                </div>
              ))}
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-[#1d4ed8] transition flex items-center justify-center gap-2 disabled:opacity-60">
                <Check size={16} /> {saving ? 'Guardando...' : 'Agregar cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Client detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl">{selected.name.charAt(0)}</div>
                <div><p className="text-white font-black">{selected.name}</p><p className="text-white/60 text-xs">{selected.phone ?? selected.email ?? ''}</p></div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-black text-gray-900">{clientSales.length}</p><p className="text-xs text-gray-400">Compras</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-lg font-black text-[#2563eb]">{formatCurrency(clientTotal, business?.currency)}</p><p className="text-xs text-gray-400">Total gastado</p></div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {clientSales.slice(0, 10).map(s => (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">{formatDate(s.created_at)}</span>
                    <span className="font-bold">{formatCurrency(s.total, business?.currency)}</span>
                  </div>
                ))}
                {clientSales.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Sin compras registradas</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
