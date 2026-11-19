import { Product, ProductReview } from '@/types';
import { supabase } from '@/lib/supabase';
import { extractProductMetadata, formatDescriptionWithMetadata } from '@/lib/utils';

export const REVIEWS_STORAGE_KEY = 'ingenium_store_reviews_enabled';

// Obtiene el estado global de calificaciones (activado/desactivado)
export const getReviewsEnabledStatus = async (): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (cached !== null) {
      return cached === 'true';
    }
  }

  try {
    const { data } = await supabase
      .from('ticket_settings')
      .select('social_media')
      .limit(1);

    if (data && data.length > 0 && data[0].social_media) {
      if (data[0].social_media.includes('REVIEWS:off')) {
        return false;
      }
      if (data[0].social_media.includes('REVIEWS:on')) {
        return true;
      }
    }
  } catch {
    // fallback
  }

  return true; // Habilitado por defecto
};

// Guarda el estado global de calificaciones
export const setReviewsEnabledStatus = async (enabled: boolean): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEWS_STORAGE_KEY, enabled ? 'true' : 'false');
  }

  try {
    const { data: existing } = await supabase
      .from('ticket_settings')
      .select('id, social_media')
      .limit(1);

    const flag = enabled ? 'REVIEWS:on' : 'REVIEWS:off';

    if (existing && existing.length > 0) {
      const current = existing[0].social_media || '';
      const cleaned = current.replace(/\|?REVIEWS:(on|off)/g, '').trim();
      const updated = cleaned ? `${cleaned}|${flag}` : flag;

      await supabase
        .from('ticket_settings')
        .update({ social_media: updated })
        .eq('id', existing[0].id);
    }
  } catch (err) {
    console.warn('Error al guardar estado de reseñas en Supabase:', err);
  }
};

// Agrega una nueva reseña con fotos al producto especificado
export const addProductReview = async (
  product: Product,
  newReview: Omit<ProductReview, 'id' | 'created_at'>
): Promise<ProductReview> => {
  const { cleanDescription, gallery, specs, reviews, variants } = extractProductMetadata(
    product.description,
    product.image_url
  );

  const reviewEntry: ProductReview = {
    ...newReview,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const updatedReviews = [reviewEntry, ...reviews];
  const encodedDescription = formatDescriptionWithMetadata(
    cleanDescription,
    gallery,
    specs,
    updatedReviews,
    variants
  );

  // 1. Guardar en Supabase directamente
  const { error } = await supabase
    .from('products')
    .update({ description: encodedDescription })
    .eq('id', product.id);

  if (error) {
    console.error('Error al guardar reseña en Supabase:', error);
    throw new Error(error.message || 'Error de base de datos al guardar la reseña');
  }

  return reviewEntry;
};

// Elimina una reseña específica de un producto (moderación desde ajustes)
export const deleteProductReview = async (
  product: Product,
  reviewId: string
): Promise<void> => {
  const { cleanDescription, gallery, specs, reviews, variants } = extractProductMetadata(
    product.description,
    product.image_url
  );

  const updatedReviews = reviews.filter(r => r.id !== reviewId);
  const encodedDescription = formatDescriptionWithMetadata(
    cleanDescription,
    gallery,
    specs,
    updatedReviews,
    variants
  );

  const { error } = await supabase
    .from('products')
    .update({ description: encodedDescription })
    .eq('id', product.id);

  if (error) {
    console.error('Error al eliminar reseña en Supabase:', error);
    throw new Error(error.message || 'Error al eliminar reseña');
  }
};
