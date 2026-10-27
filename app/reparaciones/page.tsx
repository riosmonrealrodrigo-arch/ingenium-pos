'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header';
import PrintTicketModal from '@/components/pos/PrintTicketModal';
import DeviceSecuritySelector, { MiniPatternView } from '@/components/reparaciones/DeviceSecuritySelector';
import {
  Wrench, Plus, Search, Filter, Phone, MessageCircle, Printer,
  CheckCircle2, Clock, AlertCircle, PackageCheck, Smartphone,
  User, ShieldCheck, DollarSign, Calendar, Edit3, X, ChevronRight,
  ExternalLink, RotateCcw, AlertTriangle, Check, RefreshCw, Trash2
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

const OFFICIAL_BUSINESS_ID = '0cb52988-c60c-4b2b-bdba-8cb103434d0d';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

  // Warranty Days Modifier Modal
  const [warrantyModalRepair, setWarrantyModalRepair] = useState<RepairOrder | null>(null);
  const [editWarrantyDays, setEditWarrantyDays] = useState<string>('30');
  const [savingWarranty, setSavingWarranty] = useState(false);

  // Cancellation / Refund Modal
  const [cancelModalRepair, setCancelModalRepair] = useState<RepairOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Cliente desistió / no autorizó reparación');
  const [refundAmount, setRefundAmount] = useState<string>('0.00');
  const [processingCancel, setProcessingCancel] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalRepair, setDeleteModalRepair] = useState<RepairOrder | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);

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
    warranty_days: '30',
    status: 'recibido' as RepairStatus,
  });

  const saveToStorage = (updated: RepairOrder[]) => {
    setRepairs(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_repairs', JSON.stringify(updated));
    }
  };

  const loadRepairs = useCallback(async () => {
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : OFFICIAL_BUSINESS_ID;

    try {
      const { data, error } = await supabase
        .from('repair_orders')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRepairs(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ingenium_repairs', JSON.stringify(data));
        }
        return;
      }
    } catch (e) {
      console.warn('Error loading repairs from Supabase:', e);
    }

    // Fallback a almacenamiento local si no hay conexión
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ingenium_repairs');
      if (stored) {
        try {
          setRepairs(JSON.parse(stored));
          return;
        } catch {}
      }
    }

    setRepairs(DEMO_REPAIRS);
  }, [business]);

  useEffect(() => {
    if (!loading && !profile) router.replace('/login');
  }, [profile, loading, router]);

  // Suscripción Realtime para actualizar la mesa de trabajo de reparaciones en tiempo real
  useEffect(() => {
    loadRepairs();

    try {
      const channel = supabase
        .channel('realtime_repairs_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'repair_orders' },
          () => {
            loadRepairs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime repair subscription error:', e);
    }
  }, [loadRepairs]);

  // Helper to calculate Warranty countdown and dates - La garantía cuenta estrictamente a partir de la fecha de entrega
  const getWarrantyInfo = (rep: RepairOrder) => {
    const days = rep.warranty_days ?? 30;
    const isDelivered = rep.status === 'entregado';
    const isCancelled = rep.status === 'cancelado';

    const formatDateShort = (d: Date) => {
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (isCancelled) {
      return {
        days,
        isDelivered: false,
        isCancelled: true,
        startsAtFormatted: 'Cancelada',
        expiresAtFormatted: 'Sin cobertura',
        daysRemaining: 0,
        isExpired: true,
        statusLabel: 'Cancelada',
      };
    }

    // Si aún no se entrega, la garantía NO debe correr todavía
    if (!isDelivered) {
      return {
        days,
        isDelivered: false,
        isCancelled: false,
        startsAtFormatted: 'Al momento de entrega',
        expiresAtFormatted: `Vigente por ${days} días tras entrega`,
        daysRemaining: days,
        isExpired: false,
        statusLabel: `Inicia al entregar (${days} días)`,
      };
    }

    // Equipo entregado: la garantía empezó a contar el día que se entregó físicamente al cliente
    const startsAt = rep.delivered_at || rep.warranty_starts_at || new Date().toISOString();
    const startDate = new Date(startsAt);
    const expiresDate = rep.warranty_expires_at
      ? new Date(rep.warranty_expires_at)
      : new Date(startDate.getTime() + days * 86400000);

    const now = new Date().getTime();
    const diffMs = expiresDate.getTime() - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    return {
      days,
      isDelivered: true,
      isCancelled: false,
      startsAtFormatted: formatDateShort(startDate),
      expiresAtFormatted: formatDateShort(expiresDate),
      daysRemaining,
      isExpired,
      statusLabel: isExpired ? 'Garantía Vencida' : `🟢 Activa · Quedan ${daysRemaining} día(s)`,
    };
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
      warranty_days: '30',
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
      warranty_days: (rep.warranty_days || 30).toString(),
      status: rep.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.device_model || !formData.issue_reported) return;

    const estCost = parseFloat(formData.estimated_cost) || 0;
    const advPayment = parseFloat(formData.advance_payment) || 0;
    const wDays = parseInt(formData.warranty_days) || 30;

    let updatedList: RepairOrder[] = [];
    const bizId = business?.id && business.id !== 'demo-biz-1' ? business.id : OFFICIAL_BUSINESS_ID;

    if (editingRepair) {
      // La garantía empieza a contar única y exclusivamente desde que se entrega el equipo:
      const isDelivered = formData.status === 'entregado';
      const delivAt = isDelivered ? (editingRepair.delivered_at || new Date().toISOString()) : null;
      const wStarts = isDelivered ? (editingRepair.warranty_starts_at || delivAt) : null;
      const wExpires = wStarts ? new Date(new Date(wStarts).getTime() + wDays * 86400000).toISOString() : null;

      const updatedRepair: RepairOrder = {
        ...editingRepair,
        ...formData,
        warranty_days: wDays,
        warranty_starts_at: wStarts,
        warranty_expires_at: wExpires,
        estimated_cost: estCost,
        advance_payment: advPayment,
        completed_at: formData.status === 'listo_entrega' && !editingRepair.completed_at ? new Date().toISOString() : editingRepair.completed_at,
        delivered_at: delivAt,
      };

      updatedList = repairs.map(r => (r.id === editingRepair.id ? updatedRepair : r));
      saveToStorage(updatedList);

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
      } catch (err) {
        console.warn('Error al actualizar reparación en Supabase:', err);
      }
    } else {
      // Create new with authentic UUID
      const newId = generateUUID();
      const nextFolioNumber = 1000 + repairs.length + 1;
      const newFolio = `ORD-${nextFolioNumber}`;
      const nowIso = new Date().toISOString();

      const newRepair: RepairOrder = {
        id: newId,
        folio: newFolio,
        business_id: bizId,
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
        warranty_days: wDays,
        warranty_starts_at: null,
        warranty_expires_at: null,
        status: formData.status,
        assigned_technician: formData.assigned_technician,
        received_at: nowIso,
        created_at: nowIso,
      };

      try {
        const { data: dbData, error } = await supabase.from('repair_orders').insert({
          id: newId,
          folio: newRepair.folio,
          business_id: bizId,
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
        }).select().single();

        if (!error && dbData) {
          newRepair.id = dbData.id;
        }
      } catch (err) {
        console.warn('Error al guardar reparación en Supabase:', err);
      }

      updatedList = [newRepair, ...repairs];
      saveToStorage(updatedList);

      setPrintRepair(newRepair);
      setIsPrintModalOpen(true);
    }

    setIsModalOpen(false);
  };

  const handleQuickStatusChange = async (rep: RepairOrder, newStatus: RepairStatus) => {
    if (newStatus === 'cancelado') {
      setCancelModalRepair(rep);
      setRefundAmount((rep.advance_payment || 0).toString());
      return;
    }

    const isDelivered = newStatus === 'entregado';
    const isNowReady = newStatus === 'listo_entrega' && rep.status !== 'listo_entrega';
    const compAt = isNowReady ? new Date().toISOString() : rep.completed_at;
    const delivAt = isDelivered ? (rep.delivered_at || new Date().toISOString()) : null;

    const wDays = rep.warranty_days || 30;
    // La garantía empieza a contar única y exclusivamente desde que se entrega el equipo:
    const wStarts = isDelivered ? (rep.warranty_starts_at || delivAt) : null;
    const wExpires = wStarts ? new Date(new Date(wStarts).getTime() + wDays * 86400000).toISOString() : null;

    const updated = repairs.map(r => {
      if (r.id === rep.id) {
        return {
          ...r,
          status: newStatus,
          warranty_starts_at: wStarts,
          warranty_expires_at: wExpires,
          completed_at: compAt,
          delivered_at: delivAt,
        };
      }
      return r;
    });
    saveToStorage(updated);

    try {
      await supabase
        .from('repair_orders')
        .update({
          status: newStatus,
          completed_at: compAt,
          delivered_at: delivAt,
        })
        .eq('id', rep.id);
    } catch (err) {
      console.warn('Error al actualizar estado en Supabase:', err);
    }
  };

  const handleSaveWarrantyModal = () => {
    if (!warrantyModalRepair) return;
    setSavingWarranty(true);
    const days = parseInt(editWarrantyDays) || 30;

    const isDelivered = warrantyModalRepair.status === 'entregado';
    const starts = isDelivered
      ? (warrantyModalRepair.warranty_starts_at || warrantyModalRepair.delivered_at || new Date().toISOString())
      : null;
    const expires = starts ? new Date(new Date(starts).getTime() + days * 86400000).toISOString() : null;

    const updated = repairs.map(r => {
      if (r.id === warrantyModalRepair.id) {
        return {
          ...r,
          warranty_days: days,
          warranty_starts_at: starts,
          warranty_expires_at: expires,
        };
      }
      return r;
    });

    saveToStorage(updated);
    setSavingWarranty(false);
    setWarrantyModalRepair(null);
  };

  const handleConfirmCancelRepair = async () => {
    if (!cancelModalRepair) return;
    setProcessingCancel(true);

    const refunded = parseFloat(refundAmount) || 0;

    const updated = repairs.map(r => {
      if (r.id === cancelModalRepair.id) {
        return {
          ...r,
          status: 'cancelado' as RepairStatus,
          cancellation_reason: cancelReason,
          refund_amount: refunded,
          warranty_starts_at: null,
          warranty_expires_at: null,
        };
      }
      return r;
    });

    saveToStorage(updated);

    try {
      await supabase
        .from('repair_orders')
        .update({
          status: 'cancelado',
          technician_diagnosis: `[Cancelado: ${cancelReason}] ${cancelModalRepair.technician_diagnosis || ''}`.trim(),
        })
        .eq('id', cancelModalRepair.id);
    } catch (err) {
      console.warn('Error al cancelar reparación en Supabase:', err);
    }

    setProcessingCancel(false);
    setCancelModalRepair(null);
  };

  const handleConfirmDeleteRepair = async () => {
    if (!deleteModalRepair) return;
    setProcessingDelete(true);

    const targetId = deleteModalRepair.id;
    const updated = repairs.filter(r => r.id !== targetId);
    saveToStorage(updated);

    try {
      await supabase.from('repair_orders').delete().eq('id', targetId);
    } catch (err) {
      console.warn('Error al eliminar orden de reparación en Supabase:', err);
    }

    setProcessingDelete(false);
    setDeleteModalRepair(null);
  };

  const handleSendWhatsAppNotification = (rep: RepairOrder) => {
    const cleanPhone = rep.client_phone.replace(/\D/g, '');
    const balance = Math.max(0, rep.estimated_cost - rep.advance_payment);
    const statusText = STATUS_CONFIG[rep.status].label;
    const wInfo = getWarrantyInfo(rep);

    let msg = `*INGENIUM MOBILE - Actualización de Reparación*\n\n`;
    msg += `Hola *${rep.client_name}*,\n`;
    msg += `Te informamos que tu equipo *${rep.device_brand} ${rep.device_model}* (Folio: *${rep.folio}*) se encuentra en estado: *${statusText.toUpperCase()}*.\n`;

    if (rep.status === 'listo_entrega') {
      msg += `\n🎉 ¡Tu dispositivo ya está reparado y probado con éxito!\nPuedes pasar a retirarlo a nuestro taller.\nSaldo pendiente a cancelar: *${formatCurrency(balance, business?.currency)}*`;
      msg += `\n🛡️ *Garantía Incluida:* ${wInfo.days} días de cobertura escrita.`;
    } else if (rep.status === 'entregado') {
      msg += `\n✅ Tu equipo ha sido entregado exitosamente.\n🛡️ *Garantía Oficial:* ${wInfo.days} días (Vigente hasta el ${wInfo.expiresAtFormatted}).`;
    } else if (rep.status === 'en_diagnostico') {
      msg += `\n🔬 Nuestro equipo técnico se encuentra realizando pruebas de diagnóstico. Te avisaremos en breve.`;
    } else if (rep.status === 'esperando_repuesto') {
      msg += `\n📦 Estamos esperando el arribo de la refacción original correspondiente para proceder con el ensamble final.`;
    } else if (rep.status === 'cancelado') {
      msg += `\n⚠️ Tu orden ha sido cancelada. Motivo: ${rep.cancellation_reason || 'Cancelación de servicio'}.`;
    }

    msg += `\n\n_INGENIUM MOBILE · Servicio Técnico Especializado_`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Filter repairs
  const filteredRepairs = repairs.filter(r => {
    const matchSearch =
      r.folio.toLowerCase().includes(search.toLowerCase()) ||
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.client_phone.includes(search) ||
      `${r.device_brand} ${r.device_model}`.toLowerCase().includes(search.toLowerCase());

    const matchStatus = selectedStatus === 'todos' || r.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const inWorkshop = repairs.filter(r => ['recibido', 'en_diagnostico', 'esperando_repuesto'].includes(r.status)).length;
  const readyForPickup = repairs.filter(r => r.status === 'listo_entrega').length;
  const completed = repairs.filter(r => r.status === 'entregado').length;
  const activeWarrantiesCount = repairs.filter(r => r.status === 'entregado' && !getWarrantyInfo(r).isExpired).length;

  if (loading || !profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-52 min-w-0 max-w-full flex flex-col pb-20 lg:pb-0 overflow-x-hidden">
        <Header
          title="Taller & Reparaciones"
          subtitle="Control de órdenes de servicio, presupuestos, devoluciones y garantías"
        />

        <main className="p-3 sm:p-4 lg:p-6 space-y-5 max-w-7xl mx-auto w-full">

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">En Reparación</p>
                <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{inWorkshop}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wrench size={18} />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Listos para Entrega</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{readyForPickup}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Equipos Entregados</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{completed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PackageCheck size={18} />
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Garantías Activas</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{activeWarrantiesCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
            </div>
          </div>

          {/* Action Header: Search & Create */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por folio, cliente, teléfono o modelo de celular..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Nube en vivo</span>
              </span>
              <button
                type="button"
                onClick={() => loadRepairs()}
                className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition shadow-2xs cursor-pointer"
                title="Sincronizar órdenes de reparación con Supabase"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 sm:px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition whitespace-nowrap cursor-pointer"
              >
                <Plus size={16} />
                <span>Nueva Orden de Taller</span>
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedStatus('todos')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedStatus === 'todos'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{conf.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Repair Orders List */}
          <div className="space-y-3.5">
            {filteredRepairs.map(rep => {
              const status = STATUS_CONFIG[rep.status] || STATUS_CONFIG.recibido;
              const StatusIcon = status.icon;
              const pendingBalance = Math.max(0, rep.estimated_cost - rep.advance_payment);
              const wInfo = getWarrantyInfo(rep);
              const isCancelled = rep.status === 'cancelado';

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 sm:p-5 hover:border-blue-200 transition space-y-4"
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
                      {isCancelled && rep.cancellation_reason && (
                        <span className="text-[10.5px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
                          Motivo: {rep.cancellation_reason}
                        </span>
                      )}
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
                        <div className="bg-amber-50/80 p-1.5 rounded-xl border border-amber-200/80 w-fit mt-1">
                          <MiniPatternView patternString={rep.unlock_pattern} size={50} />
                        </div>
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
                      {isCancelled && rep.refund_amount !== undefined && rep.refund_amount > 0 && (
                        <div className="text-[10.5px] text-red-600 font-bold pt-0.5">
                          Devolución efectuada: {formatCurrency(rep.refund_amount, business?.currency)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LIVE WARRANTY STRIP & COUNTDOWN */}
                  {!isCancelled && (
                    <div
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                        rep.status === 'entregado'
                          ? wInfo.isExpired
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-blue-50/50 border-blue-100 text-blue-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${
                          rep.status === 'entregado'
                            ? wInfo.isExpired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs">
                              Garantía Oficial: {wInfo.days} días
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                rep.status === 'entregado'
                                  ? wInfo.isExpired
                                    ? 'bg-amber-200 text-amber-900'
                                    : 'bg-emerald-200 text-emerald-900'
                                  : 'bg-blue-200 text-blue-900'
                              }`}
                            >
                              {rep.status === 'entregado'
                                ? wInfo.isExpired
                                  ? `Venció hace ${Math.abs(wInfo.daysRemaining)} día(s)`
                                  : `🟢 Activa · Quedan ${wInfo.daysRemaining} día(s)`
                                : `⏱️ Inicia al entregar al cliente`}
                            </span>
                          </div>
                          <p className="text-[11px] opacity-75 mt-0.5">
                            {rep.status === 'entregado'
                              ? `Cobertura iniciada el ${wInfo.startsAtFormatted} (vigente hasta el ${wInfo.expiresAtFormatted})`
                              : `La garantía de ${wInfo.days} días comenzará a correr a partir de que entregues el equipo al cliente.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setWarrantyModalRepair(rep);
                            setEditWarrantyDays((rep.warranty_days || 30).toString());
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          Modificar días
                        </button>
                      </div>
                    </div>
                  )}

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
                        <option value="cancelado">Cancelado / Devolución</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* WhatsApp Notify */}
                      <button
                        onClick={() => handleSendWhatsAppNotification(rep)}
                        className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Enviar actualización por WhatsApp"
                      >
                        <MessageCircle size={14} className="text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {/* Print Ticket */}
                      <button
                        onClick={() => {
                          setPrintRepair(rep);
                          setIsPrintModalOpen(true);
                        }}
                        className="px-2.5 sm:px-3 py-1.5 bg-blue-50 text-[#2563eb] hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Imprimir comprobante para el cliente"
                      >
                        <Printer size={14} />
                        <span className="hidden sm:inline">Ticket</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEditModal(rep)}
                        className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        title="Editar detalles de la orden"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Cancel Order */}
                      {rep.status !== 'cancelado' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModalRepair(rep);
                            setRefundAmount((rep.advance_payment || 0).toString());
                          }}
                          className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Cancelar orden y registrar reembolso si hubo anticipo"
                        >
                          <RotateCcw size={13} />
                          <span>Cancelar</span>
                        </button>
                      )}

                      {/* Delete Order Permanently */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalRepair(rep)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Eliminar orden definitivamente de la base de datos"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRepairs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 space-y-3">
                <Wrench size={48} className="mx-auto text-gray-300" />
                <h3 className="font-bold text-gray-700 text-base">No hay órdenes de reparación con estos criterios</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Crea una nueva orden de servicio ingresando los datos del cliente y el dispositivo celular.
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
                >
                  <Plus size={14} />
                  <span>Crear Primera Orden</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: MODIFICAR DÍAS DE GARANTÍA */}
      {warrantyModalRepair && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Modificar Garantía</h3>
                  <p className="text-xs text-gray-500">
                    {warrantyModalRepair.device_brand} {warrantyModalRepair.device_model} ({warrantyModalRepair.folio})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarrantyModalRepair(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Selecciona o escribe los días de cobertura:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['15', '30', '60', '90'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEditWarrantyDays(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        editWarrantyDays === d
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editWarrantyDays}
                    onChange={e => setEditWarrantyDays(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                    placeholder="Días personalizados"
                  />
                  <span className="font-bold text-gray-500">días en total</span>
                </div>
              </div>

              {/* Previsualización en vivo del contador */}
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                <p className="font-black text-xs flex items-center gap-1.5 text-emerald-900">
                  <Check size={14} /> Cálculo automático en vivo
                </p>
                <p className="text-[11px]">
                  <strong>Fecha de inicio:</strong>{' '}
                  {new Date(
                    warrantyModalRepair.warranty_starts_at || warrantyModalRepair.delivered_at || new Date()
                  ).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[11px]">
                  <strong>Vencimiento estimado:</strong>{' '}
                  {new Date(
                    new Date(
                      warrantyModalRepair.warranty_starts_at || warrantyModalRepair.delivered_at || new Date()
                    ).getTime() + (parseInt(editWarrantyDays) || 30) * 86400000
                  ).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setWarrantyModalRepair(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveWarrantyModal}
                disabled={savingWarranty}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {savingWarranty ? 'Guardando...' : 'Aplicar Garantía'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELACIÓN Y DEVOLUCIÓN DE REPARACIÓN */}
      {cancelModalRepair && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900">Cancelar Trabajo de Taller</h3>
                <p className="text-xs text-gray-500">Orden: {cancelModalRepair.folio}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motivo de la cancelación / devolución:</label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="Cliente desistió / no autorizó reparación">Cliente desistió / no autorizó reparación</option>
                  <option value="Refacción no disponible en mercado">Refacción no disponible en mercado</option>
                  <option value="Equipo irreparable / placa con daño severo">Equipo irreparable / placa con daño severo</option>
                  <option value="Devolución de anticipo solicitada">Devolución de anticipo solicitada</option>
                  <option value="Otro motivo">Otro motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Monto a reembolsar al cliente ({business?.currency ?? '$ MXN'}):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Anticipo original pagado: {formatCurrency(cancelModalRepair.advance_payment, business?.currency)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalRepair(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelRepair}
                disabled={processingCancel}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {processingCancel ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINACIÓN DEFINITIVA DE REPARACIÓN */}
      {deleteModalRepair && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900">¿Eliminar orden de taller?</h3>
                <p className="text-xs text-gray-500 font-mono">Folio: {deleteModalRepair.folio}</p>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-xs text-red-900 space-y-1">
              <p className="font-bold">Cliente: {deleteModalRepair.client_name}</p>
              <p>Dispositivo: {deleteModalRepair.device_brand} {deleteModalRepair.device_model}</p>
              <p className="text-[11px] text-red-700 pt-1 border-t border-red-200">
                ⚠️ Se eliminará permanentemente de la base de datos en la nube y de tus registros locales. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalRepair(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRepair}
                disabled={processingDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {processingDelete ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT REPAIR ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto border border-gray-100 animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
                  <Wrench size={18} />
                </div>
                <h3 className="font-black text-gray-900 text-base">
                  {editingRepair ? `Editar Orden: ${editingRepair.folio}` : 'Nueva Orden de Reparación'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="space-y-4 mt-4">
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
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      required
                      value={formData.client_phone}
                      onChange={e => setFormData({ ...formData, client_phone: e.target.value })}
                      placeholder="+52 81 0000 0000"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">2. Datos del Dispositivo</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Marca</label>
                    <input
                      value={formData.device_brand}
                      onChange={e => setFormData({ ...formData, device_brand: e.target.value })}
                      placeholder="Apple, Samsung, Xiaomi..."
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Modelo *</label>
                    <input
                      required
                      value={formData.device_model}
                      onChange={e => setFormData({ ...formData, device_model: e.target.value })}
                      placeholder="iPhone 13, Galaxy A54..."
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Color / Detalles</label>
                    <input
                      value={formData.device_color}
                      onChange={e => setFormData({ ...formData, device_color: e.target.value })}
                      placeholder="Azul, Negro, Gris..."
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">IMEI / Número de Serie</label>
                  <input
                    value={formData.imei_serial}
                    onChange={e => setFormData({ ...formData, imei_serial: e.target.value })}
                    placeholder="Opcional pero recomendado"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>

                {/* Selector Inteligente de Seguridad: PIN, Patrón 3x3, Contraseña o Sin Bloqueo */}
                <div className="pt-1">
                  <DeviceSecuritySelector
                    value={formData.unlock_pattern}
                    onChange={val => setFormData({ ...formData, unlock_pattern: val })}
                  />
                </div>
              </div>

              {/* Diagnosis and Issue */}
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
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">4. Presupuesto, Garantía y Estado</p>
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

                {/* Warranty Days Input */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-emerald-900">
                      🛡️ Días de Garantía del Trabajo:
                    </label>
                    <span className="text-xs font-bold text-emerald-700">
                      {formData.warranty_days} días
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {['15', '30', '60', '90'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, warranty_days: d })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          formData.warranty_days === d
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {d} días
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.warranty_days}
                      onChange={e => setFormData({ ...formData, warranty_days: e.target.value })}
                      placeholder="Días"
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center bg-white"
                    />
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
                  className="px-6 py-2 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/20 active:scale-95 transition cursor-pointer"
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
