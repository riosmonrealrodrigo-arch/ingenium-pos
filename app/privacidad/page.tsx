'use client';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Mail, Phone, MapPin, CheckCircle2, Lock, UserCheck, Scale, FileText } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#0b131e] text-gray-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
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
              <span className="text-[10px] text-blue-400 font-bold block">Centro Legal & Transparencia</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0f1d2e] to-[#0b131e] border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Ley Federal de Protección de Datos Personales (LFPDPPP - INAI)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Aviso de Privacidad Integral
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            En <strong>INGENIUM MOBILE</strong> protegemos su información y garantizamos el tratamiento legítimo, controlado e informado de sus datos personales.
          </p>

          <p className="text-xs text-gray-500">
            Última actualización y revisión legal: <strong>Octubre de 2026</strong> · Sombrerete, Zacatecas, México.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-10 text-xs sm:text-sm leading-relaxed text-gray-300">
        
        {/* Identidad del Responsable Card */}
        <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <Lock size={18} className="text-blue-400" />
            <h2>1. Identidad y Domicilio del Responsable</h2>
          </div>
          <p>
            <strong>INGENIUM MOBILE</strong> (en lo sucesivo, el &ldquo;Responsable&rdquo;), con establecimiento comercial y domicilio físico de operaciones ubicado en la ciudad y municipio de <strong>Sombrerete, Zacatecas, México, C.P. 99100</strong>, portal web oficial{' '}
            <Link href="/" className="text-blue-400 underline font-semibold hover:text-blue-300">
              https://ingeniummobileshop.vercel.app
            </Link>
            , es el único responsable del uso, tratamiento, custodia y protección de los datos personales que usted nos proporcione.
          </p>
        </div>

        {/* Datos Personales Recabados */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <UserCheck size={18} className="text-emerald-400" />
            <h2>2. Datos Personales que Recabamos</h2>
          </div>
          <p>
            Para la adecuada prestación de nuestros servicios de comercio electrónico, cotizaciones en línea y servicios técnicos en taller, recabamos las siguientes categorías de datos personales:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <span className="font-bold text-white block text-xs uppercase tracking-wide text-blue-300">
                A. Datos de Identificación y Contacto
              </span>
              <p className="text-gray-400 text-xs">
                Nombre completo, número de teléfono celular o WhatsApp y dirección de correo electrónico.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
              <span className="font-bold text-white block text-xs uppercase tracking-wide text-emerald-300">
                B. Datos de Entrega y Logística
              </span>
              <p className="text-gray-400 text-xs">
                Domicilio de entrega, referencias de ubicación o código postal (cuando se soliciten envíos o entrega a domicilio de refacciones y accesorios).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 md:col-span-2">
              <span className="font-bold text-white block text-xs uppercase tracking-wide text-amber-300">
                C. Datos del Dispositivo para Servicio Técnico (Taller)
              </span>
              <p className="text-gray-400 text-xs">
                Marca, modelo, número de serie o código IMEI, color del equipo, descripción de la falla o daño reportado, y código o patrón de desbloqueo temporal en caso de ser estrictamente necesario y autorizado por el cliente para pruebas de pantalla, cámaras, micrófonos, carga y control de calidad post-reparación.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 italic">
            * Importante: INGENIUM MOBILE <strong>NO</strong> solicita ni almacena datos personales sensibles (origen étnico, estado de salud, ideología) ni datos bancarios confidenciales (números de tarjeta bancaria ni CVV) en servidores propios. Los pagos se liquidan en efectivo en tienda o mediante pasarelas y transferencias directas seguras.
          </p>
        </div>

        {/* Finalidades del Tratamiento */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <CheckCircle2 size={18} className="text-blue-400" />
            <h2>3. Finalidades del Tratamiento de los Datos</h2>
          </div>
          <p>
            Los datos personales recabados serán utilizados para las siguientes <strong>finalidades primarias e indispensables</strong>:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
            <li>
              <strong>Gestión de compras y pedidos:</strong> Procesar, apartar, empacar y coordinar la entrega o retiro en sucursal de productos, refacciones y accesorios del catálogo en línea.
            </li>
            <li>
              <strong>Operación de taller y servicio técnico:</strong> Generar la orden de servicio con folio único (<code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded font-mono">ORD-XXXX</code>), elaborar el diagnóstico técnico, presupuestar mano de obra y refacciones, y aplicar pruebas de funcionalidad.
            </li>
            <li>
              <strong>Emisión de comprobantes y pólizas de garantía:</strong> Generar tickets impresos y digitales de venta, notas de entrega y pólizas oficiales con registro de días de garantía por escrito.
            </li>
            <li>
              <strong>Comunicación operativa directa:</strong> Notificar al cliente vía WhatsApp, mensaje o llamada el estado de avance de su dispositivo (recibido, en diagnóstico, listo para entrega o presupuesto pendiente).
            </li>
            <li>
              <strong>Atención de aclaraciones y garantías:</strong> Dar seguimiento a dudas técnicas, solicitudes de cambio físico o validación de coberturas de garantía conforme a la PROFECO.
            </li>
          </ul>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs space-y-1">
            <p className="font-bold text-blue-300">Finalidades Secundarias (Opcionales):</p>
            <p className="text-gray-400">
              Envío de avisos de promociones de temporada, ofertas de accesorios y encuestas breves de satisfacción post-servicio. En caso de que usted no desee que sus datos sean utilizados para estas finalidades secundarias, puede comunicárnoslo en cualquier momento sin que esto afecte los servicios contratados.
            </p>
          </div>
        </div>

        {/* Transferencia de Datos */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <Scale size={18} className="text-purple-400" />
            <h2>4. Transferencia y No Comercialización de Datos</h2>
          </div>
          <p>
            INGENIUM MOBILE se compromete formalmente a <strong>NO vender, rentar, ceder ni compartir sus datos personales con terceros para fines publicitarios ajenos</strong>.
          </p>
          <p>
            Únicamente se realizarán transferencias de datos en los casos estrictamente previstos en el Artículo 37 de la LFPDPPP, tales como: requerimiento judicial o ministerial fundado de autoridades competentes, o con empresas de paquetería y logística cuando el cliente solicite explícitamente el envío a domicilio de un producto o refacción.
          </p>
        </div>

        {/* Derechos ARCO */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/30 to-indigo-950/40 border border-blue-500/30 space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <ShieldCheck size={20} className="text-amber-400" />
            <h2>5. Ejercicio de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
          </div>
          <p className="text-gray-300">
            En estricto apego a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), usted o su representante legal debidamente acreditado tienen en todo momento el derecho de:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <strong className="text-amber-300 block">Acceso:</strong>
              <span className="text-gray-400">Conocer qué datos personales tenemos de usted y el fin al que están destinados.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <strong className="text-blue-300 block">Rectificación:</strong>
              <span className="text-gray-400">Solicitar la corrección de su información si está desactualizada, inexacta o incompleta.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <strong className="text-red-300 block">Cancelación:</strong>
              <span className="text-gray-400">Pedir que su registro sea eliminado de nuestras bases cuando considere que no está siendo utilizado conforme a la ley.</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <strong className="text-emerald-300 block">Oposición:</strong>
              <span className="text-gray-400">Oponerse al uso de sus datos personales para finalidades específicas (p. ej. mensajes promocionales).</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-xs space-y-2">
            <p className="font-bold text-white">Mecanismo oficial para solicitar sus Derechos ARCO:</p>
            <p className="text-gray-300">
              Para ejercer cualquiera de sus derechos ARCO o revocar su consentimiento, debe enviar un correo electrónico con su solicitud a nuestro Oficial de Privacidad:
            </p>
            <div className="p-3 bg-[#08121c] rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-blue-400" />
                <span className="font-mono text-white font-bold">robertanr564@gmail.com</span>
              </div>
              <span className="text-[11px] text-gray-400">Asunto: &ldquo;Solicitud de Derechos ARCO - INGENIUM MOBILE&rdquo;</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Su solicitud deberá incluir: Nombre completo del titular, copia simple de identificación oficial, descripción clara de los datos a tratar y el derecho que desea ejercer. Recibirá respuesta formal en un plazo máximo de <strong>15 a 20 días hábiles</strong> conforme a los plazos previstos por el INAI.
            </p>
          </div>
        </div>

        {/* Uso de Tecnologías Web y Cookies */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <FileText size={18} className="text-blue-400" />
            <h2>6. Uso de Cookies y Almacenamiento Local</h2>
          </div>
          <p>
            Le informamos que en nuestro portal web utilizamos tecnologías de almacenamiento local en su navegador (<code className="text-blue-300 bg-white/5 px-1 rounded font-mono">localStorage</code> y cookies técnicas esenciales) con el único objetivo de permitir el funcionamiento del carrito de compras, recordar el tema visual seleccionado y mantener su sesión segura. Estas tecnologías no recopilan datos sensibles ni rastrean su navegación en sitios web de terceros.
          </p>
        </div>

        {/* Modificaciones al Aviso */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <Scale size={18} className="text-amber-400" />
            <h2>7. Cambios al Aviso de Privacidad</h2>
          </div>
          <p>
            El presente Aviso de Privacidad puede sufrir modificaciones o actualizaciones derivadas de reformas legales a la LFPDPPP, políticas internas o nuevos servicios ofrecidos por INGENIUM MOBILE. Cualquier cambio será publicado permanentemente en esta dirección web:{' '}
            <Link href="/privacidad" className="text-blue-400 underline font-semibold">
              https://ingeniummobileshop.vercel.app/privacidad
            </Link>
            .
          </p>
        </div>

        {/* Tarjeta de Contacto Directo */}
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Establecimiento en Sombrerete, Zacatecas</p>
              <p className="text-xs text-gray-400">Atención técnica y despacho comercial en México</p>
            </div>
          </div>
          <a
            href="https://wa.me/528139629319?text=Hola%2C%20tengo%20una%20consulta%20sobre%20el%20Aviso%20de%20Privacidad."
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Phone size={14} /> Contactar por WhatsApp
          </a>
        </div>
      </main>

      {/* Footer Institucional */}
      <Footer />
    </div>
  );
}
