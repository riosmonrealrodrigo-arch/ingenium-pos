import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const CATALOG_ORDER_STORAGE_KEY = 'ingenium_store_catalog_order';

// Obtiene la lista ordenada de IDs de productos para la tienda web
export const getCatalogOrder = async (): Promise<string[]> => {
  // 1. Desde localStorage
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

  // 2. Desde Supabase ticket_settings (campo warranty_note con etiqueta [CatalogOrder:...])
  try {
    const { data } = await supabase
      .from('ticket_settings')
      .select('warranty_note')
      .limit(1);

    if (data && data.length > 0 && data[0].warranty_note) {
      const match = data[0].warranty_note.match(/\[CatalogOrder:\s*([\s\S]*?)\]/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(CATALOG_ORDER_STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }

  return [];
};

// Guarda el orden personalizado de productos en la tienda
export const saveCatalogOrder = async (orderedIds: string[]): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CATALOG_ORDER_STORAGE_KEY, JSON.stringify(orderedIds));
  }

  try {
    const { data: existing } = await supabase
      .from('ticket_settings')
      .select('id, warranty_note')
      .limit(1);

    const orderTag = `[CatalogOrder: ${JSON.stringify(orderedIds)}]`;

    if (existing && existing.length > 0) {
      const current = existing[0].warranty_note || '';
      const cleaned = current.replace(/\[CatalogOrder:\s*[\s\S]*?\]\s*/g, '').trim();
      const updated = cleaned ? `${cleaned}\n${orderTag}` : orderTag;

      await supabase
        .from('ticket_settings')
        .update({ warranty_note: updated })
        .eq('id', existing[0].id);
    }
  } catch (err) {
    console.warn('Error al guardar orden del catálogo en Supabase:', err);
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

    // Si ninguno tiene orden específico o empatan, mantener orden reciente
    return 0;
  });
};
