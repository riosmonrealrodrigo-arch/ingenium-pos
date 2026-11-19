'use client';
import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Link2,
  Upload,
  Camera,
  Trash2,
  Star,
  Plus,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Layers,
  X,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { ProductSpec, ProductVariantGroup } from '@/types';
import { compressImage } from '@/lib/utils';

interface ProductMediaAndSpecsEditorProps {
  gallery: string[];
  onGalleryChange: (gallery: string[]) => void;
  specs: ProductSpec[];
  onSpecsChange: (specs: ProductSpec[]) => void;
  variants?: ProductVariantGroup[];
  onVariantsChange?: (variants: ProductVariantGroup[]) => void;
  isService?: boolean;
}

const MAX_IMAGES = 8;

const SERVICE_SPEC_PRESETS = [
  { label: 'Tiempo estimado', placeholder: 'Ej: 45 min - 2 horas' },
  { label: 'Garantía', placeholder: 'Ej: 30 días por escrito' },
  { label: 'Equipos compatibles', placeholder: 'Ej: iPhone, Samsung, Xiaomi, Motorola' },
  { label: 'Incluye', placeholder: 'Ej: Limpieza interna, pasta térmica y diagnóstico' },
  { label: 'Modalidad', placeholder: 'Ej: Servicio en taller / Express' },
];

const PRODUCT_SPEC_PRESETS = [
  { label: 'Marca', placeholder: 'Ej: Apple / Samsung / Genérico AAA' },
  { label: 'Modelo compatible', placeholder: 'Ej: iPhone 14 Pro Max' },
  { label: 'Calidad', placeholder: 'Ej: Original / OLED / Uso Rudo' },
  { label: 'Garantía', placeholder: 'Ej: 30 días contra defecto de fábrica' },
  { label: 'Color', placeholder: 'Ej: Negro / Transparente' },
  { label: 'Material', placeholder: 'Ej: Policarbonato + TPU / Cristal templado' },
  { label: 'Incluye', placeholder: 'Ej: 1 pieza en empaque sellado' },
];

const VARIANT_PRESETS = [
  {
    key: 'conector',
    title: 'Tipo de Conector / Entrada',
    defaultOptions: [
      'Tipo C a Lightning (iPhone)',
      'Tipo C a Tipo C',
      'USB a Tipo C',
      'USB a Lightning (iPhone)',
    ],
    suggestions: [
      'Tipo C a Lightning (iPhone)',
      'Tipo C a Tipo C',
      'USB a Tipo C',
      'USB a Lightning (iPhone)',
      'Micro USB (V8)',
      '3 en 1 Universal',
      'Entrada Jack 3.5mm',
      'Adaptador Tipo C a Jack',
      'Adaptador IP a Jack',
    ],
  },
  {
    key: 'color',
    title: 'Color Disponible',
    defaultOptions: ['Negro', 'Blanco'],
    suggestions: [
      'Negro',
      'Blanco',
      'Azul',
      'Rojo',
      'Gris Espacial',
      'Morado',
      'Verde',
      'Titanio Natural',
      'Dorado',
      'Rosa',
      'Transparente',
    ],
  },
  {
    key: 'largo',
    title: 'Largo / Potencia',
    defaultOptions: ['1 Metro', '2 Metros'],
    suggestions: [
      '1 Metro',
      '1.2 Metros',
      '2 Metros',
      '3 Metros',
      '20W Carga Rápida',
      '25W Tipo C',
      '35W Doble Puerto',
      '65W GaN Turbo',
    ],
  },
  {
    key: 'compatibilidad',
    title: 'Compatibilidad de Dispositivo',
    defaultOptions: ['iPhone (Lightning)', 'iPhone 15 / 16 (Tipo C)', 'Android (Tipo C)'],
    suggestions: [
      'iPhone (Lightning)',
      'iPhone 15 / 16 (Tipo C)',
      'Android (Tipo C)',
      'Samsung Galaxy',
      'Xiaomi / Motorola',
      'Universal',
    ],
  },
];

