'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { soundManager, isPosButton } from '@/lib/soundEffects';
import { Volume2, VolumeX } from 'lucide-react';

export default function StoreSoundEffects() {
  const pathname = usePathname();

  useEffect(() => {
    // Interceptor global de interacciones táctiles y clics
    const handleGlobalInteraction = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'button, a, [role="button"], input[type="button"], input[type="submit"], [data-sound]'
      ) as HTMLElement | null;

      if (!target) return;

      // EXCLUSIÓN ESTRICTA: "exepto en el de POS el que esta en la tienda web"
      if (isPosButton(target)) {
        return; // ¡Silencio total! No reproducir ningún sonido
      }

      // Clasificación inteligente del tipo de sonido según la acción
      const soundType = target.dataset.sound;
      const text = (target.innerText || target.textContent || '').toLowerCase();
      const title = (target.getAttribute('title') || '').toLowerCase();
      const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
      const href = (target.getAttribute('href') || '').toLowerCase();

      // 1. Acciones de carrito (agregar producto, cambiar cantidad)
      const isCart =
        soundType === 'cart' ||
        text.includes('carrito') ||
        text.includes('agregar') ||
        text.includes('cotizar / comprar') ||
        title.includes('carrito') ||
        ariaLabel.includes('carrito') ||
        target.querySelector('.lucide-shopping-bag') !== null;

      // 2. Acciones de finalización / éxito (enviar pedido a WhatsApp, consultar)
      const isSuccess =
        soundType === 'success' ||
        text.includes('finalizar pedido') ||
        text.includes('enviar consulta') ||
        text.includes('orden enviada') ||
        href.includes('wa.me');

      // 3. Acciones de apertura, modales, temas o burbujas
      const isPop =
        soundType === 'pop' ||
        target.dataset.lightbox === 'true' ||
        title.includes('tema') ||
        title.includes('cerrar') ||
        text.includes('identificarme') ||
        text.includes('ver fotos') ||
        target.id === 'floating-robot-bubble' ||
        target.closest('#floating-robot-bubble') !== null;

      // 4. Pestañas, filtros de categoría y selección
      const isTab =
        soundType === 'tab' ||
        target.classList.contains('rounded-full') &&
          (text.includes('todos') ||
            text.includes('repuestos') ||
            text.includes('accesorios') ||
            text.includes('servicios') ||
            text.includes('whatsapp') ||
            text.includes('rastreo'));

      if (isCart) {
        soundManager.playAddToCart();
      } else if (isSuccess) {
        soundManager.playSuccess();
      } else if (isPop) {
        soundManager.playPop();
      } else if (isTab) {
        soundManager.playTab();
      } else {
        soundManager.playTap();
      }
    };

    // Usar fase de captura (capture: true) para disparar instantáneamente
    document.addEventListener('click', handleGlobalInteraction, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalInteraction, { capture: true });
    };
  }, []);

  return null;
}

/**
 * Botón discreto para activar / silenciar los efectos de sonido en la tienda web
 */
export function SoundToggleButton({ className = '' }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(soundManager.isEnabled());
  }, []);

  const handleToggle = () => {
    const newState = soundManager.toggle();
    setEnabled(newState);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? 'Efectos de sonido activados (clic para silenciar)' : 'Sonido silenciado (clic para activar)'}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer select-none ${
        enabled
          ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40'
          : 'bg-white/10 text-gray-400 hover:text-white border border-white/10'
      } ${className}`}
    >
      {enabled ? <Volume2 size={12} className="text-amber-400" /> : <VolumeX size={12} />}
      <span className="hidden sm:inline">{enabled ? 'Sonido ON' : 'Silencio'}</span>
    </button>
  );
}
