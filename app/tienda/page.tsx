'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProducts } from '@/context/ProductContext';
import { useStoreTheme } from '@/context/StoreThemeContext';
import { Product, StorefrontCustomer } from '@/types';
import { formatCurrency } from '@/lib/utils';
import ClientAuthModal from '@/components/store/ClientAuthModal';
import FloatingChatWidget from '@/components/store/FloatingChatWidget';
import AnimatedIntroLoader from '@/components/store/AnimatedIntroLoader';
import SeasonalAmbiance from '@/components/store/SeasonalAmbiance';
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
  PackageCheck
} from 'lucide-react';

export default function TiendaPage() {
  const { products, loadProducts } = useProducts();
  const { currentTheme, themeId } = useStoreTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [customer, setCustomer] = useState<StorefrontCustomer | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
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

  useEffect(() => {
    loadProducts();
    if (typeof window !== 'undefined') {
      const savedCust = localStorage.getItem('ingenium_store_customer');
      if (savedCust) {
        try {
          setCustomer(JSON.parse(savedCust));
        } catch {
          // ignore
        }
      }

      // Check if user authenticated via Google OAuth
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const googleCustomer: StorefrontCustomer = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Cliente',
            phone: session.user.user_metadata?.phone || '',
            email: session.user.email || '',
          };
          setCustomer(googleCustomer);
          localStorage.setItem('ingenium_store_customer', JSON.stringify(googleCustomer));
        }
      });
    }
  }, [loadProducts]);

  // Filter storefront products
  const storeProducts = products.filter(p => p.visible_en_tienda !== false && p.active !== false);

  const filtered = storeProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.commercial_description || '').toLowerCase().includes(search.toLowerCase());

    if (selectedCategory === 'todos') return matchesSearch;
    if (selectedCategory === 'repuestos') return matchesSearch && (p.category_id === 'cat-1' || p.code.includes('DISP') || p.code.includes('BAT') || p.code.includes('FLEX'));
    if (selectedCategory === 'accesorios') return matchesSearch && (p.category_id === 'cat-2' || p.code.includes('CARG') || p.code.includes('CAB') || p.code.includes('MICA'));
    if (selectedCategory === 'servicios') return matchesSearch && (p.category_id === 'cat-3' || p.code.includes('SRV'));
    return matchesSearch;
  });

  const handleActionClick = (product: Product) => {
    if (!customer) {
      setPendingProduct(product);
      setAuthModalOpen(true);
      return;
    }
    addToCart(product);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) {
        return prev.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
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
      .map(i => `• ${i.quantity}x ${i.product.name} (${formatCurrency(i.product.sale_price * i.quantity)})`)
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
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Animated Intro Loader on Entry */}
      <AnimatedIntroLoader />

      {/* Top Banner (100% Tienda Orientada al Cliente - Themed) */}
      <div
        style={{ background: currentTheme.navTopGradient }}
        className="text-white text-[11px] py-1 px-4 border-b border-white/10 flex justify-between items-center transition-colors duration-500"
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <Sparkles size={12} /> Taller & Tienda Oficial
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/80">Envíos a todo el país y retiro en sucursal</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-white/70 text-[10px]">
          <span>Moneda Oficial: <strong className="text-amber-400">$ MXN</strong></span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-xs border border-gray-200 group-hover:scale-105 transition"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-[#1e3a5f] tracking-tight">INGENIUM MOBILE</span>
                <span className="text-[9px] bg-blue-100 text-[#2563eb] font-bold px-1 py-0.2 rounded">TIENDA</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">Repuestos, accesorios y reparaciones</p>
            </div>
          </Link>

          {/* Search bar desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar pantalla, batería, cargador..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') scrollToCatalog(); }}
                className="w-full pl-8.5 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Actions: Client Profile & Cart */}
          <div className="flex items-center gap-2">
            {customer ? (
              <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100 text-[11px]">
                <User size={13} className="text-[#2563eb]" />
                <span className="font-bold text-[#1e3a5f] max-w-[100px] truncate">{customer.name}</span>
                <button
                  onClick={handleLogoutCustomer}
                  title="Cerrar sesión"
                  className="text-gray-400 hover:text-red-500 ml-0.5"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
              >
                <User size={13} /> Iniciar Sesión
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2 bg-[#1e3a5f] hover:bg-[#162a45] text-white rounded-full shadow-sm transition"
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

        {/* Search bar mobile */}
        <div className="md:hidden px-3 pb-2 pt-0.5">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') scrollToCatalog(); }}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>
      </header>

      {/* Hero Banner (Themed dynamically from POS with guaranteed CSS linear-gradient) */}
      <section
        style={{ background: currentTheme.cssGradient }}
        className="relative text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 shadow-md overflow-hidden transition-all duration-700"
      >
        {/* Festive Ambiance Overlay */}
        <SeasonalAmbiance themeId={themeId} />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl text-center md:text-left">
            <div
              style={{
                backgroundColor: currentTheme.badgeBg,
                borderColor: currentTheme.badgeBorder,
                color: currentTheme.badgeText,
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black backdrop-blur-md border shadow-xs transition-all"
            >
              <Sparkles size={13} className="text-amber-300" />
              <span>{currentTheme.badge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {currentTheme.headline}
            </h1>

            <p className="text-white/90 text-xs sm:text-sm leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              {currentTheme.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.badgeBorder,
              }}
              className="backdrop-blur-md p-3.5 rounded-2xl border shadow-lg text-center transform hover:scale-105 transition-all duration-300"
            >
              <Smartphone size={22} className="mx-auto text-amber-300 mb-1 drop-shadow" />
              <p className="font-black text-base text-white">100%</p>
              <p className="text-[10px] text-white/90 font-medium">Garantía Escrita</p>
            </div>
            <div
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.badgeBorder,
              }}
              className="backdrop-blur-md p-3.5 rounded-2xl border shadow-lg text-center transform hover:scale-105 transition-all duration-300"
            >
              <Wrench size={22} className="mx-auto text-amber-300 mb-1 drop-shadow" />
              <p className="font-black text-base text-white">Taller</p>
              <p className="text-[10px] text-white/90 font-medium">En el acto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos los productos' },
            { id: 'repuestos', label: 'Repuestos & Pantallas' },
            { id: 'accesorios', label: 'Cargadores & Accesorios' },
            { id: 'servicios', label: 'Servicio de Reparación' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                scrollToCatalog();
              }}
              style={
                selectedCategory === cat.id
                  ? { backgroundColor: currentTheme.accentColor, color: '#ffffff' }
                  : {}
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <main
        ref={catalogSectionRef}
        id="catalogo-productos"
        className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full scroll-mt-36"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Mostrando {filtered.length} productos disponibles
          </p>
          <span className="text-xs text-gray-400">Precios en Moneda Nacional ($ MXN)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
            <PackageCheck size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-700 text-base">No encontramos productos con ese filtro</h3>
            <p className="text-xs text-gray-400 mt-1">Intenta con otra palabra clave o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(product => {
              const isAvailable = product.stock > 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={
                        product.image_url ||
                        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#1e3a5f]/90 text-white backdrop-blur-sm">
                        {product.code}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      {isAvailable ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          En stock ({product.stock})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#2563eb] transition line-clamp-1 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1 mb-3">
                      {product.commercial_description || product.description || 'Repuesto garantizado para taller.'}
                    </p>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Precio final</span>
                        <span className="font-black text-lg text-[#1e3a5f]">
                          {formatCurrency(product.sale_price)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleActionClick(product)}
                        disabled={!isAvailable}
                        className="px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                      >
                        <ShoppingBag size={14} />
                        Comprar
                      </button>
                    </div>
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
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-bold text-xs text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {item.quantity} x {formatCurrency(item.product.sale_price)}
                        </p>
                      </div>
                      <span className="font-black text-sm text-[#1e3a5f]">
                        {formatCurrency(item.product.sale_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-base font-black text-gray-900">
                    <span>Total Estimado:</span>
                    <span className="text-[#2563eb]">{formatCurrency(cartTotal)}</span>
                  </div>

                  <button
                    onClick={handleCheckoutWhatsApp}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
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

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white py-10 px-4 sm:px-6 lg:px-8 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/70">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div>
              <p className="font-bold text-white text-sm">INGENIUM MOBILE</p>
              <p className="text-[11px] text-white/50">Repuestos garantizados y servicio técnico</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/70">
            <Link href="/" className="hover:text-amber-400 transition font-medium">
              Inicio
            </Link>
            {/* Invisible Access to POS */}
            <Link
              href="/login"
              aria-label="Acceso"
              tabIndex={-1}
              className="opacity-0 w-8 h-4 inline-block select-none cursor-default"
            >
              ·
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
