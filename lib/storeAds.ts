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

export interface StoreAdsConfig {
  global_enabled: boolean; // Si es false, NO se muestra ningún anuncio en la tienda
  ads: StoreAdBanner[];
}

export const ADS_STORAGE_KEY = 'ingenium_store_ads_config';

export const STORE_ADS_START = '<<<STORE_ADS_CONFIG_START>>>';
export const STORE_ADS_END = '<<<STORE_ADS_CONFIG_END>>>';

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

export const DEFAULT_ADS_CONFIG: StoreAdsConfig = {
  global_enabled: true,
  ads: DEFAULT_ADS,
};

// Obtiene la configuración completa de anuncios (estado global y lista de banners)
export const getStoreAdsConfig = async (): Promise<StoreAdsConfig> => {
  // 1. Consultar en Supabase primero para sincronización multi-dispositivo real
  try {
    const { data, error } = await supabase
      .from('ticket_settings')
      .select('repair_terms')
      .limit(1);

    if (!error && data && data.length > 0 && data[0].repair_terms) {
      const text = data[0].repair_terms;
      const startIdx = text.indexOf(STORE_ADS_START);
      const endIdx = text.indexOf(STORE_ADS_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = text.substring(startIdx + STORE_ADS_START.length, endIdx).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const config: StoreAdsConfig = {
            global_enabled: typeof parsed.global_enabled === 'boolean' ? parsed.global_enabled : true,
            ads: Array.isArray(parsed.ads) ? parsed.ads : (Array.isArray(parsed) ? parsed : []),
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(config));
          }
          return config;
        } catch (parseErr) {
          console.warn('Error al parsear anuncios desde Supabase:', parseErr);
        }
      }
    }
  } catch (supabaseErr) {
    console.warn('Error de conexión a Supabase para anuncios:', supabaseErr);
  }

  // 2. Si falla Supabase o estamos offline, usar localStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(ADS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          global_enabled: typeof parsed.global_enabled === 'boolean' ? parsed.global_enabled : true,
          ads: Array.isArray(parsed.ads) ? parsed.ads : (Array.isArray(parsed) ? parsed : []),
        };
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback inicial si nunca se ha configurado
  return DEFAULT_ADS_CONFIG;
};

// Retorna los anuncios listos para mostrarse en la tienda web
// Si global_enabled es false, retorna [] de inmediato para que NADA se muestre.
export const getStoreAds = async (): Promise<StoreAdBanner[]> => {
  const config = await getStoreAdsConfig();
  if (!config.global_enabled) {
    return [];
  }
  return config.ads.filter(a => a.active);
};

// Guarda la configuración completa de anuncios en Supabase y localStorage
export const saveStoreAdsConfig = async (config: StoreAdsConfig): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('ingenium_store_ads_updated', { detail: config }));
  }

  try {
    const { data: existing } = await supabase
      .from('ticket_settings')
      .select('id, repair_terms')
      .limit(1);

    const payload = `${STORE_ADS_START}\n${JSON.stringify(config)}\n${STORE_ADS_END}`;

    if (existing && existing.length > 0) {
      const current = existing[0].repair_terms || '';
      // Limpiar etiquetas antiguas (tanto la nueva delimitada como la vieja [StoreAds:...])
      const cleanRegexNew = new RegExp(`${STORE_ADS_START}[\\s\\S]*?${STORE_ADS_END}\\s*`, 'g');
      const cleanRegexOld = /\[StoreAds:\s*[\s\S]*?\]\s*/g;
      const cleaned = current
        .replace(cleanRegexNew, '')
        .replace(cleanRegexOld, '')
        .trim();

      const updated = cleaned ? `${cleaned}\n${payload}` : payload;

      const { error } = await supabase
        .from('ticket_settings')
        .update({ repair_terms: updated })
        .eq('id', existing[0].id);

      if (error) {
        console.error('Error al actualizar anuncios en Supabase:', error);
      }
    } else {
      // Si no existe fila en ticket_settings, insertarla
      await supabase
        .from('ticket_settings')
        .insert({
          business_id: '0cb52988-c60c-4b2b-bdba-8cb103434d0d',
          business_name: 'INGENIUM MOBILE',
          repair_terms: payload,
          warranty_note: 'Garantía oficial INGENIUM MOBILE',
        });
    }
  } catch (err) {
    console.error('Error al guardar configuración de anuncios en Supabase:', err);
  }
};

// Compatibilidad retroactiva
export const saveStoreAds = async (ads: StoreAdBanner[]): Promise<void> => {
  const currentConfig = await getStoreAdsConfig();
  await saveStoreAdsConfig({
    global_enabled: currentConfig.global_enabled,
    ads,
  });
};
