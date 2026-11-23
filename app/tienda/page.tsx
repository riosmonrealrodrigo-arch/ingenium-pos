'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/context/ProductContext';
import { useStoreTheme } from '@/context/StoreThemeContext';
import { useAuth } from '@/context/AuthContext';
import Footer from '@/components/layout/Footer';
import { Product, StorefrontCustomer } from '@/types';
import { formatCurrency, extractProductMetadata } from '@/lib/utils';
import { isRepuesto, isAccesorio, isServicio } from '@/lib/categories';
import ClientAuthModal from '@/components/store/ClientAuthModal';
import FloatingChatWidget from '@/components/store/FloatingChatWidget';
import AnimatedIntroLoader from '@/components/store/AnimatedIntroLoader';
import SeasonalAmbiance from '@/components/store/SeasonalAmbiance';
import { SoundToggleButton } from '@/components/store/StoreSoundEffects';
import StoreAdsCarousel from '@/components/store/StoreAdsCarousel';
import { StoreAdBanner, getStoreAds } from '@/lib/storeAds';
import { getCatalogOrder, applyCatalogOrder } from '@/lib/storeCatalogOrder';
import { supabase } from '@/lib/supabase';
import {
  ShoppingBag,
  Search,
  Check,
  ShieldCheck,
  Smartphone,
  Wrench,
  Sparkles,
  ArrowRight,
  User,
  LogOut,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  PackageCheck,
  Package,
  MessageSquare,
  Image as ImageIcon,
  Layers,
  Tag,
} from 'lucide-react';

