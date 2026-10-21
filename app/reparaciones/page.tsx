'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import PrintTicketModal from '@/components/pos/PrintTicketModal';
import {
  Wrench, Plus, Search, Filter, Phone, MessageCircle, Printer,
  CheckCircle2, Clock, AlertCircle, PackageCheck, Smartphone,
  User, ShieldCheck, DollarSign, Calendar, Edit3, X, ChevronRight,
  ExternalLink
} from 'lucide-react';
import { RepairOrder, RepairStatus } from '@/types';
import { DEMO_REPAIRS } from '@/lib/mockData';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const STATUS_CONFIG: Record<RepairStatus, { label: string; bg: string; text: string; icon: any }> = {
  recibido: { label: 'Recibido', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: Clock },
  en_diagnostico: { label: 'En Diagnóstico', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: AlertCircle },
  esperando_repuesto: { label: 'Esperando Repuesto', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', icon: Wrench },
  listo_entrega: { label: 'Listo para Entrega', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
  entregado: { label: 'Entregado', bg: 'bg-gray-100 text-gray-700 border-gray-300', text: 'text-gray-700', icon: PackageCheck },
  cancelado: { label: 'Cancelado', bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', icon: X },
};

export default function ReparacionesPage() {
  const { profile, business, loading } = useAuth();
  const router = useRouter();

  const [repairs, setRepairs] = useState<RepairOrder[]>(DEMO_REPAIRS);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairOrder | null>(null);

  // Print modal state
  const [printRepair, setPrintRepair] = useState<RepairOrder | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    device_brand: '',
    device_model: '',
    device_color: '',
    imei_serial: '',
    unlock_pattern: '',
    issue_reported: '',
    technician_diagnosis: '',
    estimated_cost: '',
    advance_payment: '',
    assigned_technician: '',
    status: 'recibido' as RepairStatus,
  });

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  // Load repairs from Supabase or localStorage
  useEffect(() => {
    loadRepairs();
  }, [business]);

  const loadRepairs = async () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ingenium_repairs');
      if (stored) {
        try {
          setRepairs(JSON.parse(stored));
          return;
        } catch {}
      }
    }

    if (business && business.id !== 'demo-biz-1') {
      try {
        const { data, error } = await supabase
          .from('repair_orders')
          .select('*')
          .eq('business_id', business.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setRepairs(data);
          saveToStorage(data);
          return;
        }
      } catch (e) {
        console.warn('Fallback to demo repairs:', e);
      }
    }

    setRepairs(DEMO_REPAIRS);
  };

  const saveToStorage = (updated: RepairOrder[]) => {
    setRepairs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_repairs', JSON.stringify(updated));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRepair(null);
    setFormData({
      client_name: '',
      client_phone: '',
      client_email: '',
      device_brand: '',
      device_model: '',
      device_color: '',
      imei_serial: '',
      unlock_pattern: '',
      issue_reported: '',
      technician_diagnosis: '',
      estimated_cost: '',
      advance_payment: '',
      assigned_technician: profile?.name || 'Técnico General',
      status: 'recibido',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rep: RepairOrder) => {
    setEditingRepair(rep);
    setFormData({
      client_name: rep.client_name,
      client_phone: rep.client_phone,
      client_email: rep.client_email || '',
      device_brand: rep.device_brand,
      device_model: rep.device_model,
      device_color: rep.device_color || '',
      imei_serial: rep.imei_serial || '',
      unlock_pattern: rep.unlock_pattern || '',
      issue_reported: rep.issue_reported,
      technician_diagnosis: rep.technician_diagnosis || '',
      estimated_cost: rep.estimated_cost.toString(),
      advance_payment: rep.advance_payment.toString(),
      assigned_technician: rep.assigned_technician || '',
      status: rep.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.device_model || !formData.issue_reported) return;

    const estCost = parseFloat(formData.estimated_cost) || 0;
    const advPayment = parseFloat(formData.advance_payment) || 0;

    let updatedList: RepairOrder[] = [];

    if (editingRepair) {
      // Update
      const updatedRepair: RepairOrder = {
        ...editingRepair,
        ...formData,
        estimated_cost: estCost,
        advance_payment: advPayment,
        completed_at: formData.status === 'listo_entrega' && !editingRepair.completed_at ? new Date().toISOString() : editingRepair.completed_at,
        delivered_at: formData.status === 'entregado' && !editingRepair.delivered_at ? new Date().toISOString() : editingRepair.delivered_at,
      };

      updatedList = repairs.map(r => (r.id === editingRepair.id ? updatedRepair : r));
      saveToStorage(updatedList);

      // Save to Supabase in background
      if (business && business.id !== 'demo-biz-1') {
        try {
          await supabase.from('repair_orders').update({
            client_name: updatedRepair.client_name,
            client_phone: updatedRepair.client_phone,
            client_email: updatedRepair.client_email,
            device_brand: updatedRepair.device_brand,
            device_model: updatedRepair.device_model,
            device_color: updatedRepair.device_color,
            imei_serial: updatedRepair.imei_serial,
            unlock_pattern: updatedRepair.unlock_pattern,
            issue_reported: updatedRepair.issue_reported,
            technician_diagnosis: updatedRepair.technician_diagnosis,
            estimated_cost: updatedRepair.estimated_cost,
            advance_payment: updatedRepair.advance_payment,
            status: updatedRepair.status,
            assigned_technician: updatedRepair.assigned_technician,
            completed_at: updatedRepair.completed_at,
            delivered_at: updatedRepair.delivered_at,
          }).eq('id', updatedRepair.id);
        } catch {}
      }
    } else {
      // Create new
      const nextFolioNumber = 1000 + repairs.length + 1;
      const newFolio = `ORD-${nextFolioNumber}`;

      const newRepair: RepairOrder = {
        id: `rep-${Date.now()}`,
        folio: newFolio,
        business_id: business?.id || 'demo-biz-1',
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        device_brand: formData.device_brand,
        device_model: formData.device_model,
        device_color: formData.device_color,
        imei_serial: formData.imei_serial,
        unlock_pattern: formData.unlock_pattern,
        issue_reported: formData.issue_reported,
        technician_diagnosis: formData.technician_diagnosis,
        estimated_cost: estCost,
        advance_payment: advPayment,
        status: formData.status,
        assigned_technician: formData.assigned_technician,
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      updatedList = [newRepair, ...repairs];
      saveToStorage(updatedList);

      // Offer printing immediately
      setPrintRepair(newRepair);
      setIsPrintModalOpen(true);

      // Save to Supabase
      if (business && business.id !== 'demo-biz-1') {
        try {
          await supabase.from('repair_orders').insert([{
            folio: newRepair.folio,
            business_id: newRepair.business_id,
            client_name: newRepair.client_name,
            client_phone: newRepair.client_phone,
            client_email: newRepair.client_email,
            device_brand: newRepair.device_brand,
            device_model: newRepair.device_model,
            device_color: newRepair.device_color,
            imei_serial: newRepair.imei_serial,
            unlock_pattern: newRepair.unlock_pattern,
            issue_reported: newRepair.issue_reported,
            technician_diagnosis: newRepair.technician_diagnosis,
            estimated_cost: newRepair.estimated_cost,
            advance_payment: newRepair.advance_payment,
            status: newRepair.status,
            assigned_technician: newRepair.assigned_technician,
            received_at: newRepair.received_at,
          }]);
        } catch {}
      }
    }

    setIsModalOpen(false);
  };

  const handleQuickStatusChange = async (rep: RepairOrder, newStatus: RepairStatus) => {
    const updated = repairs.map(r => {
      if (r.id === rep.id) {
        return {
          ...r,
          status: newStatus,
          completed_at: newStatus === 'listo_entrega' ? new Date().toISOString() : r.completed_at,
          delivered_at: newStatus === 'entregado' ? new Date().toISOString() : r.delivered_at,
        };
      }
      return r;
    });
    saveToStorage(updated);

    if (business && business.id !== 'demo-biz-1') {
      try {
        await supabase
          .from('repair_orders')
          .update({
            status: newStatus,
            completed_at: newStatus === 'listo_entrega' ? new Date().toISOString() : undefined,
            delivered_at: newStatus === 'entregado' ? new Date().toISOString() : undefined,
          })
          .eq('id', rep.id);
      } catch {}
    }
  };

  const handleSendWhatsAppNotification = (rep: RepairOrder) => {
    const cleanPhone = rep.client_phone.replace(/[^0-9]/g, '');
    const bizName = business?.name || 'INGENIUM MÓVIL';
    const statusText = STATUS_CONFIG[rep.status].label;

    let msg = `Hola *${rep.client_name}*, te saludamos de *${bizName}*.\n\n`;
    msg += `Te informamos que tu equipo *${rep.device_brand} ${rep.device_model}* (Folio: *${rep.folio}*) se encuentra en estado: *${statusText.toUpperCase()}*.\n`;

    if (rep.status === 'listo_entrega') {
      const balance = Math.max(0, rep.estimated_cost - rep.advance_payment);
      msg += `\n🎉 ¡Tu dispositivo ya está reparado y probado con éxito!\nPuedes pasar a retirarlo a nuestro taller.\nSaldo pendiente a cancelar: *${formatCurrency(balance, business?.currency)}*`;
    } else if (rep.status === 'en_diagnostico') {
      msg += `\nNuestros técnicos están revisando minuciosamente la falla reportada: "${rep.issue_reported}". Te contactaremos con el diagnóstico en breve.`;
    } else if (rep.status === 'esperando_repuesto') {
      msg += `\nHemos solicitado la refacción original requerida. Te avisaremos en cuanto esté instalada y lista.`;
    }

    msg += `\n\n¡Gracias por tu confianza!`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Filtered list
  const filteredRepairs = repairs.filter(r => {
    const matchSearch =
      r.folio.toLowerCase().includes(search.toLowerCase()) ||
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.client_phone.toLowerCase().includes(search.toLowerCase()) ||
      r.device_model.toLowerCase().includes(search.toLowerCase()) ||
      (r.imei_serial && r.imei_serial.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = selectedStatus === 'todos' || r.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // Metrics
  const totalRepairs = repairs.length;
  const inWorkshop = repairs.filter(r => ['recibido', 'en_diagnostico', 'esperando_repuesto'].includes(r.status)).length;
  const readyForPickup = repairs.filter(r => r.status === 'listo_entrega').length;
  const completed = repairs.filter(r => r.status === 'entregado').length;

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col pb-20 lg:pb-0">
        <Header
          title="Taller y Reparaciones"
          subtitle="Control de órdenes de servicio, diagnósticos técnicos y entregas"
        />

        <main className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto w-full">
          
          {/* Top Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
                <Wrench size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Total Órdenes</p>
                <p className="text-xl font-black text-gray-900">{totalRepairs}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">En Taller</p>
                <p className="text-xl font-black text-amber-600">{inWorkshop}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Listos p/ Entrega</p>
                <p className="text-xl font-black text-emerald-600">{readyForPickup}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
                <PackageCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">Entregados</p>
                <p className="text-xl font-black text-gray-700">{completed}</p>
              </div>
            </div>
          </div>

          {/* Action and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por cliente, teléfono, modelo, IMEI o folio (ej. ORD-1001)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} /> Nueva Orden de Reparación
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedStatus('todos')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                selectedStatus === 'todos'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Todos ({repairs.length})
            </button>
            {Object.entries(STATUS_CONFIG).map(([statusKey, conf]) => {
              const count = repairs.filter(r => r.status === statusKey).length;
              const isSelected = selectedStatus === statusKey;
              return (
                <button
                  key={statusKey}
                  onClick={() => setSelectedStatus(statusKey)}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#2563eb] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{conf.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Repair Orders List */}
          <div className="space-y-3">
            {filteredRepairs.map(rep => {
              const status = STATUS_CONFIG[rep.status] || STATUS_CONFIG.recibido;
              const StatusIcon = status.icon;
              const pendingBalance = Math.max(0, rep.estimated_cost - rep.advance_payment);

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:border-blue-200 transition space-y-4"
                >
                  {/* Top Row: Folio, Status Pill & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {rep.folio}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${status.bg}`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Calendar size={13} />
                      <span>Ingreso: {formatDateTime(rep.received_at || rep.created_at)}</span>
                    </div>
                  </div>

                  {/* Middle Section: Client + Device Info + Financials */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1: Client Info */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Cliente</p>
                      <p className="font-bold text-gray-900 text-sm">{rep.client_name}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Phone size={12} className="text-gray-400" />
                        <span>{rep.client_phone}</span>
                      </p>
                      {rep.client_email && (
                        <p className="text-xs text-gray-400 truncate">{rep.client_email}</p>
                      )}
                    </div>

                    {/* Column 2: Device & Diagnosis */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Equipo / Falla</p>
                      <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <Smartphone size={14} className="text-[#2563eb]" />
                        <span>{rep.device_brand} {rep.device_model}</span>
                        {rep.device_color && <span className="text-xs text-gray-400">({rep.device_color})</span>}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        <strong className="text-gray-700">Falla:</strong> {rep.issue_reported}
                      </p>
                      {rep.unlock_pattern && (
                        <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded w-fit">
                          🔒 {rep.unlock_pattern}
                        </p>
                      )}
                    </div>

                    {/* Column 3: Costs and Balance */}
                    <div className="space-y-1 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Presupuesto y Cobro</p>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Total estimado:</span>
                        <span className="font-bold text-gray-800">{formatCurrency(rep.estimated_cost, business?.currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-700">
                        <span>Anticipo:</span>
                        <span className="font-bold">{formatCurrency(rep.advance_payment, business?.currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-red-600 pt-1 border-t border-gray-200">
                        <span>Saldo por cobrar:</span>
                        <span>{formatCurrency(pendingBalance, business?.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    {/* Status Changer */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">Estado:</span>
                      <select
                        value={rep.status}
                        onChange={e => handleQuickStatusChange(rep, e.target.value as RepairStatus)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      >
                        <option value="recibido">Recibido</option>
                        <option value="en_diagnostico">En Diagnóstico</option>
                        <option value="esperando_repuesto">Esperando Repuesto</option>
                        <option value="listo_entrega">Listo para Entrega</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* WhatsApp Notify */}
                      <button
                        onClick={() => handleSendWhatsAppNotification(rep)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        title="Enviar actualización por WhatsApp"
                      >
                        <MessageCircle size={14} className="text-emerald-600" />
                        <span>Avisar WhatsApp</span>
                      </button>

                      {/* Print Ticket */}
                      <button
                        onClick={() => {
                          setPrintRepair(rep);
                          setIsPrintModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-[#2563eb] hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        title="Imprimir comprobante para el cliente"
                      >
                        <Printer size={14} />
                        <span>Imprimir Ticket</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(rep)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="Editar detalles de la orden"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRepairs.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 space-y-3">
                <Wrench size={48} className="mx-auto text-gray-300" />
                <p className="font-bold text-gray-700">No se encontraron órdenes de reparación</p>
                <p className="text-xs">Crea una nueva orden para comenzar a gestionar el taller.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2563eb] flex items-center justify-center">
                  <Wrench size={18} />
                </div>
                <h3 className="font-black text-gray-900 text-sm sm:text-base">
                  {editingRepair ? `Editar Orden ${editingRepair.folio}` : 'Nueva Orden de Reparación'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Client Info */}
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">1. Datos del Cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo *</label>
                    <input
                      required
                      value={formData.client_name}
                      onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      required
                      value={formData.client_phone}
                      onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="Ej: +502 4123-4567"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Correo Electrónico (opcional)</label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={e => setFormData({ ...formData, client_email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              {/* Device Info */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">2. Datos del Dispositivo</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Marca *</label>
                    <input
                      required
                      value={formData.device_brand}
                      onChange={e => setFormData({ ...formData, device_brand: e.target.value })}
                      placeholder="Ej: Apple, Samsung, Xiaomi"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Modelo *</label>
                    <input
                      required
                      value={formData.device_model}
                      onChange={e => setFormData({ ...formData, device_model: e.target.value })}
                      placeholder="Ej: iPhone 13 Pro"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Color</label>
                    <input
                      value={formData.device_color}
                      onChange={e => setFormData({ ...formData, device_color: e.target.value })}
                      placeholder="Ej: Azul Sierra"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">IMEI o Número de Serie</label>
                    <input
                      value={formData.imei_serial}
                      onChange={e => setFormData({ ...formData, imei_serial: e.target.value })}
                      placeholder="Ej: 354892019283741"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Patrón de Desbloqueo / PIN</label>
                    <input
                      value={formData.unlock_pattern}
                      onChange={e => setFormData({ ...formData, unlock_pattern: e.target.value })}
                      placeholder="Ej: PIN 1234 o Patrón en forma de L"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>
              </div>

              {/* Technical diagnosis */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">3. Falla y Diagnóstico</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Falla Reportada por el Cliente *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.issue_reported}
                    onChange={e => setFormData({ ...formData, issue_reported: e.target.value })}
                    placeholder="Describe exactamente qué reporta el cliente..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Diagnóstico Técnico Inicial</label>
                  <textarea
                    rows={2}
                    value={formData.technician_diagnosis}
                    onChange={e => setFormData({ ...formData, technician_diagnosis: e.target.value })}
                    placeholder="Observaciones iniciales del técnico..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
                  />
                </div>
              </div>

              {/* Financials & Status */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">4. Presupuesto y Estado</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Presupuesto Estimado</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimated_cost}
                      onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Anticipo Dejado</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advance_payment}
                      onChange={e => setFormData({ ...formData, advance_payment: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Estado de la Orden</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as RepairStatus })}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="recibido">Recibido</option>
                      <option value="en_diagnostico">En Diagnóstico</option>
                      <option value="esperando_repuesto">Esperando Repuesto</option>
                      <option value="listo_entrega">Listo para Entrega</option>
                      <option value="entregado">Entregado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 active:scale-95 transition"
                >
                  {editingRepair ? 'Guardar Cambios' : 'Crear e Imprimir Orden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET PRINT MODAL */}
      <PrintTicketModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintRepair(null);
        }}
        repair={printRepair}
        currency={business?.currency}
      />

      <BottomNav />
    </div>
  );
}
