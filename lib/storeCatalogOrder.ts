import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const CATALOG_ORDER_STORAGE_KEY = 'ingenium_store_catalog_order';

export const CATALOG_ORDER_START = '<<<CATALOG_ORDER_START>>>';
export const CATALOG_ORDER_END = '<<<CATALOG_ORDER_END>>>';

// Obtiene la lista ordenada de IDs de productos para la tienda web
export const getCatalogOrder = async (): Promise<string[]> => {
  // 1. Consultar Supabase primero para sincronización en tiempo real entre todos los dispositivos
  try {
    const { data, error } = await supabase
      .from('ticket_settings')
      .select('warranty_note')
      .limit(1);

    if (!error && data && data.length > 0 && data[0].warranty_note) {
      const text = data[0].warranty_note;
      const startIdx = text.indexOf(CATALOG_ORDER_START);
      const endIdx = text.indexOf(CATALOG_ORDER_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = text.substring(startIdx + CATALOG_ORDER_START.length, endIdx).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(CATALOG_ORDER_STORAGE_KEY, JSON.stringify(parsed));
            }
            return parsed;
          }
        } catch (parseErr) {
          console.warn('Error al parsear orden del catálogo desde Supabase:', parseErr);
        }
      }
    }
  } catch (supabaseErr) {
    console.warn('Error de conexión a Supabase para orden del catálogo:', supabaseErr);
  }

  // 2. Si falla Supabase o estamos offline, usar localStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CATALOG_ORDER_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return [];
};

// Guarda el orden personalizado de productos en Supabase y localStorage
export const saveCatalogOrder = async (orderedIds: string[]): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATALOG_ORDER_STORAGE_KEY, JSON.stringify(orderedIds));
    window.dispatchEvent(new CustomEvent('ingenium_catalog_order_updated', { detail: orderedIds }));
  }

  try {
    const { data: existing } = await supabase
      .from('ticket_settings')
      .select('id, warranty_note')
      .limit(1);

    const payload = `${CATALOG_ORDER_START}\n${JSON.stringify(orderedIds)}\n${CATALOG_ORDER_END}`;

    if (existing && existing.length > 0) {
      const current = existing[0].warranty_note || '';
      // Limpiar etiquetas antiguas (tanto la nueva delimitada como la vieja [CatalogOrder:...])
      const cleanRegexNew = new RegExp(`${CATALOG_ORDER_START}[\\s\\S]*?${CATALOG_ORDER_END}\\s*`, 'g');
      const cleanRegexOld = /\[CatalogOrder:\s*[\s\S]*?\]\s*/g;
      const cleaned = current
        .replace(cleanRegexNew, '')
        .replace(cleanRegexOld, '')
        .trim();

      const updated = cleaned ? `${cleaned}\n${payload}` : payload;

      const { error } = await supabase
        .from('ticket_settings')
        .update({ warranty_note: updated })
        .eq('id', existing[0].id);

      if (error) {
        console.error('Error al actualizar orden de catálogo en Supabase:', error);
      }
    } else {
      await supabase
        .from('ticket_settings')
        .insert({
          business_id: '0cb52988-c60c-4b2b-bdba-8cb103434d0d',
          business_name: 'INGENIUM MOBILE',
          warranty_note: payload,
          repair_terms: 'Términos de servicio técnico garantizado.',
        });
    }
  } catch (err) {
    console.error('Error al guardar orden del catálogo en Supabase:', err);
  }
};

// Aplica el orden personalizado a una lista de productos
export const applyCatalogOrder = (products: Product[], orderIds: string[]): Product[] => {
  if (!orderIds || orderIds.length === 0) return products;

  const orderMap = new Map<string, number>();
  orderIds.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...products].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
    const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return 0;
  });
};
