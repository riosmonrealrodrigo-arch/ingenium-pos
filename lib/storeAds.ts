import { supabase } from '@/lib/supabase';

export interface StoreAdBanner {
  id: string;
  title: string;
  subtitle: string;
  badge_text?: string;
  image_url?: string;
  button_text?: string;
  button_link?: string;
  gradient_style?: string;
  active: boolean;
  created_at: string;
}

export const ADS_STORAGE_KEY = 'ingenium_store_ads';

export const DEFAULT_ADS: StoreAdBanner[] = [
  {
    id: 'ad-pantallas-promo',
    title: '¡Cambio de Pantalla Express en 45 Minutos!',
    subtitle: 'Pantallas OLED de máxima resolución con garantía por escrito y diagnóstico profesional.',
    badge_text: '⚡ OFERTA TALLER',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    button_text: 'Cotizar Reparación',
    button_link: 'https://wa.me/528139629319?text=%C2%A1Hola!%20Me%20interesa%20la%20promoci%C3%B3n%20de%20cambio%20de%20pantalla%20express.',
    gradient_style: 'from-[#0f172a] via-[#1e3a5f] to-[#2563eb]',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ad-cables-cargadores',
    title: 'Cables 4 en 1 & Cargadores Rápidos 20W y 35W',
    subtitle: 'Elige tu tipo de conector (Tipo C a iPhone, C a C o USB) con envío o retiro en sucursal.',
    badge_text: '🔌 NUEVO INGRESO',
    image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    button_text: 'Ver Accesorios',
    button_link: '#catalogo',
    gradient_style: 'from-[#1e1b4b] via-[#312e81] to-[#7c3aed]',
    active: true,
    created_at: new Date().toISOString(),
  },
];

// Obtiene los anuncios promocionales activos y configurados
export const getStoreAds = async (): Promise<StoreAdBanner[]> => {
  // 1. Intentar desde localStorage primero para velocidad inmediata
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Consultar en Supabase ticket_settings (campo repair_terms con etiqueta [StoreAds:...])
  try {
    const { data } = await supabase
      .from('ticket_settings')
      .select('repair_terms')
      .limit(1);

    if (data && data.length > 0 && data[0].repair_terms) {
      const match = data[0].repair_terms.match(/\[StoreAds:\s*([\s\S]*?)\]/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Fallback con anuncios por defecto
  return DEFAULT_ADS;
};

// Guarda los anuncios promocionales en localStorage y Supabase
export const saveStoreAds = async (ads: StoreAdBanner[]): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(ads));
  }

  try {
    const { data: existing } = await supabase
      .from('ticket_settings')
      .select('id, repair_terms')
      .limit(1);

    const adsTag = `[StoreAds: ${JSON.stringify(ads)}]`;

    if (existing && existing.length > 0) {
      const current = existing[0].repair_terms || '';
      const cleaned = current.replace(/\[StoreAds:\s*[\s\S]*?\]\s*/g, '').trim();
      const updated = cleaned ? `${cleaned}\n${adsTag}` : adsTag;

      await supabase
        .from('ticket_settings')
        .update({ repair_terms: updated })
        .eq('id', existing[0].id);
    }
  } catch (err) {
    console.warn('Error al guardar anuncios en Supabase:', err);
  }
};
