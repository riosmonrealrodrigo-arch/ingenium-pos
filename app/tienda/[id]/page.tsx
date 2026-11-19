'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useProducts } from '@/context/ProductContext';
import { useStoreTheme } from '@/context/StoreThemeContext';
import { Product, StorefrontCustomer, ProductReview, ProductVariantGroup } from '@/types';
import { formatCurrency, extractProductMetadata } from '@/lib/utils';
import { isRepuesto, isAccesorio, isServicio } from '@/lib/categories';
import { getReviewsEnabledStatus } from '@/lib/reviews';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/layout/Footer';
import ClientAuthModal from '@/components/store/ClientAuthModal';
import FloatingChatWidget from '@/components/store/FloatingChatWidget';
import ProductReviewsSection from '@/components/store/ProductReviewsSection';
import { SoundToggleButton } from '@/components/store/StoreSoundEffects';
import {
  ArrowLeft,
  ShoppingBag,
  MessageSquare,
  ShieldCheck,
  Wrench,
  Sparkles,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  ListChecks,
  FileText,
  Package,
  Truck,
  User,
  LogOut,
  PhoneCall,
  Minus,
  Plus,
  Star,
  Image as ImageIcon,
  Layers,
  Tag,
} from 'lucide-react';

const FALLBACK_SERVICE_IMG =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
const FALLBACK_PRODUCT_IMG =
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80';

