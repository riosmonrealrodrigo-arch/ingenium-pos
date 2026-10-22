'use client';
import { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import { useStoreTheme, STORE_THEMES, StoreThemeId } from '@/context/StoreThemeContext';

interface StoreThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreThemeModal({ isOpen, onClose }: StoreThemeModalProps) {
  const { themeId, setTheme } = useStoreTheme();
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSelect = async (id: StoreThemeId) => {
    await setTheme(id);
    setSuccess(`¡Tema "${STORE_THEMES[id].name}" activado correctamente en la tienda web!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base leading-tight">
                Temáticas para la Tienda Web
              </h3>
              <p className="text-xs text-gray-500">
                Cambia la ambientación festiva en tiempo real desde tu teléfono
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            aria-label="Cerrar modal"
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

        {/* Grid de Temas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 overflow-y-auto p-1 flex-1">
          {Object.values(STORE_THEMES).map(t => {
            const isSelected = themeId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                type="button"
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-600/20'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{t.emoji}</span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                      <Check size={10} /> ACTIVO
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">Tocar para activar</span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">{t.name}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{t.headline}</p>
                </div>
                {/* Visual color preview strip */}
                <div
                  className="h-3 rounded-full mt-2.5 shadow-xs border border-black/10"
                  style={{ background: t.cssGradient }}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span>Se actualiza de inmediato para todos tus clientes.</span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
