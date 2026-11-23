'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Edit2,
  Image as ImageIcon,
  Camera,
  Upload,
  Link2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Power,
  RotateCcw,
} from 'lucide-react';
import {
  StoreAdBanner,
  StoreAdsConfig,
  getStoreAdsConfig,
  saveStoreAdsConfig,
  DEFAULT_ADS,
} from '@/lib/storeAds';
import { compressImage } from '@/lib/utils';

interface StoreAdsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdsUpdated?: () => void;
}

const GRADIENT_PRESETS = [
  { name: 'Cyber Blue', value: 'from-[#0f172a] via-[#1e3a5f] to-[#2563eb]' },
  { name: 'Fuego / Naranja', value: 'from-[#431407] via-[#9a3412] to-[#ea580c]' },
  { name: 'Esmeralda Pro', value: 'from-[#022c22] via-[#064e3b] to-[#059669]' },
  { name: 'Púrpura Neón', value: 'from-[#1e1b4b] via-[#312e81] to-[#7c3aed]' },
  { name: 'Titanio Carbón', value: 'from-[#18181b] via-[#27272a] to-[#52525b]' },
];

export default function StoreAdsManagerModal({
  isOpen,
  onClose,
  onAdsUpdated,
}: StoreAdsManagerModalProps) {
  const [ads, setAds] = useState<StoreAdBanner[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [editingAd, setEditingAd] = useState<StoreAdBanner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getStoreAdsConfig().then(config => {
        setGlobalEnabled(config.global_enabled);
        setAds(config.ads);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    setAds(prev =>
      prev.map(ad => (ad.id === id ? { ...ad, active: !ad.active } : ad))
    );
  };

  const handleToggleGlobal = async () => {
    const nextState = !globalEnabled;
    setGlobalEnabled(nextState);
    setSaving(true);
    await saveStoreAdsConfig({
      global_enabled: nextState,
      ads,
    });
    setSaving(false);
    setSuccess(
      nextState
        ? '¡Anuncios ACTIVADOS en la tienda web!'
        : '¡Todos los anuncios han sido COMPLETAMENTE DESACTIVADOS en la tienda web!'
    );
    if (onAdsUpdated) onAdsUpdated();
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleDeactivateAllAds = () => {
    const updated = ads.map(a => ({ ...a, active: false }));
    setAds(updated);
  };

  const handleActivateAllAds = () => {
    const updated = ads.map(a => ({ ...a, active: true }));
    setAds(updated);
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ads.length) return;
    const next = [...ads];
    [next[index], next[target]] = [next[target], next[index]];
    setAds(next);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Deseas eliminar este anuncio promocional?')) {
      setAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const handleSaveAll = async (listToSave = ads, isGlobalEnabled = globalEnabled) => {
    setSaving(true);
    await saveStoreAdsConfig({
      global_enabled: isGlobalEnabled,
      ads: listToSave,
    });
    setSaving(false);
    setSuccess('¡Anuncios guardados y sincronizados con todos los dispositivos!');
    if (onAdsUpdated) onAdsUpdated();
    setTimeout(() => setSuccess(''), 3500);
  };

  const handleCreateNew = () => {
    const newAd: StoreAdBanner = {
      id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: '¡Nueva Promoción Especial!',
      subtitle: 'Aprovecha ofertas exclusivas y piezas garantizadas en INGENIUM MOBILE.',
      badge_text: '⚡ OFERTA LIMITADA',
      image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
      button_text: 'Ver en Tienda',
      button_link: '#catalogo',
      gradient_style: 'from-[#0f172a] via-[#1e3a5f] to-[#2563eb]',
      active: true,
      created_at: new Date().toISOString(),
    };
    setEditingAd(newAd);
  };

  const handleSaveEditing = () => {
    if (!editingAd) return;
    if (!editingAd.title.trim()) {
      alert('Por favor escribe un título para el anuncio.');
      return;
    }

    let nextList: StoreAdBanner[];
    const exists = ads.some(a => a.id === editingAd.id);
    if (exists) {
      nextList = ads.map(a => (a.id === editingAd.id ? editingAd : a));
    } else {
      nextList = [editingAd, ...ads];
    }

    setAds(nextList);
    setEditingAd(null);
    handleSaveAll(nextList);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingAd) return;

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 1024, 768, 0.75);
      setEditingAd(prev => (prev ? { ...prev, image_url: compressed } : null));
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      alert('No se pudo procesar la imagen seleccionada.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base leading-tight">
                Anuncios y Banners de la Tienda Web
              </h3>
              <p className="text-xs text-gray-500">
                Sube fotos, edita promociones y activa/desactiva avisos para tus clientes
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

        {/* INTERRUPTOR MAESTRO: Activar o Desactivar Anuncios Completamente en la Tienda Web */}
        <div className={`mt-3 p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          globalEnabled 
            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-200 text-red-950'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              globalEnabled ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {globalEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm leading-tight">
                  {globalEnabled ? 'Anuncios ACTIVADOS en Tienda Web' : 'Anuncios COMPLETAMENTE DESACTIVADOS'}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  globalEnabled ? 'bg-emerald-200/90 text-emerald-900' : 'bg-red-200/90 text-red-900'
                }`}>
                  {globalEnabled ? 'Activo en Tienda' : 'Apagado Total'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                {globalEnabled 
                  ? 'Los clientes verán los anuncios activos en el carrusel de la tienda web.' 
                  : 'Ningún anuncio se mostrará a los clientes, sin importar cuántos tengas creados.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGlobal}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap ${
              globalEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {globalEnabled ? (
              <>
                <EyeOff size={14} />
                <span>Desactivar Todos los Anuncios</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Activar Anuncios en Tienda</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-1 flex-1 mt-3 space-y-4">
          {editingAd ? (
            /* Formulario de Edición / Creación de Anuncio */
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  <Edit2 size={13} className="text-[#2563eb]" />
                  {ads.some(a => a.id === editingAd.id) ? 'Editar Anuncio' : 'Nuevo Anuncio'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* Título y Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Título Principal *
                  </label>
                  <input
                    type="text"
                    value={editingAd.title}
                    onChange={e => setEditingAd({ ...editingAd, title: e.target.value })}
                    placeholder="Ej: ¡20% de Descuento en Cambio de Pantallas!"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Etiqueta / Insignia
                  </label>
                  <input
                    type="text"
                    value={editingAd.badge_text || ''}
                    onChange={e => setEditingAd({ ...editingAd, badge_text: e.target.value })}
                    placeholder="Ej: ⚡ OFERTA TALLER"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-amber-700 focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              {/* Subtítulo / Descripción */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  Subtítulo / Mensaje Promocional
                </label>
                <textarea
                  rows={2}
                  value={editingAd.subtitle}
                  onChange={e => setEditingAd({ ...editingAd, subtitle: e.target.value })}
                  placeholder="Detalles de la oferta, garantía, tiempo de entrega o condiciones..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none resize-none"
                />
              </div>

              {/* Imagen del Banner (Cámara / Archivo / URL) */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2.5">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Foto o Imagen del Anuncio
                </label>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563eb] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    Subir foto (PC / Celular)
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera size={13} /> Tomar foto
                  </button>

                  <div className="relative flex-1 w-full">
                    <Link2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      placeholder="O pegar URL (https://...)"
                      value={editingAd.image_url || ''}
                      onChange={e => setEditingAd({ ...editingAd, image_url: e.target.value })}
                      className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Preview de la imagen */}
                {editingAd.image_url && (
                  <div className="relative h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={editingAd.image_url}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingAd({ ...editingAd, image_url: '' })}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full text-xs shadow hover:bg-red-700 cursor-pointer"
                      title="Quitar foto"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Botón de Acción y Enlace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={editingAd.button_text || ''}
                    onChange={e => setEditingAd({ ...editingAd, button_text: e.target.value })}
                    placeholder="Ej: Cotizar por WhatsApp / Ver Oferta"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    Enlace / Destino
                  </label>
                  <input
                    type="text"
                    value={editingAd.button_link || ''}
                    onChange={e => setEditingAd({ ...editingAd, button_link: e.target.value })}
                    placeholder="Ej: #catalogo o https://wa.me/528139629319?text=..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#2563eb] outline-none"
                  />
                </div>
              </div>

              {/* Selector de Estilo / Color de Fondo */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Color / Degradado del Anuncio
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditingAd({ ...editingAd, gradient_style: preset.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        editingAd.gradient_style === preset.value
                          ? 'border-blue-600 bg-blue-50 text-[#2563eb] shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${preset.value} shrink-0`}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Guardar Anuncio */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditing}
                  className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> Guardar Anuncio
                </button>
              </div>
            </div>
          ) : (
            /* Vista de Lista de Anuncios Existentes */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500">
                    {ads.length} {ads.length === 1 ? 'anuncio' : 'anuncios'} ({ads.filter(a => a.active).length} activos)
                  </span>
                  {ads.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={handleDeactivateAllAds}
                        className="text-red-600 hover:text-red-700 font-bold px-2 py-0.5 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer transition"
                        title="Poner todos los anuncios individuales en pausa"
                      >
                        Pausar todos
                      </button>
                      <button
                        type="button"
                        onClick={handleActivateAllAds}
                        className="text-emerald-700 hover:text-emerald-800 font-bold px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer transition"
                        title="Activar todos los anuncios individuales"
                      >
                        Activar todos
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> + Crear Nuevo Anuncio
                </button>
              </div>

              {ads.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-2xl bg-gray-50 space-y-2">
                  <Megaphone size={28} className="mx-auto text-gray-400" />
                  <p className="text-xs text-gray-600 font-bold">No hay anuncios promocionales configurados.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAds(DEFAULT_ADS);
                      handleSaveAll(DEFAULT_ADS);
                    }}
                    className="px-4 py-1.5 bg-blue-100 hover:bg-blue-200 text-[#2563eb] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Restablecer anuncios sugeridos
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ads.map((ad, idx) => (
                    <div
                      key={ad.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        ad.active
                          ? 'bg-white border-blue-200/90 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {ad.image_url ? (
                          <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-xl bg-gradient-to-r ${ad.gradient_style || 'from-gray-700 to-gray-900'} flex items-center justify-center text-white shrink-0 shadow-xs`}
                          >
                            <Megaphone size={20} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ad.badge_text && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {ad.badge_text}
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                ad.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {ad.active ? 'Visible en tienda' : 'Pausado'}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-gray-900 truncate mt-0.5">
                            {ad.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate">{ad.subtitle}</p>
                        </div>
                      </div>

                      {/* Botones de control */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {/* Move Up / Down */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-20 cursor-pointer"
                            title="Subir posición"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 1)}
                            disabled={idx === ads.length - 1}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-20 cursor-pointer"
                            title="Bajar posición"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                        {/* Switch Activar / Desactivar */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(ad.id)}
                          className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            ad.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                          title={ad.active ? 'Desactivar anuncio' : 'Activar anuncio'}
                        >
                          {ad.active ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span className="text-[10px]">{ad.active ? 'Activo' : 'Oculto'}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingAd(ad)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title="Editar anuncio"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(ad.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Eliminar anuncio"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span>Se actualiza de inmediato en el carrusel de la tienda web.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
            >
              Listo
            </button>
            {!editingAd && (
              <button
                onClick={() => handleSaveAll(ads)}
                disabled={saving}
                type="button"
                className="px-4 py-2 bg-[#2563eb] text-white text-xs font-bold rounded-xl hover:bg-[#1d4ed8] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Guardar Cambios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
