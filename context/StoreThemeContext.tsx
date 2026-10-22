'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type StoreThemeId = 'default' | 'halloween' | 'navidad' | 'san_valentin' | 'black_friday' | 'fiestas_patrias';

export interface StoreThemeConfig {
  id: StoreThemeId;
  name: string;
  emoji: string;
  badge: string;
  headline: string;
  tagline: string;
  bannerGradient: string;
  accentBg: string;
  accentText: string;
  particleType?: 'bats' | 'snow' | 'hearts' | 'fire' | 'confetti';
}

export const STORE_THEMES: Record<StoreThemeId, StoreThemeConfig> = {
  default: {
    id: 'default',
    name: 'Cyber Blue Oficial',
    emoji: '⚡',
    badge: 'Catálogo Oficial & Tienda Virtual',
    headline: 'Repuestos y Servicio Técnico para Celulares',
    tagline: 'Explora refacciones originales, pantallas OLED, baterías y accesorios con garantía certificada en moneda nacional ($ MXN).',
    bannerGradient: 'from-[#1e3a5f] via-[#224570] to-[#2563eb]',
    accentBg: 'bg-[#2563eb]',
    accentText: 'text-blue-400',
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween & Noche de Brujas',
    emoji: '🎃',
    badge: '🎃 Especial de Halloween · Precios de Miedo',
    headline: '¡Repara tu Celular sin Sustos ni Trucos! 🎃👻',
    tagline: 'Refacciones garantizadas para que tu teléfono no parezca zombie. Pantallas OLED, baterías y servicio técnico con garantía.',
    bannerGradient: 'from-[#1f0a1d] via-[#3b0764] to-[#c2410c]',
    accentBg: 'bg-orange-600',
    accentText: 'text-orange-400',
    particleType: 'bats',
  },
  navidad: {
    id: 'navidad',
    name: 'Navidad & Fin de Año',
    emoji: '🎄',
    badge: '🎄 Temporada Navideña · Regálale vida a tu celular',
    headline: '¡El Mejor Regalo para tu Celular en Navidad! 🎅🎁',
    tagline: 'Pantallas relucientes, baterías al 100% y accesorios de primer nivel para estrenar en estas fiestas decembrinas.',
    bannerGradient: 'from-[#064e3b] via-[#14532d] to-[#991b1b]',
    accentBg: 'bg-red-600',
    accentText: 'text-red-400',
    particleType: 'snow',
  },
  san_valentin: {
    id: 'san_valentin',
    name: 'San Valentín / Amor & Amistad',
    emoji: '💖',
    badge: '💘 Mes del Amor & la Amistad · Cuida lo que amas',
    headline: '¡Vuelve a Enamorarte de tu Celular! 💕📱',
    tagline: 'Renueva tu pantalla o batería y manténte siempre conectado con las personas que más quieres.',
    bannerGradient: 'from-[#500724] via-[#831843] to-[#be123c]',
    accentBg: 'bg-pink-600',
    accentText: 'text-pink-400',
    particleType: 'hearts',
  },
  black_friday: {
    id: 'black_friday',
    name: 'Black Friday & Cyber Days',
    emoji: '🔥',
    badge: '🔥 BLACK FRIDAY · Las Mejores Ofertas del Año',
    headline: '¡Super Descuentos en Refacciones & Taller! 🔥🛒',
    tagline: 'Aprovecha promociones exclusivas por tiempo limitado en repuestos, accesorios premium y reparaciones de laboratorio.',
    bannerGradient: 'from-[#09090b] via-[#18181b] to-[#b91c1c]',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-400',
    particleType: 'fire',
  },
  fiestas_patrias: {
    id: 'fiestas_patrias',
    name: 'Fiestas Patrias México',
    emoji: '🇲🇽',
    badge: '🇲🇽 Fiestas Patrias · Calidad y Orgullo Mexicano',
    headline: '¡Viva México y Vivan tus Equipos al 100%! 🇲🇽🎉',
    tagline: 'Servicio técnico especializado y repuestos de alta calidad con garantía garantizada en Monterrey, N.L.',
    bannerGradient: 'from-[#14532d] via-[#1e293b] to-[#b91c1c]',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-400',
    particleType: 'confetti',
  },
};

interface StoreThemeContextType {
  currentTheme: StoreThemeConfig;
  themeId: StoreThemeId;
  setTheme: (themeId: StoreThemeId) => Promise<void>;
  loading: boolean;
}

const StoreThemeContext = createContext<StoreThemeContextType | null>(null);

export function StoreThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<StoreThemeId>('default');
  const [loading, setLoading] = useState(false);

  // Cargar tema inicial desde localStorage y Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('ingenium_store_theme') as StoreThemeId;
      if (cached && STORE_THEMES[cached]) {
        setThemeId(cached);
      }
    }

    // Consultar tema oficial en Supabase ticket_settings
    const fetchRemoteTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('ticket_settings')
          .select('social_media')
          .limit(1);

        if (!error && data && data.length > 0 && data[0].social_media) {
          const match = data[0].social_media.match(/THEME:([a-z_]+)/);
          if (match && STORE_THEMES[match[1] as StoreThemeId]) {
            const remoteTheme = match[1] as StoreThemeId;
            setThemeId(remoteTheme);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ingenium_store_theme', remoteTheme);
            }
          }
        }
      } catch {}
    };
    fetchRemoteTheme();

    // Suscripción Realtime para actualizar la tienda en cuanto el admin cambie el tema en el POS
    try {
      const channel = supabase
        .channel('store_theme_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ticket_settings' },
          payload => {
            const row = (payload.new || {}) as any;
            if (row?.social_media) {
              const match = row.social_media.match(/THEME:([a-z_]+)/);
              if (match && STORE_THEMES[match[1] as StoreThemeId]) {
                const newT = match[1] as StoreThemeId;
                setThemeId(newT);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('ingenium_store_theme', newT);
                }
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {}
  }, []);

  const setTheme = async (newThemeId: StoreThemeId) => {
    if (!STORE_THEMES[newThemeId]) return;
    setLoading(true);
    setThemeId(newThemeId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_store_theme', newThemeId);
    }

    try {
      const themeTag = `THEME:${newThemeId}|FB & IG: @ingeniummobile`;
      const { data: existing } = await supabase
        .from('ticket_settings')
        .select('id')
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('ticket_settings')
          .update({ social_media: themeTag })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('ticket_settings')
          .insert({
            business_id: '0cb52988-c60c-4b2b-bdba-8cb103434d0d',
            business_name: 'INGENIUM MOBILE',
            social_media: themeTag,
            warranty_note: 'Garantía oficial INGENIUM MOBILE',
            repair_terms: 'Términos de servicio técnico garantizado.',
            default_format: 'thermal_80',
          });
      }
    } catch (e) {
      console.warn('Error al guardar tema en Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreThemeContext.Provider
      value={{
        currentTheme: STORE_THEMES[themeId] || STORE_THEMES.default,
        themeId,
        setTheme,
        loading,
      }}
    >
      {children}
    </StoreThemeContext.Provider>
  );
}

export const useStoreTheme = () => {
  const ctx = useContext(StoreThemeContext);
  if (!ctx) throw new Error('useStoreTheme must be inside StoreThemeProvider');
  return ctx;
};
