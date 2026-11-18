'use client';
import React, { useState, useRef } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Product, ProductReview, StorefrontCustomer } from '@/types';
import { formatDate, compressImage } from '@/lib/utils';
import { addProductReview } from '@/lib/reviews';

interface ProductReviewsSectionProps {
  product: Product;
  reviews: ProductReview[];
  onReviewAdded: (newReview: ProductReview) => void;
  reviewsEnabled?: boolean;
  customer: StorefrontCustomer | null;
  onOpenAuthModal?: () => void;
}

const RATING_TEXTS: Record<number, string> = {
  1: 'Pésimo 😞',
  2: 'Regular 😐',
  3: 'Bueno 🙂',
  4: 'Muy Bueno 😊',
  5: '¡Excelente! 🌟',
};

export default function ProductReviewsSection({
  product,
  reviews,
  onReviewAdded,
  reviewsEnabled = true,
  customer,
  onOpenAuthModal,
}: ProductReviewsSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState<string>(customer?.name || '');
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync customer name if customer identifies later
  React.useEffect(() => {
    if (customer?.name && !name) {
      setName(customer.name);
    }
  }, [customer, name]);

  // Si las opiniones están desactivadas desde ajustes:
  if (!reviewsEnabled) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 text-center space-y-2">
        <MessageSquare size={32} className="mx-auto text-gray-300" />
        <h3 className="font-bold text-gray-700 text-sm">Opiniones de clientes</h3>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          El sistema de calificaciones está temporalmente desactivado para este catálogo. Si tienes dudas sobre este producto, contáctanos directamente por WhatsApp.
        </p>
      </section>
    );
  }

  // Métricas de calificaciones
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[star] = (counts[star] || 0) + 1;
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 4) {
      alert('Puedes adjuntar hasta 4 fotos en tu opinión.');
    }

    const toProcess = files.slice(0, 4 - photos.length);
    setUploading(true);
    try {
      const compressedList: string[] = [];
      for (const f of toProcess) {
        const compressed = await compressImage(f, 800, 800, 0.7);
        compressedList.push(compressed);
      }
      setPhotos(prev => [...prev, ...compressedList]);
    } catch {
      alert('No se pudo procesar alguna imagen.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor escribe tu nombre.');
      return;
    }
    if (!comment.trim()) {
      alert('Por favor escribe tu opinión sobre el producto.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addProductReview(product, {
        product_id: product.id,
        customer_name: name.trim(),
        customer_phone: customer?.phone || undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        photos: photos.length > 0 ? photos : undefined,
        verified_purchase: true,
      });

      onReviewAdded(created);
      setSubmittedSuccess(true);
      setFormOpen(false);
      setComment('');
      setTitle('');
      setPhotos([]);
      setTimeout(() => setSubmittedSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error al enviar reseña:', err);
      alert(`⚠️ No se pudo enviar tu opinión: ${err?.message || 'Error de conexión'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews =
    filterRating === 'all'
      ? reviews
      : reviews.filter(r => Math.round(r.rating) === filterRating);

  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <MessageSquare size={19} className="text-[#2563eb]" />
            Opiniones de clientes
          </h2>
          <p className="text-xs text-gray-500">
            Experiencias reales de compra y servicio técnico en INGENIUM MOBILE
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(prev => !prev)}
          className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <Sparkles size={14} />
          <span>{formOpen ? 'Cerrar formulario' : 'Calificar este producto'}</span>
        </button>
      </div>

      {/* Banner de confirmación */}
      {submittedSuccess && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-md flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={22} className="shrink-0" />
          <div>
            <p className="font-bold text-sm">¡Muchas gracias por tu opinión!</p>
            <p className="text-xs text-emerald-100">
              Tu reseña y fotografías ya están visibles para la comunidad.
            </p>
          </div>
        </div>
      )}

      {/* Formulario para escribir opinión (desplegable) */}
      {formOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="p-4 sm:p-6 bg-slate-50 border border-blue-200 rounded-2xl space-y-4 animate-scale-up"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-[#1e3a5f]">
              Escribir una opinión sobre {product.name}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Calificación por estrellas */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Tu calificación *
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => {
                  const active = (hoverRating ?? rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer text-amber-400"
                    >
                      <Star
                        size={26}
                        className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
                {RATING_TEXTS[hoverRating ?? rating]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tu nombre *</label>
              <input
                type="text"
                required
                placeholder="Ej: Carlos M."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Título breve (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Quedó excelente / Muy buena calidad"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tu opinión detallada *
            </label>
            <textarea
              required
              rows={3}
              placeholder="¿Qué tal funcionó la pieza o reparación? ¿Cómo fue el trato y tiempo de entrega?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none"
            />
          </div>

          {/* Subir fotos del producto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Fotos del producto o reparación (Hasta 4 fotos)</span>
              <span className="text-[11px] text-gray-400 font-normal">{photos.length}/4</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || photos.length >= 4}
                className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>Subir fotos</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading || photos.length >= 4}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
              >
                <Camera size={14} />
                <span>Tomar foto</span>
              </button>
            </div>

            {/* Previsualización de fotos */}
            {photos.length > 0 && (
              <div className="flex items-center gap-2 pt-2.5 overflow-x-auto pb-1">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0"
                  >
                    <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar opinión</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Resumen de Calificaciones (Estilo Mercado Libre) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gray-50/70 p-4 sm:p-6 rounded-2xl border border-gray-100">
        <div className="md:col-span-4 text-center md:text-left space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-4xl sm:text-5xl font-black text-gray-900 leading-none">
              {averageRating}
            </span>
            <div>
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={18}
                    className={
                      parseFloat(averageRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : parseFloat(averageRating) >= star - 0.5
                        ? 'fill-amber-300 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {totalReviews} {totalReviews === 1 ? 'calificación' : 'calificaciones'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 pt-1">
            El 100% de las opiniones son de clientes que cotizaron o repararon en INGENIUM MOBILE.
          </p>
        </div>

        {/* Barras de desglose por estrellas */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map(star => {
            const count = counts[star] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                className={`w-full flex items-center gap-2 text-xs transition p-1 rounded-lg ${
                  filterRating === star ? 'bg-blue-100/70 font-bold' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <span className="w-16 text-left font-medium">{star} estrellas</span>
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  />
                </div>
                <span className="w-8 text-right text-gray-400 text-[11px]">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Opiniones */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
          <MessageSquare size={36} className="mx-auto text-gray-300" />
          <p className="text-xs sm:text-sm font-bold text-gray-700">
            {totalReviews === 0
              ? 'Aún no hay opiniones para este producto.'
              : 'No hay opiniones con esta cantidad de estrellas.'}
          </p>
          <p className="text-xs text-gray-400">
            {totalReviews === 0
              ? '¡Sé el primero en calificarlo y compartir tu experiencia!'
              : 'Prueba quitando el filtro para ver todas las opiniones.'}
          </p>
          {filterRating !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterRating('all')}
              className="text-xs font-bold text-[#2563eb] hover:underline"
            >
              Ver todas las opiniones
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(rev => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 shadow-2xs space-y-2.5 transition"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          rev.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  {rev.title && (
                    <span className="font-bold text-xs sm:text-sm text-gray-900">
                      {rev.title}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400">{formatDate(rev.created_at)}</span>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>

              {/* Fotos subidas por el cliente */}
              {rev.photos && rev.photos.length > 0 && (
                <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                  {rev.photos.map((photo, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setActivePhotoModal(photo)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer shrink-0"
                    >
                      <img
                        src={photo}
                        alt={`Foto de cliente ${pIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-700">{rev.customer_name}</span>
                {rev.verified_purchase && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <ShieldCheck size={12} /> Compra / Servicio Verificado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox para ver fotos de clientes en grande */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-xl w-full max-h-[85vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={activePhotoModal}
              alt="Foto ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
}