export default function ProductMediaAndSpecsEditor({
  gallery,
  onGalleryChange,
  specs,
  onSpecsChange,
  variants = [],
  onVariantsChange,
  isService = false,
}: ProductMediaAndSpecsEditorProps) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const presets = isService ? SERVICE_SPEC_PRESETS : PRODUCT_SPEC_PRESETS;

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (gallery.length >= MAX_IMAGES) {
      alert(`Puedes agregar hasta ${MAX_IMAGES} imágenes por producto.`);
      return;
    }
    if (gallery.includes(trimmed)) {
      setUrlInput('');
      return;
    }
    onGalleryChange([...gallery, trimmed]);
    setUrlInput('');
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - gallery.length;
    if (remaining <= 0) {
      alert(`Ya alcanzaste el límite de ${MAX_IMAGES} imágenes.`);
      e.target.value = '';
      return;
    }

    const toProcess = files.slice(0, remaining);
    setUploading(true);
    try {
      const compressedList: string[] = [];
      for (const file of toProcess) {
        const compressed = await compressImage(file, 900, 900, 0.72);
        compressedList.push(compressed);
      }
      onGalleryChange([...gallery, ...compressedList]);
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
      alert('No se pudo procesar alguna de las imágenes seleccionadas.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSetMain = (index: number) => {
    if (index === 0) return;
    const next = [...gallery];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onGalleryChange(next);
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(next);
  };

  const handleRemoveImage = (index: number) => {
    onGalleryChange(gallery.filter((_, i) => i !== index));
  };

  // Specs handlers
  const handleAddSpec = (presetLabel = '') => {
    onSpecsChange([...specs, { label: presetLabel, value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'label' | 'value', val: string) => {
    const next = specs.map((item, i) => (i === index ? { ...item, [field]: val } : item));
    onSpecsChange(next);
  };

  const handleRemoveSpec = (index: number) => {
    onSpecsChange(specs.filter((_, i) => i !== index));
  };

  // Variants handlers
  const handleToggleGroup = (groupId: string) => {
    if (!onVariantsChange) return;
    const next = variants.map(v => (v.id === groupId ? { ...v, enabled: !v.enabled } : v));
    onVariantsChange(next);
  };

  const handleAddPresetGroup = (preset: typeof VARIANT_PRESETS[0]) => {
    if (!onVariantsChange) return;
    const existing = variants.find(
      v => v.title.toLowerCase().trim() === preset.title.toLowerCase().trim()
    );
    if (existing) {
      onVariantsChange(
        variants.map(v => (v.id === existing.id ? { ...v, enabled: true } : v))
      );
      return;
    }
    const newGroup: ProductVariantGroup = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: preset.title,
      enabled: true,
      options: [...preset.defaultOptions],
    };
    onVariantsChange([...variants, newGroup]);
  };

  const handleCreateCustomGroup = () => {
    if (!onVariantsChange) return;
    const newGroup: ProductVariantGroup = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Nueva Opción / Característica',
      enabled: true,
      options: ['Opción 1'],
    };
    onVariantsChange([...variants, newGroup]);
  };

  const handleUpdateGroupTitle = (groupId: string, newTitle: string) => {
    if (!onVariantsChange) return;
    onVariantsChange(
      variants.map(v => (v.id === groupId ? { ...v, title: newTitle } : v))
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    if (!onVariantsChange) return;
    onVariantsChange(variants.filter(v => v.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string, optValue?: string) => {
    if (!onVariantsChange) return;
    const val = (optValue !== undefined ? optValue : (newOptionInputs[groupId] || '')).trim();
    if (!val) return;

    onVariantsChange(
      variants.map(v => {
        if (v.id !== groupId) return v;
        if (v.options.some(o => o.toLowerCase() === val.toLowerCase())) return v;
        return { ...v, options: [...v.options, val] };
      })
    );
    setNewOptionInputs(prev => ({ ...prev, [groupId]: '' }));
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionIndex: number) => {
    if (!onVariantsChange) return;
    onVariantsChange(
      variants.map(v => {
        if (v.id !== groupId) return v;
        return { ...v, options: v.options.filter((_, i) => i !== optionIndex) };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Galería de Imágenes (Enlaces + Subida desde dispositivo / cámara) */}
      <div className="p-4 bg-white rounded-2xl border border-blue-200/80 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
              <ImageIcon size={15} />
            </div>
            <div>
              <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide">
                Galería de Fotos ({gallery.length}/{MAX_IMAGES})
              </p>
              <p className="text-[11px] text-gray-500">
                Agrega varias fotos por enlace o súbelas desde tu PC o celular. La #1 será la portada.
              </p>
            </div>
          </div>
        </div>

        {/* Inputs: URL + Upload buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="url"
              placeholder="Pegar enlace de imagen (https://...)"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || gallery.length >= MAX_IMAGES}
            className="px-3.5 py-2 bg-[#1e3a5f] hover:bg-[#162a45] text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Agregar enlace
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFilesSelected}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || gallery.length >= MAX_IMAGES}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563eb] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>{uploading ? 'Procesando...' : 'Subir fotos (PC / Galería)'}</span>
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || gallery.length >= MAX_IMAGES}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <Camera size={14} />
            <span>Tomar foto</span>
          </button>
        </div>

        {/* Preview Grid */}
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {gallery.map((imgUrl, idx) => (
              <div
                key={`${idx}-${imgUrl.slice(0, 32)}`}
                className={`relative rounded-xl overflow-hidden border-2 bg-gray-100 group ${
                  idx === 0 ? 'border-[#2563eb] ring-2 ring-blue-500/20' : 'border-gray-200'
                }`}
              >
                <div className="aspect-square w-full overflow-hidden bg-white">
                  <img
                    src={imgUrl}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=60';
                    }}
                  />
                </div>

                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#2563eb] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                    PORTADA
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  title="Eliminar foto"
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>

                {/* Controls bar */}
                <div className="bg-gray-900/80 text-white px-1.5 py-1 flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                      title="Mover izquierda"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === gallery.length - 1}
                      className="p-0.5 hover:bg-white/20 rounded disabled:opacity-30 cursor-pointer"
                      title="Mover derecha"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetMain(idx)}
                      className="flex items-center gap-0.5 text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
                      title="Usar como portada principal"
                    >
                      <Star size={10} /> Portada
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 border border-dashed border-gray-300 rounded-xl bg-gray-50/70">
            <ImageIcon size={24} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[11px] text-gray-500 font-medium">
              Aún no hay fotos. Pega un enlace arriba o sube imágenes desde tu equipo.
            </p>
          </div>
        )}
      </div>

      {/* 2. Características / Ficha Técnica (Estilo Mercado Libre) */}
      <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ListChecks size={15} />
            </div>
            <div>
              <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide">
                Características / Ficha Técnica
              </p>
              <p className="text-[11px] text-gray-500">
                Se muestran en tabla estilo Mercado Libre al abrir el {isService ? 'servicio' : 'producto'}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAddSpec('')}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
          >
            <Plus size={13} /> Agregar
          </button>
        </div>

        {/* Sugerencias rápidas de 1 clic */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map(preset => {
            const alreadyAdded = specs.some(
              s => s.label.trim().toLowerCase() === preset.label.toLowerCase()
            );
            return (
              <button
                key={preset.label}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddSpec(preset.label)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  alreadyAdded
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                    : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                + {preset.label}
              </button>
            );
          })}
        </div>

        {/* Filas de características */}
        {specs.length > 0 ? (
          <div className="space-y-2">
            {specs.map((spec, idx) => {
              const matchedPreset = presets.find(
                p => p.label.toLowerCase() === spec.label.trim().toLowerCase()
              );
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Ej: Marca"
                    value={spec.label}
                    onChange={e => handleUpdateSpec(idx, 'label', e.target.value)}
                    className="col-span-5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder={matchedPreset?.placeholder || 'Valor / Detalle'}
                    value={spec.value}
                    onChange={e => handleUpdateSpec(idx, 'value', e.target.value)}
                    className="col-span-6 px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    title="Quitar característica"
                    className="col-span-1 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic">
            Toca cualquier etiqueta de arriba (como Marca, Garantía o Tiempo estimado) para llenar su ficha técnica.
          </p>
        )}
      </div>

      {/* 3. Variantes y Opciones del Producto (Conectores, Colores, Medidas, etc.) */}
      {onVariantsChange && (
        <div className="p-4 bg-white rounded-2xl border border-sky-200/90 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <Layers size={15} />
              </div>
              <div>
                <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                  Variantes y Opciones del Producto
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    Mismo Precio
                  </span>
                </p>
                <p className="text-[11px] text-gray-500">
                  Ideal para cables o cargadores que cuestan lo mismo pero varían por tipo de conector (Tipo C a IP, Tipo C a C, USB a C) o color.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateCustomGroup}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition"
            >
              <Plus size={14} /> Crear grupo personalizado
            </button>
          </div>

          {/* Botones rápidos para activar opciones preconfiguradas */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Activar opciones rápidas de 1 clic:
            </p>
            <div className="flex flex-wrap gap-2">
              {VARIANT_PRESETS.map(preset => {
                const existing = variants.find(
                  v => v.title.toLowerCase().trim() === preset.title.toLowerCase().trim()
                );
                const isActive = existing && existing.enabled;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleAddPresetGroup(preset)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-gray-50 hover:bg-sky-50 text-gray-700 hover:text-sky-700 border-gray-200 hover:border-sky-200'
                    }`}
                  >
                    {isActive ? <Check size={13} className="text-emerald-600" /> : <Plus size={13} />}
                    {preset.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de Grupos de Variantes */}
          {variants.length > 0 ? (
            <div className="space-y-3 pt-1">
              {variants.map(group => {
                const matchedPreset = VARIANT_PRESETS.find(
                  p => p.title.toLowerCase().trim() === group.title.toLowerCase().trim()
                );
                const suggestions = matchedPreset?.suggestions || [];
                const remainingSuggestions = suggestions.filter(
                  s => !group.options.some(o => o.toLowerCase() === s.toLowerCase())
                );

                return (
                  <div
                    key={group.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      group.enabled
                        ? 'bg-sky-50/40 border-sky-200 shadow-2xs'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    {/* Encabezado del grupo con Switch Activar / Desactivar */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Tag size={14} className={group.enabled ? 'text-sky-600' : 'text-gray-400'} />
                        <input
                          type="text"
                          value={group.title}
                          onChange={e => handleUpdateGroupTitle(group.id, e.target.value)}
                          placeholder="Nombre del apartado (Ej: Tipo de Conector)"
                          className="font-bold text-xs text-[#1e3a5f] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded outline-none w-full max-w-xs"
                        />
                        <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                          ({group.options.length} {group.options.length === 1 ? 'opción' : 'opciones'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Switch Activar / Desactivar */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold select-none ${group.enabled ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {group.enabled ? 'Activo' : 'Desactivado'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={group.enabled}
                            onClick={() => handleToggleGroup(group.id)}
                            className="relative cursor-pointer transition-colors duration-200 rounded-full shrink-0"
                            style={{
                              width: '40px',
                              height: '22px',
                              backgroundColor: group.enabled ? '#0284c7' : '#d1d5db',
                              borderRadius: '9999px',
                            }}
                          >
                            <span
                              className="absolute bg-white shadow transition-all duration-200 ease-in-out pointer-events-none"
                              style={{
                                top: '3px',
                                left: group.enabled ? '20px' : '3px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '9999px',
                              }}
                            />
                          </button>
                        </div>

                        {/* Botón Eliminar Grupo */}
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(group.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Eliminar este grupo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Contenido si está activado */}
                    {group.enabled && (
                      <div className="space-y-2.5 pt-1">
                        {/* Opciones seleccionadas / activas (chips) */}
                        <div className="flex flex-wrap gap-1.5">
                          {group.options.map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-sky-300 text-sky-900 rounded-lg text-xs font-semibold shadow-2xs"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionFromGroup(group.id, optIdx)}
                                className="w-3.5 h-3.5 rounded-full hover:bg-red-100 hover:text-red-600 text-gray-400 flex items-center justify-center transition cursor-pointer"
                                title="Eliminar opción"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Input para agregar opción personalizada */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Escribir otra opción (Ej: Tipo C a Micro USB) y pulsar Enter..."
                            value={newOptionInputs[group.id] || ''}
                            onChange={e =>
                              setNewOptionInputs(prev => ({ ...prev, [group.id]: e.target.value }))
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOptionToGroup(group.id);
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOptionToGroup(group.id)}
                            disabled={!(newOptionInputs[group.id] || '').trim()}
                            className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#162a45] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus size={13} /> Agregar
                          </button>
                        </div>

                        {/* Sugerencias de 1 clic */}
                        {remainingSuggestions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <span className="text-[10px] text-gray-400 font-medium">Sugerencias:</span>
                            {remainingSuggestions.slice(0, 6).map(sug => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => handleAddOptionToGroup(group.id, sug)}
                                className="px-2 py-0.5 bg-white hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200/80 rounded-md text-[10px] font-semibold transition cursor-pointer"
                              >
                                + {sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
              <p className="text-xs text-gray-500">
                Aún no has activado variantes. Toca los botones de arriba para activar conectores, colores o medidas para este producto.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