export default function ProductoDetalleTiendaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, loadProducts } = useProducts();
  const { currentTheme } = useStoreTheme();

  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);

  // Storefront customer & cart synced with /tienda
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(false);
  const [cart, setCart] = useState<{ product: Product; quantity: number; selected_variant?: string }[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [reviewsEnabled, setReviewsEnabled] = useState(true);
  const [currentReviews, setCurrentReviews] = useState<ProductReview[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Hydrate customer & cart from localStorage + load catalog + review settings
  useEffect(() => {
    loadProducts();
    getReviewsEnabledStatus().then(setReviewsEnabled);
    if (typeof window !== 'undefined') {
      try {
        const savedCust = localStorage.getItem('ingenium_store_customer');
        if (savedCust) setCustomer(JSON.parse(savedCust));
      } catch {
        // ignore
      }
      try {
        const savedCart = localStorage.getItem('ingenium_store_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
      } catch {
        // ignore
      }
    }
  }, [loadProducts]);

  // Persist cart changes to localStorage
  const updateCart = (
    updater: (
      prev: { product: Product; quantity: number; selected_variant?: string }[]
    ) => { product: Product; quantity: number; selected_variant?: string }[]
  ) => {
    setCart(prev => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ingenium_store_cart', JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  // Resolve current product from memory or Supabase directly
  const productFromList = useMemo(
    () => products.find(p => p.id === id || p.code === id) || null,
    [products, id]
  );

  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    if (productFromList) {
      setFetchedProduct(productFromList);
      setLoadingProduct(false);
      return;
    }

    if (!id) return;
    setLoadingProduct(true);
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setFetchedProduct(data);
        }
        setLoadingProduct(false);
      });
  }, [id, productFromList]);

  const product = productFromList || fetchedProduct;

  const isServiceItem = product ? isServicio(product) : false;
  const isAccItem = product ? isAccesorio(product) : false;
  const isRepItem = product ? isRepuesto(product) : false;
  const isAvailable = product ? product.stock > 0 : false;
  const hasPrice = product ? typeof product.sale_price === 'number' && product.sale_price > 0 : false;

  const categoryLabel = isServiceItem
    ? 'Servicio de Reparación'
    : isAccItem
    ? 'Cargadores & Accesorios'
    : 'Repuestos & Pantallas';

  // Extract gallery, clean description, custom specs, reviews and variants
  const { cleanDescription, gallery, specs, reviews, variants } = useMemo(() => {
    if (!product) return { cleanDescription: '', gallery: [], specs: [], reviews: [], variants: [] };
    return extractProductMetadata(product.description, product.image_url);
  }, [product]);

  const activeVariantGroups = useMemo(
    () => (variants || []).filter(v => v.enabled && v.options && v.options.length > 0),
    [variants]
  );

  useEffect(() => {
    if (activeVariantGroups.length > 0) {
      setSelectedVariants(prev => {
        const next: Record<string, string> = { ...prev };
        for (const group of activeVariantGroups) {
          if (!next[group.id] || !group.options.includes(next[group.id])) {
            next[group.id] = group.options[0];
          }
        }
        return next;
      });
    }
  }, [activeVariantGroups]);

  const selectedVariantSummary = useMemo(() => {
    if (activeVariantGroups.length === 0) return '';
    return activeVariantGroups
      .map(g => `${g.title}: ${selectedVariants[g.id] || g.options[0]}`)
      .join(' · ');
  }, [activeVariantGroups, selectedVariants]);

  const shortVariantBadge = useMemo(() => {
    if (activeVariantGroups.length === 0) return '';
    return activeVariantGroups
      .map(g => selectedVariants[g.id] || g.options[0])
      .join(' / ');
  }, [activeVariantGroups, selectedVariants]);

  useEffect(() => {
    if (reviews) {
      setCurrentReviews(reviews);
    }
  }, [reviews]);

  const displayGallery = useMemo(() => {
    if (gallery.length > 0) return gallery;
    return [isServiceItem ? FALLBACK_SERVICE_IMG : FALLBACK_PRODUCT_IMG];
  }, [gallery, isServiceItem]);

  const activeImage = displayGallery[selectedImageIdx] || displayGallery[0];

  // Combine custom specs + structured baseline characteristics (no duplicates)
  const allCharacteristics = useMemo(() => {
    if (!product) return [];
    const list = [...specs];
    const hasLabel = (needle: string) =>
      list.some(s => s.label.toLowerCase().includes(needle.toLowerCase()));

    const defaults: { label: string; value: string }[] = [
      { label: 'Categoría', value: categoryLabel },
      { label: 'Código SKU', value: product.code },
      {
        label: 'Disponibilidad',
        value: isServiceItem
          ? 'Disponible en taller'
          : isAvailable
          ? `En stock (${product.stock} ${product.stock === 1 ? 'unidad' : 'unidades'})`
          : 'Agotado temporalmente',
      },
      {
        label: 'Condición',
        value: isServiceItem ? 'Servicio técnico profesional' : 'Nuevo · Garantizado',
      },
      { label: 'Garantía', value: 'Garantía escrita oficial INGENIUM MOBILE' },
      { label: 'Moneda', value: 'Pesos Mexicanos ($ MXN) · IVA incluido' },
    ];

    for (const def of defaults) {
      if (!hasLabel(def.label.split(' ')[0])) {
        list.push(def);
      }
    }
    return list;
  }, [product, specs, categoryLabel, isServiceItem, isAvailable]);

  // Smart Related Products (same category + title keyword similarity)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const activeStore = products.filter(
      p => p.id !== product.id && p.visible_en_tienda !== false && p.active !== false
    );

    const words = product.name
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    const scored = activeStore.map(candidate => {
      let score = 0;
      const sameCategory =
        (isServiceItem && isServicio(candidate)) ||
        (isAccItem && isAccesorio(candidate)) ||
        (isRepItem && isRepuesto(candidate));
      if (sameCategory) score += 10;

      const candName = candidate.name.toLowerCase();
      for (const w of words) {
        if (candName.includes(w)) score += 3;
      }
      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map(s => s.candidate);
  }, [product, products, isServiceItem, isAccItem, isRepItem]);

  const addProductToCart = (prod: Product, qty: number, variantSummary?: string) => {
    updateCart(prev => {
      const variantKey = (variantSummary || '').trim();
      const exists = prev.find(
        i => i.product.id === prod.id && (i.selected_variant || '') === variantKey
      );
      if (exists) {
        return prev.map(i =>
          i.product.id === prod.id && (i.selected_variant || '') === variantKey
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { product: prod, quantity: qty, selected_variant: variantKey || undefined }];
    });
    setCartDrawerOpen(true);
  };

  const handleBuyAction = () => {
    if (!product) return;
    if (!customer) {
      setPendingAdd(true);
      setAuthModalOpen(true);
      return;
    }
    addProductToCart(product, quantity, shortVariantBadge);
  };

  const handleAuthSuccess = (c: StorefrontCustomer) => {
    setCustomer(c);
    if (pendingAdd && product) {
      addProductToCart(product, quantity, shortVariantBadge);
      setPendingAdd(false);
    }
  };

  const handleLogoutCustomer = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_store_customer');
    }
    setCustomer(null);
  };

  const handleShare = async () => {
    if (!product || typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | INGENIUM MOBILE`,
          text: `Mira este ${isServiceItem ? 'servicio' : 'producto'} en INGENIUM MOBILE: ${product.name}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleWhatsAppInquiry = () => {
    if (!product) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const variantNote = shortVariantBadge ? `\n*Opción / Versión deseada:* ${selectedVariantSummary}` : '';
    const msg =
      isServiceItem && !hasPrice
        ? `¡Hola INGENIUM MOBILE! 👋 Me interesa cotizar el servicio de reparación: *${product.name}* (Código: ${product.code}).${variantNote}\n\nEnlace: ${url}\n\n¿Cuál sería el costo y tiempo de entrega?`
        : `¡Hola INGENIUM MOBILE! 👋 Me interesa información sobre: *${product.name}* (Código: ${product.code}${hasPrice ? ` · ${formatCurrency(product.sale_price)}` : ''}).${variantNote}\n\nEnlace: ${url}`;
    window.open(`https://wa.me/528139629319?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);

  const handleCheckoutWhatsApp = () => {
    if (!customer || cart.length === 0) return;

    const itemsText = cart
      .map(i => {
        const variantTag = i.selected_variant ? ` [${i.selected_variant}]` : '';
        return `• ${i.quantity}x ${i.product.name}${variantTag} (${formatCurrency(i.product.sale_price * i.quantity)})`;
      })
      .join('\n');

    const msg =
      `*¡NUEVO PEDIDO DESDE CATÁLOGO ONLINE!* 📱🛒\n\n` +
      `*Cliente:* ${customer.name}\n` +
      `*WhatsApp:* ${customer.phone}\n\n` +
      `*Productos:* \n${itemsText}\n\n` +
      `*Total a Pagar:* ${formatCurrency(cartTotal)}\n\n` +
      `_Por favor confirmar disponibilidad y método de entrega/retiro._`;

    window.open(`https://wa.me/528139629319?text=${encodeURIComponent(msg)}`, '_blank');
    setOrderSent(true);
    updateCart(() => []);
  };

  const prevImage = () =>
    setSelectedImageIdx(i => (i === 0 ? displayGallery.length - 1 : i - 1));
  const nextImage = () =>
    setSelectedImageIdx(i => (i === displayGallery.length - 1 ? 0 : i + 1));

  return (
    <div className="min-h-screen bg-[#ededed] sm:bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Banner */}
      <div
        style={{ background: currentTheme.navTopGradient }}
        className="text-white text-[11px] py-1 px-4 border-b border-white/10 flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Sparkles size={12} /> Taller & Tienda Oficial
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/80">Garantía escrita · Atención directa</span>
        </div>
        <div className="flex items-center gap-2.5 text-white/70 text-[10px]">
          <SoundToggleButton />
          <span className="hidden sm:inline">
            Moneda Oficial: <strong className="text-amber-400">$ MXN</strong>
          </span>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.push('/tienda')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer shrink-0"
              title="Volver al catálogo"
            >
              <ArrowLeft size={16} />
            </button>
            <Link href="/tienda" className="flex items-center gap-2 group min-w-0">
              <img
                src="/images/logo.jpg"
                alt="INGENIUM MOBILE"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-black text-[#1e3a5f] tracking-tight truncate">
                    INGENIUM MOBILE
                  </span>
                  <span className="text-[9px] bg-blue-100 text-[#2563eb] font-bold px-1 py-0.5 rounded shrink-0">
                    TIENDA
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {customer ? (
              <div className="hidden sm:flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 text-[11px]">
                <User size={13} className="text-[#2563eb]" />
                <span className="font-bold text-[#1e3a5f] max-w-[100px] truncate">{customer.name}</span>
                <button
                  onClick={handleLogoutCustomer}
                  title="Salir"
                  className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition cursor-pointer"
              >
                <User size={13} /> Identificarme
              </button>
            )}

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2 bg-[#1e3a5f] hover:bg-[#162a45] text-white rounded-full shadow-sm transition cursor-pointer"
              title="Ver Carrito"
            >
              <ShoppingBag size={17} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f59e0b] text-[#1e3a5f] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {cart.reduce((c, i) => c + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-20 sm:pb-12 space-y-4 sm:space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center flex-wrap gap-1.5 text-[11px] sm:text-xs text-gray-500 px-1">
          <Link href="/tienda" className="hover:text-[#2563eb] font-semibold transition">
            Volver al catálogo
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">{categoryLabel}</span>
          {product && (
            <>
              <span>/</span>
              <span className="text-gray-400 truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
            </>
          )}
        </nav>

        {loadingProduct && !product ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-gray-200/80">
            <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-500">Cargando detalles del producto...</p>
          </div>
        ) : !product ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-gray-200/80 space-y-3">
            <Package size={44} className="mx-auto text-gray-300" />
            <h2 className="font-black text-lg text-gray-800">Producto no encontrado</h2>
            <p className="text-xs text-gray-500">
              Es posible que este artículo ya no esté disponible en el catálogo.
            </p>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white font-bold rounded-xl text-xs"
            >
              <ArrowLeft size={14} /> Volver al catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* TARJETA PRINCIPAL ESTILO MERCADO LIBRE */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 p-3.5 sm:p-6">
                {/* Columna Izquierda: Galería Multimedia */}
                <div className="lg:col-span-7 flex flex-col md:flex-row gap-3">
                  {/* Miniaturas verticales (Escritorio estilo Mercado Libre) */}
                  {displayGallery.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 w-16 shrink-0 max-h-[440px] overflow-y-auto pr-0.5">
                      {displayGallery.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => setSelectedImageIdx(idx)}
                          onClick={() => setSelectedImageIdx(idx)}
                          className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-gray-50 transition cursor-pointer shrink-0 ${
                            selectedImageIdx === idx
                              ? 'border-[#2563eb] ring-2 ring-blue-500/20'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Foto Principal + Controles */}
                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="relative aspect-[4/3] sm:aspect-square lg:aspect-[4/3] max-h-[440px] w-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group flex items-center justify-center">
                      <img
                        src={activeImage}
                        alt={product.name}
                        onClick={() => setLightboxOpen(true)}
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                      />

                      {/* Contador de fotos */}
                      {displayGallery.length > 1 && (
                        <span className="absolute top-3 left-3 bg-gray-900/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                          {selectedImageIdx + 1} / {displayGallery.length}
                        </span>
                      )}

                      {/* Botón Zoom */}
                      <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        title="Ampliar imagen"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md flex items-center justify-center transition cursor-pointer"
                      >
                        <Maximize2 size={14} />
                      </button>

                      {/* Flechas anterior / siguiente */}
                      {displayGallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition cursor-pointer"
                            title="Imagen anterior"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition cursor-pointer"
                            title="Siguiente imagen"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Miniaturas horizontales en celular */}
                    {displayGallery.length > 1 && (
                      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {displayGallery.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImageIdx(idx)}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 bg-gray-50 shrink-0 cursor-pointer ${
                              selectedImageIdx === idx ? 'border-[#2563eb]' : 'border-gray-200'
                            }`}
                          >
                            <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Caja de Compra / Cotización */}
                <div className="lg:col-span-5 mt-4 lg:mt-0 lg:border lg:border-gray-200/90 lg:rounded-2xl lg:p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Etiqueta estado + código */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-bold text-gray-500">
                        {isServiceItem ? 'Servicio en Taller' : 'Nuevo'} · SKU:{' '}
                        <strong className="text-gray-700">{product.code}</strong>
                      </span>
                      {isServiceItem ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Wrench size={11} /> Servicio Técnico
                        </span>
                      ) : isAvailable ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          ● Stock disponible ({product.stock})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          Agotado
                        </span>
                      )}
                    </div>

                    {/* Título */}
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                      {product.name}
                    </h1>

                    {/* Resumen de Calificación debajo del título */}
                    {reviewsEnabled && currentReviews.length > 0 && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map(star => {
                            const avgVal =
                              currentReviews.reduce((sum, r) => sum + r.rating, 0) /
                              currentReviews.length;
                            return (
                              <Star
                                key={star}
                                size={14}
                                className={
                                  avgVal >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : avgVal >= star - 0.5
                                    ? 'fill-amber-300 text-amber-400'
                                    : 'text-gray-300'
                                }
                              />
                            );
                          })}
                        </div>
                        <span className="text-xs font-black text-gray-800">
                          {(
                            currentReviews.reduce((sum, r) => sum + r.rating, 0) /
                            currentReviews.length
                          ).toFixed(1)}
                        </span>
                        <a
                          href="#seccion-opiniones"
                          className="text-xs text-[#2563eb] hover:underline"
                        >
                          ({currentReviews.length}{' '}
                          {currentReviews.length === 1 ? 'opinión' : 'opiniones'})
                        </a>
                      </div>
                    )}

                    {/* Bloque de Precio o Cotización */}
                    {isServiceItem && !hasPrice ? (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-0.5">
                        <p className="text-xs font-black text-amber-800 uppercase tracking-wider">
                          Servicio Técnico Personalizado
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          Cotización según modelo y diagnóstico
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Escríbenos por WhatsApp y te damos presupuesto sin compromiso.
                        </p>
                      </div>
                    ) : (
                      <div className="pt-1">
                        {isServiceItem && (
                          <span className="text-[11px] font-semibold text-gray-500 block">
                            Costo desde
                          </span>
                        )}
                        <p className="text-3xl sm:text-4xl font-black text-[#1e3a5f] tracking-tight">
                          {formatCurrency(product.sale_price)}
                        </p>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          Precio final con IVA incluido · Moneda Nacional
                        </p>
                      </div>
                    )}

                    {/* Lo que tienes que saber (Top specs bullets estilo Mercado Libre) */}
                    {specs.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <p className="text-xs font-bold text-gray-800">
                          Lo que tienes que saber de este {isServiceItem ? 'servicio' : 'producto'}:
                        </p>
                        <ul className="space-y-1 text-xs text-gray-600">
                          {specs.slice(0, 4).map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-[#2563eb] font-black mt-0.5">•</span>
                              <span>
                                <strong className="text-gray-800">{s.label}:</strong> {s.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Selector interactivo de Variantes (Conectores, Colores, Medidas, etc.) */}
                    {activeVariantGroups.length > 0 && (
                      <div className="p-3.5 sm:p-4 bg-slate-50 border border-blue-200/90 rounded-2xl space-y-3.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-[#1e3a5f] uppercase tracking-wide flex items-center gap-1.5">
                            <Layers size={14} className="text-[#2563eb]" /> Selecciona tu opción:
                          </p>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                            Mismo precio
                          </span>
                        </div>

                        {activeVariantGroups.map(group => {
                          const currentVal = selectedVariants[group.id] || group.options[0];
                          return (
                            <div key={group.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-700">{group.title}:</span>
                                <span className="font-black text-[#2563eb] bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs">
                                  {currentVal}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {group.options.map(opt => {
                                  const isSelected = currentVal === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setSelectedVariants(prev => ({
                                          ...prev,
                                          [group.id]: opt,
                                        }))
                                      }
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-xs ring-2 ring-blue-500/20'
                                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                                      }`}
                                    >
                                      {isSelected && <Check size={12} className="text-emerald-400 stroke-[3]" />}
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Selector de cantidad (solo productos físicos disponibles) */}
                    {!isServiceItem && isAvailable && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-700">Cantidad:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                            <button
                              type="button"
                              onClick={() => setQuantity(q => Math.max(1, q - 1))}
                              className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-gray-900">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                              className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-[11px] text-gray-400">({product.stock} disp.)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="space-y-2.5 pt-2">
                    {isServiceItem && !hasPrice ? (
                      <button
                        type="button"
                        onClick={handleWhatsAppInquiry}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-[0.99] text-white font-black rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare size={17} />
                        Cotizar Reparación por WhatsApp
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleBuyAction}
                          disabled={!isAvailable && !isServiceItem}
                          className="w-full py-3.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-black rounded-xl text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                          <ShoppingBag size={17} />
                          {isServiceItem ? 'Solicitar Servicio' : 'Agregar al Carrito'}
                        </button>

                        <button
                          type="button"
                          onClick={handleWhatsAppInquiry}
                          className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <PhoneCall size={15} />
                          Preguntar por WhatsApp
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedShare ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-700 font-bold">¡Enlace copiado!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} /> Compartir este {isServiceItem ? 'servicio' : 'producto'}
                        </>
                      )}
                    </button>

                    {/* Beneficios / Confianza */}
                    <div className="pt-3 border-t border-gray-100 space-y-2 text-[11px] text-gray-600">
                      <div className="flex items-start gap-2">
                        <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-gray-800">Garantía Escrita Oficial</strong> respaldada por INGENIUM MOBILE.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Truck size={15} className="text-[#2563eb] shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-gray-800">Retiro en taller</strong> en Sombrerete, Zac. o coordinación por WhatsApp.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: CARACTERÍSTICAS Y DESCRIPCIÓN COMPLETA */}
              <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8 space-y-6 bg-white">
                {/* Tabla de Características estilo Mercado Libre */}
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                    <ListChecks size={19} className="text-[#2563eb]" />
                    Características del {isServiceItem ? 'servicio' : 'producto'}
                  </h2>

                  <div className="rounded-xl border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {allCharacteristics.map((row, idx) => (
                      <div
                        key={`${row.label}-${idx}`}
                        className={`flex items-center justify-between gap-3 px-4 py-3 text-xs sm:text-sm border-b border-gray-100 ${
                          idx % 2 === 0 ? 'bg-gray-50/90' : 'bg-white'
                        } md:odd:border-r md:border-gray-100`}
                      >
                        <span className="font-bold text-gray-600">{row.label}</span>
                        <span className="text-gray-900 font-medium text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descripción detallada */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                    <FileText size={19} className="text-[#2563eb]" />
                    Descripción
                  </h2>
                  <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-gray-100">
                    {product.commercial_description ||
                      cleanDescription ||
                      (isServiceItem
                        ? 'Servicio técnico profesional realizado por especialistas en taller con garantía escrita.'
                        : 'Producto garantizado de alta calidad disponible en INGENIUM MOBILE.')}
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN: OPINIONES Y CALIFICACIONES DE CLIENTES */}
            <div id="seccion-opiniones">
              <ProductReviewsSection
                product={product}
                reviews={currentReviews}
                onReviewAdded={newRev => setCurrentReviews(prev => [newRev, ...prev])}
                reviewsEnabled={reviewsEnabled}
                customer={customer}
                onOpenAuthModal={() => setAuthModalOpen(true)}
              />
            </div>

            {/* SECCIÓN: PRODUCTOS Y SERVICIOS RELACIONADOS */}
            {relatedProducts.length > 0 && (
              <section className="space-y-3 sm:space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900">
                      Productos y servicios relacionados
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500">
                      Otras opciones disponibles en {categoryLabel} y nuestro catálogo
                    </p>
                  </div>
                  <Link
                    href="/tienda"
                    className="text-xs font-bold text-[#2563eb] hover:underline shrink-0"
                  >
                    Ver todo →
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-5">
                  {relatedProducts.map(rel => {
                    const relIsService = isServicio(rel);
                    const relHasPrice = typeof rel.sale_price === 'number' && rel.sale_price > 0;
                    const relMeta = extractProductMetadata(rel.description, rel.image_url);
                    const relPhoto =
                      relMeta.gallery[0] ||
                      (relIsService ? FALLBACK_SERVICE_IMG : FALLBACK_PRODUCT_IMG);

                    return (
                      <Link
                        key={rel.id}
                        href={`/tienda/${rel.id}`}
                        className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
                      >
                        <div className="relative h-28 sm:h-40 bg-gray-100 overflow-hidden">
                          <img
                            src={relPhoto}
                            alt={rel.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {relMeta.gallery.length > 1 && (
                            <span className="absolute bottom-1.5 right-1.5 bg-gray-900/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <ImageIcon size={9} /> {relMeta.gallery.length}
                            </span>
                          )}
                          <span className="absolute top-1.5 left-1.5 text-[8px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-[#1e3a5f]/90 text-white">
                            {rel.code}
                          </span>
                        </div>
                        <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-[#2563eb] transition line-clamp-2 leading-snug">
                            {rel.name}
                          </h3>
                          {relIsService && !relHasPrice ? (
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                              Cotizar en taller
                            </span>
                          ) : (
                            <p className="font-black text-sm sm:text-base text-[#1e3a5f]">
                              {formatCurrency(rel.sale_price)}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Fullscreen Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>

          {displayGallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={activeImage}
            alt={product?.name || 'Imagen ampliada'}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />

          {displayGallery.length > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-bold px-3.5 py-1 rounded-full border border-white/20">
              {selectedImageIdx + 1} / {displayGallery.length}
            </span>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#2563eb]" />
                <h3 className="font-bold text-base text-gray-900">Carrito de Compras</h3>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSent ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check size={32} />
                </div>
                <h4 className="font-black text-lg text-gray-800">¡Pedido Enviado a WhatsApp!</h4>
                <p className="text-xs text-gray-500">
                  Un asesor de INGENIUM MOBILE ya recibió el detalle para apartar tus piezas o coordinar entrega.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-left text-xs text-blue-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[#2563eb]">
                    <Sparkles size={14} /> ¡Tu opinión nos ayuda a crecer!
                  </p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Una vez que recibas o retires tu compra, puedes calificar el producto y compartir fotos de cómo quedó en esta misma página.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOrderSent(false);
                    setCartDrawerOpen(false);
                  }}
                  className="px-6 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Seguir explorando
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-gray-400">
                <ShoppingBag size={40} className="opacity-30" />
                <p className="text-sm font-medium">Tu carrito está vacío</p>
                <p className="text-xs">Agrega productos para apartar o pedir a domicilio.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${item.selected_variant || 'def'}-${idx}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <img
                        src={item.product.image_url || FALLBACK_PRODUCT_IMG}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{item.product.name}</p>
                        {item.selected_variant && (
                          <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/70 font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 max-w-full truncate">
                            <Tag size={10} className="shrink-0" /> {item.selected_variant}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500">
                          {formatCurrency(item.product.sale_price)} x {item.quantity}
                        </p>
                        <p className="font-black text-xs text-[#2563eb] mt-0.5">
                          {formatCurrency(item.product.sale_price * item.quantity)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateCart(prev => prev.filter((_, i) => i !== idx))
                        }
                        className="text-red-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                        title="Quitar del carrito"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm font-black text-[#1e3a5f]">
                    <span>Total estimado:</span>
                    <span className="text-lg">{formatCurrency(cartTotal)}</span>
                  </div>

                  <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-[#2563eb] cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      He leído y acepto los{' '}
                      <Link href="/terminos" target="_blank" className="text-[#2563eb] font-bold hover:underline">
                        Términos
                      </Link>{' '}
                      y las{' '}
                      <Link href="/garantias" target="_blank" className="text-[#2563eb] font-bold hover:underline">
                        Políticas de Garantía
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    onClick={handleCheckoutWhatsApp}
                    disabled={!termsAccepted}
                    className={`w-full py-3.5 text-white font-black rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                      termsAccepted
                        ? 'bg-[#25D366] hover:bg-[#1ebe5d] cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <PhoneCall size={18} /> Confirmar Pedido por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Client Auth Modal */}
      <ClientAuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAdd(false);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <Footer />

      {/* Floating Chat Assistant */}
      <FloatingChatWidget businessName="INGENIUM MOBILE" businessPhone="+52 81 3962 9319" />
    </div>
  );
}
