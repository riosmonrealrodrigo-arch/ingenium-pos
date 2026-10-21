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
  ExternalLink,
  CheckCircle2,
  Printer,
  Smartphone,
  Laptop,
  Flame,
  ChevronRight,
  QrCode,
  PhoneCall
} from 'lucide-react';
import SocialNetworksBar from '@/components/SocialNetworksBar';

export default function WelcomeHomePage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'reparaciones' | 'tienda'>('pos');

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white flex flex-col selection:bg-[#2563eb] selection:text-white font-sans overflow-x-hidden">
      {/* Decorative Background Lighting & Cyber Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#1e3a5f]/50 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] bg-[#2563eb]/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-[#f59e0b]/15 rounded-full blur-[160px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-white/10 bg-[#0d1b2a]/80 backdrop-blur-xl sticky top-0">
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
                  INGENIUM POS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 shadow-sm">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 font-medium tracking-wide">
                Vende inteligente, cobra rápido
              </p>
            </div>
          </Link>

          {/* Navigation links desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
            <Link href="/tienda" className="hover:text-white transition flex items-center gap-1.5">
              <Package size={16} className="text-blue-400" />
              Catálogo Tienda
            </Link>
            <Link href="/reparaciones" className="hover:text-white transition flex items-center gap-1.5">
              <Wrench size={16} className="text-amber-400" />
              Taller & Folios
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

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/tienda"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition shadow-sm"
            >
              <Smartphone size={14} /> Ver Tienda Web
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#2563eb] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Acceder al POS</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section (2-Column Responsive) */}
      <main className="relative z-10 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Columna Izquierda: Mensaje de Bienvenida y CTAs */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold backdrop-blur-md shadow-sm">
                <Sparkles size={14} className="text-amber-400 animate-spin-slow" />
                <span>Ecosistema Integrado POS · Web · Taller de Reparaciones</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                ¡BIENVENIDO A{' '}
                <span className="bg-gradient-to-r from-white via-blue-200 to-[#f59e0b] bg-clip-text text-transparent">
                  INGENIUM POS!
                </span>
              </h1>

              {/* Eslogan */}
              <p className="text-lg sm:text-xl font-bold text-amber-400 tracking-wide">
                &ldquo;Vende inteligente, cobra rápido&rdquo;
              </p>

              {/* Texto de apoyo descriptivo */}
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                La plataforma definitiva para puntos de venta, control de inventario en la nube y gestión integral de servicios técnicos de reparación de celulares. Diseñada para hacer crecer tu negocio de tecnología con precios en <strong className="text-white font-extrabold">$ MXN</strong>.
              </p>

              {/* Botones de Llamada a la Acción (CTA) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/tienda"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Package size={17} />
                  <span>Ver Catálogo Público en Línea</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border-2 border-amber-400/80 hover:border-amber-300 transition-all backdrop-blur-md shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <ShieldCheck size={17} className="text-amber-400" />
                  <span>Iniciar Sesión / Acceder al POS</span>
                </Link>
              </div>

              {/* Micro-características en la parte inferior */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-emerald-400 font-black text-xs block">✓ Punto de Venta</span>
                  <span className="text-[10px] text-gray-400">Cobro rápido (F1)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-blue-400 font-black text-xs block">✓ Inventario Cloud</span>
                  <span className="text-[10px] text-gray-400">Sync en tiempo real</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-amber-400 font-black text-xs block">✓ Servicio Técnico</span>
                  <span className="text-[10px] text-gray-400">Folios & diagnóstico</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-purple-400 font-black text-xs block">✓ Chat en Vivo</span>
                  <span className="text-[10px] text-gray-400">Web & WhatsApp</span>
                </div>
              </div>

              {/* Social Networks Showcase inside Hero */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                  <Flame size={15} className="text-amber-400" />
                  <span className="text-xs font-bold text-gray-300">
                    Conoce nuestras redes oficiales y escanea los códigos QR:
                  </span>
                </div>
                <SocialNetworksBar variant="hero" />
              </div>
            </div>

            {/* Columna Derecha: Composición Gráfica Interactiva (Laptop + Phone + Ticket Printer) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-amber-500/20 rounded-3xl blur-2xl pointer-events-none" />

              <div className="relative w-full max-w-lg p-2 sm:p-4">
                {/* 1. Official Logo Floating Pin */}
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

                {/* 2. Modern Laptop Mockup */}
                <div className="relative z-10 bg-gray-900 rounded-2xl border-4 border-gray-700 shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-transform">
                  {/* Laptop Screen Header */}
                  <div className="bg-[#1e3a5f] px-3 py-2 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      <span className="text-[10px] text-white/60 font-mono ml-2">ingenium-pos.app/pos</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      ● Caja Abierta
                    </span>
                  </div>

                  {/* Laptop POS UI Screen Content */}
                  <div className="bg-[#0f172a] p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart size={15} className="text-[#2563eb]" />
                        <span className="font-bold text-gray-200">Nueva Venta de Mostrador</span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono font-bold">FOLIO: VTA-2026-089</span>
                    </div>

                    {/* Product items table simulation */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center bg-gray-800/60 p-2 rounded-lg border border-gray-700/50">
                        <span className="text-gray-300 font-medium">1x Pantalla OLED iPhone 13 Pro</span>
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

                    {/* Total Bar */}
                    <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between">
                      <span className="font-bold text-gray-300">TOTAL A COBRAR:</span>
                      <span className="text-lg font-black text-amber-400 font-mono">$2,850.00 MXN</span>
                    </div>
                  </div>
                </div>

                {/* Laptop Base */}
                <div className="h-3 bg-gray-700 rounded-b-xl max-w-[85%] mx-auto shadow-md" />

                {/* 3. Floating Smartphone Mockup (Overlapping Bottom Right) */}
                <div className="absolute -bottom-8 -right-2 sm:-bottom-10 sm:-right-4 z-20 w-44 sm:w-52 bg-gray-950 rounded-3xl border-4 border-gray-800 shadow-2xl p-2.5 backdrop-blur-md transform hover:scale-105 transition">
                  {/* Phone notch */}
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

                    {/* Floating WhatsApp pill */}
                    <div className="p-1.5 bg-[#25D366] text-white rounded-lg flex items-center gap-1 font-bold text-[9px] shadow">
                      <MessageSquare size={11} />
                      <span>Chat en Vivo Activo</span>
                    </div>
                  </div>
                </div>

                {/* 4. Thermal Ticket Printer Simulation (Overlapping Bottom Left) */}
                <div className="absolute -bottom-10 -left-2 sm:-bottom-12 sm:-left-4 z-20 w-44 sm:w-48 bg-gray-900 border-2 border-gray-700 rounded-2xl p-2.5 shadow-2xl text-[9px] font-mono">
                  <div className="flex items-center gap-1.5 text-gray-300 pb-1.5 border-b border-gray-700">
                    <Printer size={13} className="text-blue-400" />
                    <span className="font-bold">Ticket 58/80mm</span>
                  </div>

                  {/* Printed Receipt Paper coming out */}
                  <div className="mt-1 bg-white text-gray-900 p-2 rounded-lg shadow-inner text-[9px] leading-tight space-y-1">
                    <p className="font-black text-center text-[10px]">INGENIUM MÓVIL</p>
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
                Todo lo que tu negocio necesita en un solo lugar
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Diseñado exclusivamente para tiendas de celulares, repuestos y talleres de reparación profesional en México.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <ShoppingCart size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Punto de Venta Ultrarrápido</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cobro en segundos, soporte para lector de código de barras, atajos de teclado y emisión de tickets térmicos con desglose en moneda nacional ($ MXN).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Wrench size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Taller & Folios de Reparación</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Registro de folios ORD, marcas, modelos, diagnóstico, saldo pendiente, patrón de desbloqueo táctil y consulta del cliente en línea.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Package size={24} />
                </div>
                <h4 className="font-bold text-base text-white mb-2">Sincronización en la Nube</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Los productos y precios que modifiques en el POS físico se actualizan al instante en la tienda web pública gracias a Supabase Realtime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Social Networks Dock (Bottom-Left) */}
      <SocialNetworksBar variant="floating" />

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
              <p className="font-bold text-white text-sm">INGENIUM POS · INGENIUM MÓVIL</p>
              <p className="text-[11px] text-gray-500">Reparación · Venta · Accesorios · Software de Punto de Venta</p>
            </div>
          </div>

          {/* Social icons inline */}
          <SocialNetworksBar variant="inline" />

          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/tienda" className="hover:text-white transition">
              Tienda Virtual
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-amber-400 transition font-bold">
              Acceder al POS
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/5 text-center text-[11px] text-gray-600">
          © 2026 INGENIUM POS. Todos los derechos reservados. Monterrey, Nuevo León, México. Moneda oficial: $ MXN.
        </div>
      </footer>
    </div>
  );
}
