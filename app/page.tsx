'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Wrench,
  Package,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Printer,
  Smartphone,
  Flame,
  PhoneCall,
  CheckCircle2,
  Lock
} from 'lucide-react';
import SocialNetworksBar from '@/components/SocialNetworksBar';
import FloatingChatWidget from '@/components/store/FloatingChatWidget';
import AnimatedIntroLoader from '@/components/store/AnimatedIntroLoader';
import { useStoreTheme } from '@/context/StoreThemeContext';

export default function WelcomeHomePage() {
  const { currentTheme, themeId } = useStoreTheme();
  const [activeTab, setActiveTab] = useState<'tienda' | 'reparaciones' | 'redes'>('tienda');

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white flex flex-col selection:bg-[#2563eb] selection:text-white font-sans overflow-x-hidden">
      {/* Animated Intro Loader */}
      <AnimatedIntroLoader />
      {/* Decorative Background Lighting & Cyber Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#1e3a5f]/50 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] bg-[#2563eb]/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[#f59e0b]/15 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Top Navbar (100% Customer & Shop Oriented - No POS Access in plain sight) */}
      <header className="relative z-20 border-b border-white/10 bg-[#0d1b2a]/85 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-amber-400 rounded-full blur-xs opacity-80 group-hover:opacity-100 transition duration-300"></div>
              <img
                src="/images/logo.jpg"
                alt="INGENIUM MOBILE"
                className="relative w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white group-hover:text-blue-300 transition">
                  INGENIUM MOBILE SHOP
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                  OFICIAL
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium tracking-wide">
                Reparación · Venta · Accesorios para Celulares
              </p>
            </div>
          </Link>

          {/* Navigation links for Customers */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
            <Link href="/tienda" className="hover:text-white transition flex items-center gap-1.5">
              <Package size={16} className="text-blue-400" />
              Catálogo Tienda
            </Link>
            <Link href="/reparaciones" className="hover:text-white transition flex items-center gap-1.5">
              <Wrench size={16} className="text-amber-400" />
              Taller & Reparaciones
            </Link>
            <a
              href="https://wa.me/528139629319"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition flex items-center gap-1.5"
            >
              <PhoneCall size={16} className="text-emerald-400" />
              WhatsApp Taller
            </a>
          </nav>

          {/* Customer Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-[#2563eb] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <ShoppingCart size={15} />
              <span>Entrar a la Tienda Web</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section (2-Column Responsive) */}
      <main className="relative z-10 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Columna Izquierda: Mensaje de Bienvenida a la Tienda */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur-md shadow-sm">
                <Sparkles size={14} className="text-amber-400" />
                <span>{currentTheme.badge}</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                ¡BIENVENIDO A{' '}
                <span className="bg-gradient-to-r from-white via-blue-200 to-[#f59e0b] bg-clip-text text-transparent">
                  INGENIUM MOBILE SHOP!
                </span>
              </h1>

              {/* Eslogan del Taller */}
              <p className="text-lg sm:text-xl font-bold text-amber-400 tracking-wide">
                Reparación, Venta y Accesorios Garantizados
              </p>

              {/* Texto descriptivo */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Tu centro de confianza para cotizar y comprar refacciones originales, pantallas OLED, baterías y accesorios de máxima calidad. Contamos con atención técnica personalizada y precios directos en moneda nacional (<strong className="text-white font-extrabold">$ MXN</strong>).
              </p>

              {/* Botones de Llamada a la Acción para Clientes */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/tienda"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Package size={17} />
                  <span>Ver Catálogo de Productos y Refacciones</span>
                  <ArrowRight size={16} />
                </Link>

                <a
                  href="https://wa.me/528139629319?text=Hola%20INGENIUM%20MOBILE%2C%20me%20comunico%20desde%20la%20p%C3%A1gina%20web.%20Necesito%20cotizar%2Frevisar%20la%20reparaci%C3%B3n%20de%20un%20equipo.%20Marca%2FModelo%3A%20%5B%20%5D%20Falla%3A%20%5B%20%5D"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <PhoneCall size={17} />
                  <span>Cotizar Reparación por WhatsApp</span>
                </a>
              </div>

              {/* Micro-características para clientes */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-black text-xs block">✓ Garantía Oficial</span>
                  <span className="text-[10px] text-gray-400">Piezas certificadas</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-blue-400 font-black text-xs block">✓ Precios en $ MXN</span>
                  <span className="text-[10px] text-gray-400">Sin costos ocultos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-amber-400 font-black text-xs block">✓ Diagnóstico Express</span>
                  <span className="text-[10px] text-gray-400">Mesa de trabajo</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-purple-400 font-black text-xs block">✓ Soporte en Vivo</span>
                  <span className="text-[10px] text-gray-400">Chat & WhatsApp</span>
                </div>
              </div>

              {/* Social Networks Showcase inside Hero */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                  <Flame size={15} className="text-amber-400" />
                  <span className="text-xs font-bold text-gray-300">
                    Síguenos en nuestras redes oficiales y escanea el código QR:
                  </span>
                </div>
                <SocialNetworksBar variant="hero" />
              </div>
            </div>

            {/* Columna Derecha: Composición Gráfica Tecnológica (Laptop + Phone + Ticket) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-amber-500/20 rounded-3xl blur-2xl pointer-events-none" />

              <div className="relative w-full max-w-lg p-2 sm:p-4">
                {/* Official Logo Floating Pin */}
                <div className="absolute -top-6 -left-4 sm:-top-8 sm:-left-6 z-30 flex items-center gap-2.5 p-2 pr-4 rounded-full bg-[#1e3a5f]/95 border-2 border-amber-400/80 shadow-2xl backdrop-blur-md animate-bounce-slow">
                  <img
                    src="/images/logo.jpg"
                    alt="Logo INGENIUM"
                    className="w-10 h-10 rounded-full object-cover border border-white/40"
                  />
                  <div>
                    <span className="text-[11px] font-black text-white block leading-tight">
                      INGENIUM MOBILE
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block">
                      Certificado Oficial
                    </span>
                  </div>
                </div>

                {/* Modern Laptop Mockup */}
                <div className="relative z-10 bg-gray-900 rounded-2xl border-4 border-gray-700 shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-transform">
                  <div className="bg-[#1e3a5f] px-3 py-2 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      <span className="text-[10px] text-white/60 font-mono ml-2">ingenium-pos.app/tienda</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      ● Tienda Abierta
                    </span>
                  </div>

                  <div className="bg-[#0f172a] p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={15} className="text-[#2563eb]" />
                        <span className="font-bold text-gray-200">Catálogo de Reparación & Venta</span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono font-bold">MONEDA: $ MXN</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center bg-gray-800/60 p-2 rounded-lg border border-gray-700/50">
                        <span className="text-gray-300 font-medium">1x Pantalla OLED iPhone 13 Pro (Original)</span>
                        <span className="font-bold text-white font-mono">$1,850.00 MXN</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-800/60 p-2 rounded-lg border border-gray-700/50">
                        <span className="text-gray-300 font-medium">1x Batería Original Samsung A54</span>
                        <span className="font-bold text-white font-mono">$650.00 MXN</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-800/60 p-2 rounded-lg border border-gray-700/50">
                        <span className="text-gray-300 font-medium">1x Mano de Obra Reparación Express</span>
                        <span className="font-bold text-white font-mono">$350.00 MXN</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between">
                      <span className="font-bold text-gray-300">Total Garantizado:</span>
                      <span className="text-lg font-black text-amber-400 font-mono">$2,850.00 MXN</span>
                    </div>
                  </div>
                </div>

                <div className="h-3 bg-gray-700 rounded-b-xl max-w-[85%] mx-auto shadow-md" />

                {/* Floating Smartphone Mockup (Storefront & Chat Widget) */}
                <div className="absolute -bottom-8 -right-2 sm:-bottom-10 sm:-right-4 z-20 w-44 sm:w-52 bg-gray-950 rounded-3xl border-4 border-gray-800 shadow-2xl p-2.5 backdrop-blur-md transform hover:scale-105 transition">
                  <div className="w-16 h-3 bg-gray-800 rounded-full mx-auto mb-2" />
                  <div className="space-y-2 text-[10px]">
                    <div className="bg-[#1e3a5f] p-2 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px]">Tienda Web</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      </div>
                      <p className="text-[9px] text-blue-200 mt-0.5">Catálogo en Línea</p>
                    </div>

                    <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
                      <p className="font-semibold text-white truncate">Centro de Carga Tipo C</p>
                      <p className="text-amber-400 font-bold font-mono">$180.00 MXN</p>
                    </div>

                    <div className="p-1.5 bg-[#25D366] text-white rounded-lg flex items-center gap-1 font-bold text-[9px] shadow">
                      <MessageSquare size={11} />
                      <span>Chat en Vivo Activo</span>
                    </div>
                  </div>
                </div>

                {/* Thermal Ticket Printer Simulation */}
                <div className="absolute -bottom-10 -left-2 sm:-bottom-12 sm:-left-4 z-20 w-44 sm:w-48 bg-gray-900 border-2 border-gray-700 rounded-2xl p-2.5 shadow-2xl text-[9px] font-mono">
                  <div className="flex items-center gap-1.5 text-gray-300 pb-1.5 border-b border-gray-700">
                    <Printer size={13} className="text-blue-400" />
                    <span className="font-bold">Ticket de Garantía</span>
                  </div>

                  <div className="mt-1 bg-white text-gray-900 p-2 rounded-lg shadow-inner text-[9px] leading-tight space-y-1">
                    <p className="font-black text-center text-[10px]">INGENIUM MOBILE</p>
                    <p className="text-center text-[8px] text-gray-600">RFC: IME240101XYZ · MTY NL</p>
                    <div className="border-t border-dashed border-gray-300 pt-1">
                      <div className="flex justify-between">
                        <span>PANTALLA OLED</span>
                        <span className="font-bold">$1,850.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SERVICIO TÉC</span>
                        <span className="font-bold">$350.00</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-gray-300 pt-1 flex justify-between font-black text-[10px]">
                      <span>TOTAL:</span>
                      <span className="text-blue-800">$2,200.00 MXN</span>
                    </div>
                    <p className="text-center text-[8px] text-gray-500 pt-0.5">¡Gracias por su preferencia!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="border-t border-white/10 bg-[#0c1826]/70 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Servicio Profesional en Telefonía Móvil
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Todo lo que buscas para tu celular: refacciones, reparaciones inmediatas y asesoría técnica garantizada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Package size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Refacciones & Accesorios</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Pantallas OLED, centros de carga, baterías originales, cargadores y micas de hidrogel para todas las marcas (iPhone, Samsung, Xiaomi, Motorola).
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Wrench size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Taller Especializado</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Diagnóstico en mesa de trabajo, reparación de fallas de carga, microsoldadura y entrega de orden con folio ORD y garantía por escrito.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <PhoneCall size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Atención Directa por WhatsApp</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cotiza tu refacción o consulta el avance de reparación de tu equipo con nuestros técnicos al +52 81 3962 9319.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#09131d] py-10 px-4 sm:px-6 lg:px-8 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-10 h-10 rounded-full object-cover border border-white/30"
            />
            <div>
              <p className="font-bold text-white text-sm">INGENIUM MOBILE SHOP</p>
              <p className="text-[11px] text-gray-500">Reparación · Venta · Accesorios para Celulares</p>
            </div>
          </div>

          {/* Links: Public Shop Link + Camouflaged Taller link for POS Access */}
          <div className="flex items-center gap-3 text-gray-400">
            <Link href="/tienda" className="hover:text-white transition text-xs font-semibold">
              Catálogo Tienda
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

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/5 text-center text-[11px] text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 INGENIUM MOBILE SHOP. Todos los derechos reservados. Monterrey, NL. Precios en $ MXN.</span>
          <span className="text-[10px] text-gray-700">Versión 1.0.4 Oficial</span>
        </div>
      </footer>

      {/* Floating Cute Robot WhatsApp Assistant */}
      <FloatingChatWidget businessName="INGENIUM MOBILE" businessPhone="+52 81 3962 9319" />
    </div>
  );
}
