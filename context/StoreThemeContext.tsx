'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type StoreThemeId =
  | 'default'
  | 'halloween'
  | 'navidad'
  | 'san_valentin'
  | 'black_friday'
  | 'fiestas_patrias'
  | 'cyberpunk'
  | 'apple_gold'
  | 'emerald_pro'
  | 'galaxy_purple'
  | 'sunset_fire'
  | 'arcade_retro';

export interface StoreThemeConfig {
  id: StoreThemeId;
  name: string;
  emoji: string;
  badge: string;
  headline: string;
  tagline: string;
  bannerGradient: string;
  cssGradient: string;
  navTopGradient: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  cardBg: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowShadow: string;
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
    bannerGradient: 'from-[#0d1b2a] via-[#1e3a5f] to-[#2563eb]',
    cssGradient: 'linear-gradient(135deg, #0d1b2a 0%, #1e3a5f 40%, #1d4ed8 75%, #2563eb 100%)',
    navTopGradient: '#0d1b2a',
    accentColor: '#2563eb',
    accentBg: 'bg-[#2563eb]',
    accentText: 'text-blue-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(59, 130, 246, 0.2)',
    badgeBorder: 'rgba(147, 197, 253, 0.4)',
    badgeText: '#bfdbfe',
    glowShadow: 'rgba(37, 99, 235, 0.35)',
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween & Noche de Brujas',
    emoji: '🎃',
    badge: '🎃 Especial de Halloween · Precios de Miedo',
    headline: '¡Repara tu Celular sin Sustos ni Trucos! 🎃👻',
    tagline: 'Refacciones garantizadas para que tu teléfono no parezca zombie. Pantallas OLED, baterías y servicio técnico con garantía.',
    bannerGradient: 'from-[#090114] via-[#22073d] to-[#ea580c]',
    cssGradient: 'linear-gradient(135deg, #090114 0%, #22073d 30%, #4a044e 60%, #9a3412 85%, #ea580c 100%)',
    navTopGradient: '#130224',
    accentColor: '#ea580c',
    accentBg: 'bg-orange-600',
    accentText: 'text-orange-400',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    badgeBg: 'rgba(234, 88, 12, 0.25)',
    badgeBorder: 'rgba(251, 146, 60, 0.5)',
    badgeText: '#fdba74',
    glowShadow: 'rgba(234, 88, 12, 0.4)',
    particleType: 'bats',
  },
  navidad: {
    id: 'navidad',
    name: 'Navidad & Fin de Año',
    emoji: '🎄',
    badge: '🎄 Temporada Navideña · Regálale vida a tu celular',
    headline: '¡El Mejor Regalo para tu Celular en Navidad! 🎅🎁',
    tagline: 'Pantallas relucientes, baterías al 100% y accesorios de primer nivel para estrenar en estas fiestas decembrinas.',
    bannerGradient: 'from-[#022c22] via-[#064e3b] to-[#991b1b]',
    cssGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 35%, #14532d 60%, #7f1d1d 85%, #991b1b 100%)',
    navTopGradient: '#022c22',
    accentColor: '#dc2626',
    accentBg: 'bg-red-600',
    accentText: 'text-red-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(220, 38, 38, 0.25)',
    badgeBorder: 'rgba(252, 165, 165, 0.5)',
    badgeText: '#fee2e2',
    glowShadow: 'rgba(220, 38, 38, 0.35)',
    particleType: 'snow',
  },
  san_valentin: {
    id: 'san_valentin',
    name: 'San Valentín / Amor & Amistad',
    emoji: '💖',
    badge: '💘 Mes del Amor & la Amistad · Cuida lo que amas',
    headline: '¡Vuelve a Enamorarte de tu Celular! 💕📱',
    tagline: 'Renueva tu pantalla o batería y manténte siempre conectado con las personas que más quieres.',
    bannerGradient: 'from-[#3b071c] via-[#700c32] to-[#e11d48]',
    cssGradient: 'linear-gradient(135deg, #3b071c 0%, #700c32 35%, #9f1239 65%, #db2777 85%, #e11d48 100%)',
    navTopGradient: '#4c0519',
    accentColor: '#e11d48',
    accentBg: 'bg-pink-600',
    accentText: 'text-pink-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(225, 29, 72, 0.25)',
    badgeBorder: 'rgba(251, 113, 133, 0.5)',
    badgeText: '#fecdd3',
    glowShadow: 'rgba(225, 29, 72, 0.4)',
    particleType: 'hearts',
  },
  black_friday: {
    id: 'black_friday',
    name: 'Black Friday & Cyber Days',
    emoji: '🔥',
    badge: '🔥 BLACK FRIDAY · Las Mejores Ofertas del Año',
    headline: '¡Super Descuentos en Refacciones & Taller! 🔥🛒',
    tagline: 'Aprovecha promociones exclusivas por tiempo limitado en repuestos, accesorios premium y reparaciones de laboratorio.',
    bannerGradient: 'from-[#09090b] via-[#18181b] to-[#b45309]',
    cssGradient: 'linear-gradient(135deg, #09090b 0%, #18181b 40%, #27272a 70%, #78350f 85%, #b45309 100%)',
    navTopGradient: '#09090b',
    accentColor: '#f59e0b',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-400',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeBorder: 'rgba(251, 191, 36, 0.5)',
    badgeText: '#fde68a',
    glowShadow: 'rgba(245, 158, 11, 0.35)',
    particleType: 'fire',
  },
  fiestas_patrias: {
    id: 'fiestas_patrias',
    name: 'Fiestas Patrias México',
    emoji: '🇲🇽',
    badge: '🇲🇽 Fiestas Patrias · Calidad y Orgullo Mexicano',
    headline: '¡Viva México y Vivan tus Equipos al 100%! 🇲🇽🎉',
    tagline: 'Servicio técnico especializado y repuestos de alta calidad con garantía garantizada en Monterrey, N.L.',
    bannerGradient: 'from-[#022c22] via-[#065f46] to-[#991b1b]',
    cssGradient: 'linear-gradient(135deg, #022c22 0%, #065f46 32%, #0f172a 50%, #881337 70%, #991b1b 100%)',
    navTopGradient: '#064e3b',
    accentColor: '#059669',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(5, 150, 105, 0.25)',
    badgeBorder: 'rgba(110, 231, 183, 0.5)',
    badgeText: '#d1fae5',
    glowShadow: 'rgba(5, 150, 105, 0.35)',
    particleType: 'confetti',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon & Gaming',
    emoji: '🎮',
    badge: '⚡ CYBER TECH · Modo Gamer & Accesorios',
    headline: '¡Sube de Nivel la Tecnología de tu Celular! 🎮⚡',
    tagline: 'Refacciones para alto rendimiento, pantallas ultra fluidas, cables gamer y servicio técnico especializado.',
    bannerGradient: 'from-[#12002b] via-[#3b0764] to-[#c026d3]',
    cssGradient: 'linear-gradient(135deg, #090014 0%, #2e0854 35%, #701a75 65%, #c026d3 85%, #facc15 100%)',
    navTopGradient: '#090014',
    accentColor: '#c026d3',
    accentBg: 'bg-fuchsia-600',
    accentText: 'text-fuchsia-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(192, 38, 211, 0.25)',
    badgeBorder: 'rgba(232, 121, 249, 0.5)',
    badgeText: '#f5d0fe',
    glowShadow: 'rgba(192, 38, 211, 0.45)',
    particleType: 'fire',
  },
  apple_gold: {
    id: 'apple_gold',
    name: 'Titanio Dorado / Apple Luxury',
    emoji: '✨',
    badge: '👑 Calidad Premium · Grado Original & Garantía',
    headline: 'Elegancia, Precisión y Acabado Perfecto ✨📱',
    tagline: 'Displays OLED grado AAA, baterías certificadas y refacciones de máxima fidelidad con garantía oficial.',
    bannerGradient: 'from-[#1c1917] via-[#292524] to-[#78350f]',
    cssGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 40%, #451a03 70%, #92400e 88%, #d97706 100%)',
    navTopGradient: '#1c1917',
    accentColor: '#d97706',
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-400',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    badgeBg: 'rgba(217, 119, 6, 0.25)',
    badgeBorder: 'rgba(251, 191, 36, 0.5)',
    badgeText: '#fef3c7',
    glowShadow: 'rgba(217, 119, 6, 0.35)',
    particleType: 'snow',
  },
  emerald_pro: {
    id: 'emerald_pro',
    name: 'Eco Tech & Esmeralda Pro',
    emoji: '🌿',
    badge: '🌿 Laboratorio Técnico & Reparación Limpia',
    headline: '¡Dale una Segunda Vida a tu Dispositivo! 🌿🔧',
    tagline: 'Reparaciones sustentables, ahorro garantizado y repuestos de alta durabilidad probados en banco de trabajo.',
    bannerGradient: 'from-[#022c22] via-[#064e3b] to-[#047857]',
    cssGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 35%, #065f46 65%, #059669 85%, #10b981 100%)',
    navTopGradient: '#022c22',
    accentColor: '#10b981',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(16, 185, 129, 0.25)',
    badgeBorder: 'rgba(110, 231, 183, 0.5)',
    badgeText: '#d1fae5',
    glowShadow: 'rgba(16, 185, 129, 0.35)',
  },
  galaxy_purple: {
    id: 'galaxy_purple',
    name: 'Deep Space Galaxy / Cosmos',
    emoji: '🌌',
    badge: '🌌 Tecnología sin Límites · Experiencia Estelar',
    headline: '¡Tu Celular Como Salido de Otra Galaxia! 🌌🚀',
    tagline: 'Especialistas en refacciones para marcas líderes: iPhone, Samsung, Xiaomi y Motorola. Servicio garantizado.',
    bannerGradient: 'from-[#030712] via-[#1e1b4b] to-[#4338ca]',
    cssGradient: 'linear-gradient(135deg, #030712 0%, #0f172a 30%, #1e1b4b 60%, #3730a3 85%, #6366f1 100%)',
    navTopGradient: '#030712',
    accentColor: '#6366f1',
    accentBg: 'bg-indigo-600',
    accentText: 'text-indigo-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(99, 102, 241, 0.25)',
    badgeBorder: 'rgba(165, 180, 252, 0.5)',
    badgeText: '#e0e7ff',
    glowShadow: 'rgba(99, 102, 241, 0.4)',
    particleType: 'snow',
  },
  sunset_fire: {
    id: 'sunset_fire',
    name: 'Sunset Glow / Naranja & Fuego',
    emoji: '🌅',
    badge: '⚡ OFERTAS CALIENTES · Precios Directos de Sucursal',
    headline: '¡La Mejor Energía y Servicio para tu Equipo! 🌅🔥',
    tagline: 'Cargadores rápidos, baterías de alto rendimiento y diagnósticos inmediatos sin esperas.',
    bannerGradient: 'from-[#431407] via-[#9a3412] to-[#ea580c]',
    cssGradient: 'linear-gradient(135deg, #431407 0%, #7c2d12 35%, #c2410c 65%, #ea580c 85%, #f97316 100%)',
    navTopGradient: '#431407',
    accentColor: '#ea580c',
    accentBg: 'bg-orange-600',
    accentText: 'text-orange-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(234, 88, 12, 0.25)',
    badgeBorder: 'rgba(251, 146, 60, 0.5)',
    badgeText: '#ffedd5',
    glowShadow: 'rgba(234, 88, 12, 0.4)',
    particleType: 'fire',
  },
  arcade_retro: {
    id: 'arcade_retro',
    name: 'Arcade Retro & Consolas',
    emoji: '👾',
    badge: '👾 Mantenimiento de Consolas & Reparación Pro',
    headline: '¡Taller Gamer: Xbox, PlayStation & Celulares! 🎮👾',
    tagline: 'Mantenimiento preventivo, pasta térmica, puertos HDMI y refacciones certificadas al mejor precio.',
    bannerGradient: 'from-[#0f172a] via-[#1e293b] to-[#dc2626]',
    cssGradient: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 35%, #0284c7 65%, #dc2626 90%, #f59e0b 100%)',
    navTopGradient: '#090d16',
    accentColor: '#dc2626',
    accentBg: 'bg-red-600',
    accentText: 'text-red-400',
    cardBg: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'rgba(220, 38, 38, 0.25)',
    badgeBorder: 'rgba(252, 165, 165, 0.5)',
    badgeText: '#fee2e2',
    glowShadow: 'rgba(220, 38, 38, 0.4)',
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