export default function TiendaPage() {
  const router = useRouter();
  const { products, loadProducts } = useProducts();
  const { currentTheme, themeId } = useStoreTheme();
  const { profile } = useAuth();
  const [ads, setAds] = useState<StoreAdBanner[]>([]);
  const [catalogOrder, setCatalogOrder] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number; selected_variant?: string }[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mobileCols, setMobileCols] = useState<2 | 3>(2);
  const catalogSectionRef = useRef<HTMLElement>(null);

  const scrollToCatalog = () => {
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.trim().length > 0) {
      scrollToCatalog();
    }
  };

  const loadStoreConfig = async () => {
    try {
      const [loadedAds, loadedOrder] = await Promise.all([
        getStoreAds(),
        getCatalogOrder(),
      ]);
      setAds(loadedAds);
      setCatalogOrder(loadedOrder);
    } catch (err) {
      console.warn('Error al cargar config de tienda:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadStoreConfig();

    // Supabase Realtime para que los cambios en anuncios y orden se vean al instante
    const channel = supabase
      .channel('store_ads_and_order_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_settings' },
        () => {
          loadStoreConfig();
        }
      )
      .subscribe();

    const onAdsUpdated = () => loadStoreConfig();
    const onOrderUpdated = () => loadStoreConfig();
    if (typeof window !== 'undefined') {
      window.addEventListener('ingenium_store_ads_updated', onAdsUpdated);
      window.addEventListener('ingenium_catalog_order_updated', onOrderUpdated);
    }

    if (typeof window !== 'undefined') {
      const savedCust = localStorage.getItem('ingenium_store_customer');
      if (savedCust) {
        try {
          setCustomer(JSON.parse(savedCust));
        } catch {
          // ignore
        }
      }
      const savedCart = localStorage.getItem('ingenium_store_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch {
          // ignore
        }
      }
    }

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('ingenium_store_ads_updated', onAdsUpdated);
        window.removeEventListener('ingenium_catalog_order_updated', onOrderUpdated);
      }
    };
  }, [loadProducts]);

  const syncCart = (
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

  // Filter storefront products and apply custom order
  const rawStoreProducts = products.filter(p => p.visible_en_tienda !== false && p.active !== false);
  const storeProducts = applyCatalogOrder(rawStoreProducts, catalogOrder);

  const filtered = storeProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.commercial_description || '').toLowerCase().includes(search.toLowerCase());

    if (selectedCategory === 'todos') return matchesSearch;
    if (selectedCategory === 'repuestos') return matchesSearch && isRepuesto(p);
    if (selectedCategory === 'accesorios') return matchesSearch && isAccesorio(p);
    if (selectedCategory === 'servicios') return matchesSearch && isServicio(p);
    return matchesSearch;
  });

  const handleActionClick = (product: Product) => {
    const { variants } = extractProductMetadata(product.description, product.image_url);
    const hasVariants = (variants || []).some(v => v.enabled && v.options && v.options.length > 0);
    if (hasVariants) {
      router.push(`/tienda/${product.id}`);
      return;
    }
    if (!customer) {
      setPendingProduct(product);
      setAuthModalOpen(true);
      return;
    }
    addToCart(product);
  };

  const addToCart = (product: Product, selectedVariant?: string) => {
    syncCart(prev => {
      const variantKey = (selectedVariant || '').trim();
      const exists = prev.find(
        i => i.product.id === product.id && (i.selected_variant || '') === variantKey
      );
      if (exists) {
        return prev.map(i =>
          i.product.id === product.id && (i.selected_variant || '') === variantKey
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selected_variant: variantKey || undefined }];
    });
    setCartDrawerOpen(true);
  };

  const handleAuthSuccess = (c: StorefrontCustomer) => {
    setCustomer(c);
    if (pendingProduct) {
      addToCart(pendingProduct);
      setPendingProduct(null);
    }
  };

  const handleLogoutCustomer = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ingenium_store_customer');
    }
    setCustomer(null);
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

    const msg = `*¡NUEVO PEDIDO DESDE CATÁLOGO ONLINE!* 📱🛒\n\n` +
      `*Cliente:* ${customer.name}\n` +
      `*WhatsApp:* ${customer.phone}\n\n` +
      `*Productos:* \n${itemsText}\n\n` +
      `*Total a Pagar:* ${formatCurrency(cartTotal)}\n\n` +
      `_Por favor confirmar disponibilidad y método de entrega/retiro._`;

    const url = `https://wa.me/528139629319?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setOrderSent(true);
    syncCart(() => []);
  };

  return (
    <div
      style={{
        background: currentTheme.pageBgGradient,
        color: currentTheme.isDark ? '#ffffff' : '#1e293b',
      }}
      className="min-h-screen flex flex-col font-sans relative selection:bg-[#2563eb] selection:text-white transition-colors duration-700 overflow-x-hidden"
    >
      {/* Global Themed & Seasonal Background Ambiance for entire catalog */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <SeasonalAmbiance themeId={themeId} fullPage={true} />
      </div>

      {/* Dynamic styles for neon glowing card hover & smooth interactive feel */}
      <style jsx global>{`
        .store-catalog-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .store-catalog-card:hover {
          transform: translateY(-4px);
          border-color: var(--card-hover-border) !important;
          box-shadow: var(--card-hover-glow) !important;
        }
      `}</style>

      {/* Animated Intro Loader on Entry */}
      <AnimatedIntroLoader />

      {/* Top Banner (100% Tienda Orientada al Cliente - Themed) */}
      <div
        style={{ background: currentTheme.navTopGradient }}
        className="relative z-10 text-white text-[11px] py-1 px-4 border-b border-white/10 flex justify-between items-center transition-colors duration-500"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Sparkles size={12} /> Taller & Tienda Oficial
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/80">Envíos a todo el país y retiro en sucursal</span>
        </div>
        <div className="flex items-center gap-2.5 text-white/70 text-[10px]">
          <SoundToggleButton />
          <span className="hidden sm:inline">Moneda Oficial: <strong className="text-amber-400">$ MXN</strong></span>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        style={{
          background: currentTheme.headerBg,
          borderColor: currentTheme.headerBorder,
        }}
        className="sticky top-0 z-40 backdrop-blur-md shadow-xs border-b transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-xs border border-white/20 group-hover:scale-105 transition"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-xs">INGENIUM MOBILE</span>
                <span
                  style={{
                    backgroundColor: currentTheme.badgeBg,
                    borderColor: currentTheme.badgeBorder,
                    color: currentTheme.badgeText,
                  }}
                  className="text-[9px] font-bold px-1.5 py-0.2 rounded border shadow-xs"
                >
                  TIENDA
                </span>
              </div>
              <p className="text-[10px] text-gray-300 font-medium hidden sm:block">Repuestos, accesorios y reparaciones</p>
            </div>
          </Link>

          {/* Search bar desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar pantalla, batería, cargador..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') scrollToCatalog(); }}
                style={{
                  backgroundColor: currentTheme.searchBg,
                  borderColor: currentTheme.searchBorder,
                  color: currentTheme.searchText,
                }}
                className="w-full pl-10 pr-3 py-2 border rounded-full text-xs font-medium outline-none focus:ring-2 focus:ring-[#2563eb] transition placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions: Client Profile & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {customer ? (
              <div
                style={{
                  backgroundColor: currentTheme.categoryInactiveBg,
                  borderColor: currentTheme.categoryInactiveBorder,
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] backdrop-blur-xs"
              >
                <User size={13} style={{ color: currentTheme.accentColor }} />
                <span className="font-bold text-white max-w-[100px] truncate">{customer.name}</span>
                <button
                  onClick={handleLogoutCustomer}
                  title="Cambiar datos / Salir"
                  className="text-gray-400 hover:text-red-400 ml-0.5 cursor-pointer"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{
                  backgroundColor: currentTheme.categoryInactiveBg,
                  borderColor: currentTheme.categoryInactiveBorder,
                  color: currentTheme.searchText,
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full border hover:brightness-125 transition cursor-pointer"
              >
                <User size={13} /> Identificarme
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              style={{
                backgroundColor: currentTheme.accentColor,
                boxShadow: `0 0 14px ${currentTheme.glowShadow}`,
              }}
              className="relative p-2 text-white rounded-full transition cursor-pointer hover:brightness-110"
              title="Ver Carrito"
            >
              <ShoppingBag size={17} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#f59e0b] text-[#1e3a5f] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cart.reduce((c, i) => c + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar mobile */}
        <div className="md:hidden px-3 pb-2 pt-0.5">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar pantalla, batería, cargador..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') scrollToCatalog(); }}
              style={{
                backgroundColor: currentTheme.searchBg,
                borderColor: currentTheme.searchBorder,
                color: currentTheme.searchText,
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#2563eb] placeholder:text-gray-400"
            />
          </div>
        </div>
      </header>

      {/* Hero Banner (Themed dynamically from POS with guaranteed CSS linear-gradient) */}
      <section
        style={{ background: currentTheme.cssGradient }}
        className="relative z-10 text-white py-3.5 sm:py-8 px-3 sm:px-6 lg:px-8 shadow-md overflow-hidden transition-all duration-700"
      >
        {/* Festive Ambiance Overlay */}
        <SeasonalAmbiance themeId={themeId} />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-6">
          <div className="space-y-1 sm:space-y-2.5 max-w-xl text-center md:text-left">
            <div
              style={{
                backgroundColor: currentTheme.badgeBg,
                borderColor: currentTheme.badgeBorder,
                color: currentTheme.badgeText,
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black backdrop-blur-md border shadow-xs transition-all"
            >
              <Sparkles size={11} className="sm:w-[13px] sm:h-[13px] text-amber-300" />
              <span>{currentTheme.badge}</span>
            </div>

            <h1 className="text-lg sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {currentTheme.headline}
            </h1>

            <p className="text-white/90 text-[11px] sm:text-sm leading-snug sm:leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] line-clamp-2 sm:line-clamp-none">
              {currentTheme.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3 w-full md:w-auto">
            <div
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.badgeBorder,
              }}
              className="backdrop-blur-md px-2.5 py-1.5 md:p-3.5 rounded-xl md:rounded-2xl border shadow-lg flex md:block items-center justify-center gap-1.5 text-left md:text-center transform hover:scale-105 transition-all duration-300"
            >
              <Smartphone size={16} className="md:w-[22px] md:h-[22px] md:mx-auto text-amber-300 md:mb-1 drop-shadow shrink-0" />
              <div>
                <p className="font-black text-xs md:text-base text-white leading-tight">100%</p>
                <p className="text-[9px] md:text-[10px] text-white/90 font-medium leading-tight">Garantía Escrita</p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.badgeBorder,
              }}
              className="backdrop-blur-md px-2.5 py-1.5 md:p-3.5 rounded-xl md:rounded-2xl border shadow-lg flex md:block items-center justify-center gap-1.5 text-left md:text-center transform hover:scale-105 transition-all duration-300"
            >
              <Wrench size={16} className="md:w-[22px] md:h-[22px] md:mx-auto text-amber-300 md:mb-1 drop-shadow shrink-0" />
              <div>
                <p className="font-black text-xs md:text-base text-white leading-tight">Taller</p>
                <p className="text-[9px] md:text-[10px] text-white/90 font-medium leading-tight">En el acto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anuncios y Banners Promocionales (Administrables desde POS o Tienda) */}
      <StoreAdsCarousel ads={ads} />

      {/* Categories Bar */}
      <div
        style={{
          background: currentTheme.categoryBarBg,
          borderColor: currentTheme.categoryBarBorder,
        }}
        className="border-b sticky top-[96px] md:top-16 z-30 shadow-xs backdrop-blur-md transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos los productos' },
            { id: 'repuestos', label: 'Repuestos & Pantallas' },
            { id: 'accesorios', label: 'Cargadores & Accesorios' },
            { id: 'servicios', label: 'Servicio de Reparación' },
          ].map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  scrollToCatalog();
                }}
                style={
                  isSelected
                    ? {
                        backgroundColor: currentTheme.accentColor,
                        color: '#ffffff',
                        boxShadow: `0 0 16px ${currentTheme.glowShadow}`,
                        borderColor: 'transparent',
                      }
                    : {
                        backgroundColor: currentTheme.categoryInactiveBg,
                        color: currentTheme.categoryInactiveText,
                        borderColor: currentTheme.categoryInactiveBorder,
                      }
                }
                className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer border"
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <main
        ref={catalogSectionRef}
        id="catalogo-productos"
        className="relative z-10 flex-1 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8 w-full scroll-mt-36"
      >
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6">
          <p
            style={{ color: currentTheme.filterLabelColor }}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
          >
            Mostrando {filtered.length} productos disponibles
          </p>
          <div className="flex items-center gap-2">
            {/* Selector de vista compacto solo para celular */}
            <div
              style={{
                backgroundColor: currentTheme.mobileToggleBg,
                borderColor: currentTheme.categoryInactiveBorder,
              }}
              className="sm:hidden flex items-center border rounded-lg p-0.5 text-[10px] font-bold backdrop-blur-xs"
            >
              <button
                type="button"
                onClick={() => setMobileCols(2)}
                style={
                  mobileCols === 2
                    ? {
                        backgroundColor: currentTheme.mobileToggleActiveBg,
                        color: currentTheme.mobileToggleActiveText,
                        boxShadow: `0 0 10px ${currentTheme.glowShadow}`,
                      }
                    : { color: currentTheme.filterLabelColor }
                }
                className="px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                2 col
              </button>
              <button
                type="button"
                onClick={() => setMobileCols(3)}
                style={
                  mobileCols === 3
                    ? {
                        backgroundColor: currentTheme.mobileToggleActiveBg,
                        color: currentTheme.mobileToggleActiveText,
                        boxShadow: `0 0 10px ${currentTheme.glowShadow}`,
                      }
                    : { color: currentTheme.filterLabelColor }
                }
                className="px-2 py-0.5 rounded-md transition cursor-pointer"
              >
                3 col
              </button>
            </div>
            <span
              style={{ color: currentTheme.filterLabelColor }}
              className="hidden sm:inline text-xs opacity-75 font-medium"
            >
              Precios en Moneda Nacional ($ MXN)
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              backgroundColor: currentTheme.emptyStateBg,
              borderColor: currentTheme.emptyStateBorder,
            }}
            className="text-center py-16 backdrop-blur-md rounded-3xl border border-dashed p-8"
          >
            <PackageCheck size={48} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-bold text-white text-base">No encontramos productos con ese filtro</h3>
            <p className="text-xs text-gray-300 mt-1">Intenta con otra palabra clave o categoría.</p>
          </div>
        ) : (
          <div
            className={`grid ${
              mobileCols === 3 ? 'grid-cols-3 gap-1.5' : 'grid-cols-2 gap-2.5'
            } sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6`}
          >
            {filtered.map(product => {
              const isAvailable = product.stock > 0;
              const isServiceItem = isServicio(product);
              const hasPrice = typeof product.sale_price === 'number' && product.sale_price > 0;
              const isCompact3 = mobileCols === 3;
              const { cleanDescription, gallery, variants } = extractProductMetadata(product.description, product.image_url);
              const hasActiveVariants = (variants || []).some(v => v.enabled && v.options && v.options.length > 0);
              const mainPhoto =
                gallery[0] ||
                (isServiceItem
                  ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80');

              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: currentTheme.catalogCardBg,
                    borderColor: currentTheme.catalogCardBorder,
                    ['--card-hover-border' as any]: currentTheme.catalogCardHoverBorder,
                    ['--card-hover-glow' as any]: currentTheme.catalogCardHoverGlow,
                  }}
                  className="store-catalog-card backdrop-blur-md rounded-xl sm:rounded-2xl border shadow-sm flex flex-col overflow-hidden group relative"
                >
                  {/* Product Image (Clic para abrir detalles estilo Mercado Libre) */}
                  <Link
                    href={`/tienda/${product.id}`}
                    className={`block relative ${
                      isCompact3 ? 'h-20' : 'h-28'
                    } sm:h-48 bg-black/25 overflow-hidden cursor-pointer`}
                  >
                    <img
                      src={mainPhoto}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                    {/* Efecto Shimmer de Luz al pasar el cursor */}
                    <div className="card-shimmer-sweep" />

                    <div
                      className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 ${
                        isCompact3 ? 'hidden sm:flex' : ''
                      }`}
                    >
                      <span className="text-[8px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 sm:px-2 rounded-md bg-black/70 text-white backdrop-blur-sm shadow-xs border border-white/10">
                        {product.code}
                      </span>
                    </div>

                    <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3">
                      {isServiceItem ? (
                        <span className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-blue-600 text-white shadow-sm flex items-center gap-0.5 sm:gap-1">
                          <Wrench size={9} className="sm:w-[10px] sm:h-[10px]" />
                          <span className="sm:hidden">{isCompact3 ? 'Taller' : 'Servicio'}</span>
                          <span className="hidden sm:inline">Servicio Técnico</span>
                        </span>
                      ) : isAvailable ? (
                        <span className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                          </span>
                          <span className="sm:hidden">{isCompact3 ? product.stock : `Stock (${product.stock})`}</span>
                          <span className="hidden sm:inline">En stock ({product.stock})</span>
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 rounded-full bg-red-500 text-white">
                          Agotado
                        </span>
                      )}
                    </div>

                    {gallery.length > 1 && (
                      <span className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 bg-black/75 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 border border-white/10">
                        <ImageIcon size={10} /> {gallery.length}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className={`${isCompact3 ? 'p-1.5' : 'p-2.5'} sm:p-4 flex-1 flex flex-col`}>
                    <Link href={`/tienda/${product.id}`} className="flex-1 flex flex-col group/title">
                      <h3
                        style={{ color: currentTheme.cardTitleColor }}
                        className={`font-bold ${
                          isCompact3 ? 'text-[10px] leading-tight mb-1' : 'text-xs leading-snug mb-0.5'
                        } sm:text-sm group-hover/title:opacity-85 transition line-clamp-2 sm:line-clamp-1 sm:mb-1 drop-shadow-xs`}
                      >
                        {product.name}
                      </h3>
                      <p
                        style={{ color: currentTheme.cardDescColor }}
                        className={`${
                          isCompact3 ? 'hidden sm:block' : 'text-[10px] mb-1.5'
                        } sm:text-xs line-clamp-2 leading-snug sm:leading-relaxed flex-1 sm:mb-2`}
                      >
                        {product.commercial_description || cleanDescription || (isServiceItem ? 'Servicio técnico especializado para taller.' : 'Repuesto garantizado para taller.')}
                      </p>
                      {hasActiveVariants && (
                        <span
                          style={{
                            backgroundColor: currentTheme.categoryInactiveBg,
                            borderColor: currentTheme.categoryInactiveBorder,
                            color: currentTheme.cardTitleColor,
                          }}
                          className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold border px-2 py-0.5 rounded-md w-fit mb-1.5 backdrop-blur-xs"
                        >
                          <Layers size={10} style={{ color: currentTheme.accentColor }} className="shrink-0" />
                          <span>Opciones de conectores / colores</span>
                        </span>
                      )}
                      <span
                        style={{ color: currentTheme.accentColor }}
                        className={`${
                          isCompact3 ? 'hidden sm:inline-block' : 'text-[10px]'
                        } sm:text-[11px] font-bold hover:underline mb-2 sm:mb-2.5`}
                      >
                        {hasActiveVariants ? 'Ver opciones y comprar →' : 'Ver características →'}
                      </span>
                    </Link>

                    {/* Precio y Acción */}
                    {isServiceItem && !hasPrice ? (
                      <div
                        style={{ borderColor: currentTheme.cardFooterBorder }}
                        className="pt-1.5 sm:pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto gap-1.5 sm:gap-2"
                      >
                        <div>
                          <span className="text-[8px] sm:text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                            {isCompact3 ? 'En Taller' : 'Servicio en Taller'}
                          </span>
                          <span
                            style={{ color: currentTheme.cardDescColor }}
                            className={`${isCompact3 ? 'hidden sm:inline' : 'text-[10px]'} sm:text-xs font-semibold`}
                          >
                            Cotización personalizada
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            const msg = `¡Hola INGENIUM MOBILE! 👋 Me interesa cotizar el servicio de reparación: *${product.name}* (Código: ${product.code}). ¿Cuál sería el costo y tiempo de entrega?`;
                            window.open(`https://wa.me/528139629319?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className={`w-full sm:w-auto justify-center ${
                            isCompact3 ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'
                          } sm:px-3 sm:py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95 text-white font-bold rounded-lg sm:rounded-xl sm:text-xs transition shadow-sm flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap`}
                          title="Cotizar directamente por WhatsApp"
                        >
                          <MessageSquare size={11} className="sm:w-[13px] sm:h-[13px] shrink-0" />
                          <span className="sm:hidden">Cotizar</span>
                          <span className="hidden sm:inline">Cotizar Reparación</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{ borderColor: currentTheme.cardFooterBorder }}
                        className="pt-1.5 sm:pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between mt-auto gap-1.5 sm:gap-2"
                      >
                        <div>
                          <span
                            style={{ color: currentTheme.cardPriceSubColor }}
                            className={`${isCompact3 ? 'hidden sm:block' : 'text-[9px]'} sm:text-[10px] block font-medium`}
                          >
                            {isServiceItem ? 'Costo desde' : 'Precio final'}
                          </span>
                          <span
                            style={{ color: currentTheme.cardPriceColor }}
                            className={`font-black ${isCompact3 ? 'text-[11px]' : 'text-sm'} sm:text-lg block leading-tight drop-shadow-xs`}
                          >
                            {formatCurrency(product.sale_price)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleActionClick(product)}
                          disabled={!isAvailable && !isServiceItem}
                          style={{
                            background: currentTheme.buttonGradient,
                            boxShadow: `0 4px 14px ${currentTheme.glowShadow}`,
                          }}
                          className={`w-full sm:w-auto justify-center ${
                            isCompact3 ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[11px]'
                          } sm:px-3.5 sm:py-2 active:scale-95 text-white font-bold rounded-lg sm:rounded-xl sm:text-xs transition shadow-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer`}
                        >
                          <ShoppingBag size={11} className="sm:w-[14px] sm:h-[14px] shrink-0" />
                          {hasActiveVariants ? 'Elegir' : isServiceItem ? 'Solicitar' : 'Comprar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-slide-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#2563eb]" />
                <h3 className="font-bold text-base text-gray-900">Carrito de Compras</h3>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
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
                    Una vez que recibas o retires tu compra, puedes calificar el producto y subir fotos directamente en su página de detalle.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOrderSent(false);
                    setCartDrawerOpen(false);
                  }}
                  className="mt-4 px-6 py-2.5 bg-[#1e3a5f] text-white font-bold rounded-xl text-xs"
                >
                  Seguir explorando
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <ShoppingBag size={40} className="mb-2 opacity-50" />
                <p className="text-sm font-semibold">Tu carrito está vacío</p>
                <p className="text-xs mt-1">Agrega repuestos o accesorios del catálogo.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.product.id}-${item.selected_variant || 'def'}-${idx}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-bold text-xs text-gray-800 truncate">{item.product.name}</p>
                        {item.selected_variant && (
                          <p className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/70 font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 max-w-full truncate">
                            <Tag size={10} className="shrink-0" /> {item.selected_variant}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} x {formatCurrency(item.product.sale_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-sm text-[#1e3a5f]">
                          {formatCurrency(item.product.sale_price * item.quantity)}
                        </span>
                        <button
                          onClick={() => syncCart(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 p-1 text-xs cursor-pointer"
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-base font-black text-gray-900">
                    <span>Total Estimado:</span>
                    <span className="text-[#2563eb]">{formatCurrency(cartTotal)}</span>
                  </div>

                  {/* Checkbox Obligatorio de Aceptación Legal (PROFECO & LFPDPPP) */}
                  <label className="flex items-start gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 text-xs text-gray-700 cursor-pointer select-none transition">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#2563eb] focus:ring-blue-500 border-gray-300 shrink-0 cursor-pointer"
                    />
                    <span className="leading-tight text-[11px] text-gray-600">
                      He leído y acepto los{' '}
                      <Link href="/terminos" target="_blank" className="font-bold text-[#2563eb] underline hover:text-blue-800">
                        Términos y Condiciones
                      </Link>{' '}
                      y el{' '}
                      <Link href="/privacidad" target="_blank" className="font-bold text-[#2563eb] underline hover:text-blue-800">
                        Aviso de Privacidad
                      </Link>.
                    </span>
                  </label>

                  <button
                    onClick={handleCheckoutWhatsApp}
                    disabled={!termsAccepted}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
                    title={!termsAccepted ? 'Acepta los Términos y Condiciones para continuar' : 'Confirmar Pedido'}
                  >
                    Confirmar Pedido por WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget businessName="INGENIUM MOBILE" businessPhone="+52 81 3962 9319" />

      {/* Client Registration / Login Modal */}
      <ClientAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer Institucional & Legal (PROFECO & INAI) */}
      <Footer />
    </div>
  );
}
