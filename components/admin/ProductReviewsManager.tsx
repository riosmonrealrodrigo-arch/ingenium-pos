'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Trash2,
  Check,
  Search,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
  Maximize2,
  X,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { Product, ProductReview } from '@/types';
import { extractProductMetadata, formatDate } from '@/lib/utils';
import {
  getReviewsEnabledStatus,
  setReviewsEnabledStatus,
  deleteProductReview,
} from '@/lib/reviews';

interface ReviewWithProduct extends ProductReview {
  product: Product;
}

export default function ProductReviewsManager() {
  const { products, loadProducts } = useProducts();
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    getReviewsEnabledStatus().then(setReviewsEnabled);
  }, []);

  const handleToggleReviews = async () => {
    const nextVal = !reviewsEnabled;
    setToggling(true);
    setReviewsEnabled(nextVal);
    try {
      await setReviewsEnabledStatus(nextVal);
      setFeedbackMessage(
        nextVal
          ? 'Sistema de calificaciones ACTIVADO en la tienda web.'
          : 'Sistema de calificaciones DESACTIVADO en la tienda web.'
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch {
      setReviewsEnabled(!nextVal);
    } finally {
      setToggling(false);
    }
  };

  // Extraer todas las opiniones de todos los productos
  const allReviews: ReviewWithProduct[] = useMemo(() => {
    const list: ReviewWithProduct[] = [];
    for (const prod of products) {
      const { reviews } = extractProductMetadata(prod.description, prod.image_url);
      for (const rev of reviews) {
        list.push({ ...rev, product: prod });
      }
    }
    // Ordenar de más reciente a más antigua
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products]);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(rev => {
      const matchesSearch =
        rev.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        rev.comment.toLowerCase().includes(search.toLowerCase()) ||
        rev.product.name.toLowerCase().includes(search.toLowerCase()) ||
        rev.product.code.toLowerCase().includes(search.toLowerCase());

      const matchesRating =
        filterRating === 'all' ? true : Math.round(rev.rating) === filterRating;

      return matchesSearch && matchesRating;
    });
  }, [allReviews, search, filterRating]);

  const handleDelete = async (rev: ReviewWithProduct) => {
    if (
      !confirm(
        `¿Eliminar permanentemente la opinión de "${rev.customer_name}" del producto "${rev.product.name}"?`
      )
    ) {
      return;
    }

    setDeletingId(rev.id);
    try {
      await deleteProductReview(rev.product, rev.id);
      await loadProducts();
      setFeedbackMessage('Opinión eliminada correctamente del producto.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error('Error al eliminar opinión:', err);
      alert(`⚠️ No se pudo eliminar la opinión: ${err?.message || 'Error de base de datos'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPhotos = allReviews.reduce((sum, r) => sum + (r.photos?.length || 0), 0);
  const avgTotal =
    allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Encabezado y Switch de Activación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Star size={20} className="fill-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base">
              Calificaciones y Opiniones de Clientes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Controla si los clientes pueden calificar productos en la tienda web y modera o elimina comentarios.
            </p>
          </div>
        </div>

        {/* Switch On/Off */}
        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-800">
              {reviewsEnabled ? 'Calificaciones activas' : 'Calificaciones pausadas'}
            </p>
            <p className="text-[10px] text-gray-400">
              {reviewsEnabled ? 'Visible en tienda web' : 'Oculto para clientes'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reviewsEnabled}
            disabled={toggling}
            onClick={handleToggleReviews}
            className="relative cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] rounded-full shrink-0"
            style={{
              width: '48px',
              height: '28px',
              backgroundColor: reviewsEnabled ? '#2563eb' : '#d1d5db',
              borderRadius: '9999px',
            }}
          >
            <span
              className="absolute bg-white shadow-md transition-all duration-200 ease-in-out pointer-events-none"
              style={{
                top: '4px',
                left: reviewsEnabled ? '24px' : '4px',
                width: '20px',
                height: '20px',
                borderRadius: '9999px',
              }}
            />
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <p className="text-lg sm:text-2xl font-black text-gray-900">{allReviews.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Opiniones totales</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-lg sm:text-2xl font-black text-gray-900">{avgTotal}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Promedio estrellas</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
          <p className="text-lg sm:text-2xl font-black text-gray-900">{totalPhotos}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">Fotos subidas</p>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, comentario o producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 5, 4, 3, 2, 1] as const).map(star => (
            <button
              key={String(star)}
              type="button"
              onClick={() => setFilterRating(star)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterRating === star
                  ? 'bg-[#1e3a5f] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {star === 'all' ? 'Todas' : `${star} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Opiniones para moderar */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
          <MessageSquare size={30} className="mx-auto text-gray-300" />
          <p className="text-xs font-bold text-gray-700">
            {allReviews.length === 0
              ? 'Aún no hay opiniones registradas en el catálogo.'
              : 'No se encontraron opiniones con los filtros aplicados.'}
          </p>
          <p className="text-[11px] text-gray-400">
            Los clientes pueden dejar sus opiniones y fotos en la página de cada producto.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredReviews.map(rev => (
            <div
              key={rev.id}
              className="p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white transition space-y-2.5"
            >
              {/* Info de Producto + Estrellas */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={rev.product.image_url || '/images/logo.jpg'}
                    alt={rev.product.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/tienda/${rev.product.id}`}
                        target="_blank"
                        className="font-bold text-xs text-[#1e3a5f] hover:text-[#2563eb] hover:underline flex items-center gap-1 truncate"
                      >
                        <span>{rev.product.name}</span>
                        <ExternalLink size={11} className="shrink-0 text-gray-400" />
                      </Link>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-gray-200 text-gray-700">
                        {rev.product.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={12}
                            className={
                              rev.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">· {formatDate(rev.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Botón Eliminar Comentario */}
                <button
                  type="button"
                  onClick={() => handleDelete(rev)}
                  disabled={deletingId === rev.id}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40"
                  title="Eliminar este comentario"
                >
                  <Trash2 size={13} />
                  <span>{deletingId === rev.id ? 'Eliminando...' : 'Eliminar'}</span>
                </button>
              </div>

              {/* Contenido del comentario */}
              <div className="text-xs text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                {rev.title && <p className="font-bold text-gray-900">{rev.title}</p>}
                <p className="leading-relaxed whitespace-pre-line">{rev.comment}</p>
              </div>

              {/* Fotos del cliente */}
              {rev.photos && rev.photos.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5 overflow-x-auto pb-1">
                  {rev.photos.map((photo, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setActivePhotoModal(photo)}
                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer shrink-0"
                    >
                      <img
                        src={photo}
                        alt={`Foto de cliente ${pIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Maximize2 size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Autor */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-800">Por: {rev.customer_name}</span>
                {rev.customer_phone && <span>· WhatsApp: {rev.customer_phone}</span>}
                {rev.verified_purchase && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 ml-auto">
                    <ShieldCheck size={12} /> Verificado
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para ver fotos ampliadas */}
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
    </div>
  );
}
