'use client';
import Link from 'next/link';
import { Scale, ArrowLeft, ShieldAlert, CheckCircle2, DollarSign, Wrench, AlertTriangle, FileText, Globe } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#0b131e] text-gray-200 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#08121c]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="w-9 h-9 rounded-xl object-cover border border-white/20 shadow"
            />
            <div>
              <span className="font-black text-white text-sm sm:text-base tracking-tight block">INGENIUM MOBILE</span>
              <span className="text-[10px] text-amber-400 font-bold block">Términos y Condiciones de Uso</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#1c180e] to-[#0b131e] border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Scale size={16} className="text-amber-400" />
            <span>Marco Regulatorio Digital · Ley Federal de Protección al Consumidor</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Términos y Condiciones de Uso
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Condiciones generales que regulan el acceso, cotización, compras en línea y recepción de dispositivos móviles para reparación técnica en <strong>INGENIUM MOBILE</strong>.
          </p>

          <p className="text-xs text-gray-500">
            Vigencia: <strong>2026</strong> · Establecimiento en Sombrerete, Zacatecas, México.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-10 text-xs sm:text-sm leading-relaxed text-gray-300">
        
        {/* Cláusula OBLIGATORIA de Deslinde de Marcas */}
        <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-black text-base">
            <ShieldAlert size={20} className="text-amber-400 shrink-0" />
            <h2>CLÁUSULA DE DESLINDE DE MARCAS (MARCAS REGISTRADAS)</h2>
          </div>
          <blockquote className="p-4 rounded-2xl bg-[#08121c]/90 border border-amber-500/20 text-white font-medium text-xs sm:text-sm leading-relaxed italic">
            &ldquo;Apple, Samsung, Huawei, Xiaomi, Motorola y demás marcas o logotipos exhibidos en este sitio son propiedad exclusiva de sus respectivos titulares. INGENIUM MOBILE es un centro independiente de soporte técnico, venta de accesorios y servicios de mantenimiento, sin afiliación directa, patrocinio ni representación oficial de dichas marcas.&rdquo;
          </blockquote>
          <p className="text-[11px] text-gray-400">
            El uso de logotipos o nombres de fabricantes en nuestro catálogo o descripciones técnicas se realiza únicamente con carácter orientativo y descriptivo para informar sobre la compatibilidad de las refacciones, fundas y accesorios disponibles para el consumidor.
          </p>
        </div>

        {/* Ámbito de Aplicación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <Globe size={18} className="text-blue-400" />
            <h2>1. Ámbito de Aplicación y Aceptación</h2>
          </div>
          <p>
            Al navegar en nuestro sitio web, cotizar mediante nuestro asistente digital o WhatsApp, crear una cuenta de cliente o contratar servicios de reparación en taller, usted declara ser mayor de edad con plena capacidad legal y acepta someterse a estos Términos y Condiciones, así como a nuestro{' '}
            <Link href="/privacidad" className="text-blue-400 underline font-semibold hover:text-blue-300">
              Aviso de Privacidad
            </Link>{' '}
            y{' '}
            <Link href="/garantias" className="text-emerald-400 underline font-semibold hover:text-emerald-300">
              Políticas de Garantía y Devoluciones
            </Link>
            .
          </p>
        </div>

        {/* Moneda y Precios */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <DollarSign size={18} className="text-amber-400" />
            <h2>2. Precios Oficiales y Moneda de Transacción</h2>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <p>
              En estricto apego al Artículo 7 Bis de la Ley Federal de Protección al Consumidor (PROFECO):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300 pl-1">
              <li>
                Todos los precios de productos, refacciones y mano de obra exhibidos en la plataforma se encuentran expresados en <strong>Pesos Mexicanos ($ MXN)</strong>.
              </li>
              <li>
                Los precios publicados incluyen los impuestos correspondientes en moneda nacional. No existen comisiones ocultas no informadas previamente al cliente antes de confirmar su orden.
              </li>
              <li>
                INGENIUM MOBILE se reserva el derecho de actualizar los precios de catálogo conforme a la fluctuación de costos de refacciones importadas en el mercado nacional de telecomunicaciones.
              </li>
            </ul>
          </div>
        </div>

        {/* Cotizaciones y Catálogo en Línea */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <FileText size={18} className="text-emerald-400" />
            <h2>3. Cotizaciones en Línea y Disponibilidad de Refacciones</h2>
          </div>
          <p>
            Las cotizaciones emitidas a través del chat web, WhatsApp o vía telefónica son de carácter preliminar y se elaboran con base en la descripción de la falla proporcionada por el usuario.
          </p>
          <p>
            El presupuesto final y definitivo se formaliza una vez que el equipo es recibido físicamente en nuestra mesa de diagnóstico en Sombrerete, Zacatecas. En caso de detectarse fallas adicionales no visibles (como sulfatación interna, pistas rotas o componentes desoldados), se solicitará la autorización previa y por escrito del cliente antes de proceder a la reparación.
          </p>
        </div>

        {/* Recepción de Equipos en Taller y Cláusula de Abandono */}
        <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <Wrench size={18} className="text-blue-400" />
            <h2>4. Recepción de Equipos en Taller, Respaldo y Abandono</h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-gray-300">
            <div>
              <strong className="text-white block mb-1">A. Folio de Servicio Oficial:</strong>
              <p className="text-gray-400">
                A todo dispositivo ingresado a taller se le asignará una orden de servicio con número de folio (<code className="text-blue-300 font-mono">ORD-XXXX</code>) que certifica las condiciones de recepción, accesorios entregados y estado estético reportado.
              </p>
            </div>
            <div>
              <strong className="text-white block mb-1">B. Respaldo de Información y Datos Personales:</strong>
              <p className="text-gray-400">
                Es responsabilidad exclusiva del cliente respaldar fotos, archivos, contactos y chats antes de ingresar el equipo a servicio. INGENIUM MOBILE no se hace responsable por pérdidas de datos lógicos derivadas de fallas de memoria física o memorias dañadas previas al servicio técnico.
              </p>
            </div>
            <div>
              <strong className="text-white block mb-1">C. Cláusula de Abandono de Equipos (60 Días):</strong>
              <p className="text-gray-400">
                Conforme al Código Civil y normativas mercantiles, todo equipo debidamente reparado o diagnosticado que cuente con notificación de entrega y que <strong>no sea retirado por el cliente transcurridos 60 (sesenta) días naturales</strong> causará abandono legal. A partir de dicho término, el establecimiento podrá disponer del equipo para cubrir costos de almacenamiento, custodia y refacciones instaladas.
              </p>
            </div>
          </div>
        </div>

        {/* Políticas de Cancelación y Devoluciones */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h2>5. Garantías y Devoluciones</h2>
          </div>
          <p>
            Las condiciones detalladas de garantía técnica (30 días en taller, 15 días en electrónica y 7 días en accesorios) se rigen íntegramente por nuestras{' '}
            <Link href="/garantias" className="text-emerald-400 underline font-semibold hover:text-emerald-300">
              Políticas de Garantía y Devoluciones
            </Link>
            . No proceden devoluciones en efectivo una vez que el producto o servicio ha sido recibido y aceptado a entera satisfacción del consumidor.
          </p>
        </div>

        {/* Jurisdicción y Competencia */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <Scale size={18} className="text-amber-400" />
            <h2>6. Jurisdicción y Legislación Aplicable</h2>
          </div>
          <p>
            Para la interpretación, resolución de controversias y cumplimiento de los presentes Términos y Condiciones, las partes se someten en el ámbito administrativo a la competencia de la <strong>Procuraduría Federal del Consumidor (PROFECO)</strong>, y en la vía judicial a las leyes federales de los Estados Unidos Mexicanos y a la jurisdicción de los tribunales competentes de la ciudad de Sombrerete o la capital del estado de <strong>Zacatecas, México</strong>, renunciando a cualquier otro fuero que por razón de domicilio presente o futuro pudiera corresponderles.
          </p>
        </div>

        {/* Tarjeta de Contacto */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">¿Dudas sobre nuestras condiciones de servicio?</p>
            <p className="text-xs text-gray-400">Atención personalizada directa en Sombrerete, Zacatecas</p>
          </div>
          <a
            href="mailto:robertanr564@gmail.com"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow shrink-0"
          >
            <span>Escribir a robertanr564@gmail.com</span>
          </a>
        </div>
      </main>

      {/* Footer Institucional */}
      <Footer />
    </div>
  );
}
