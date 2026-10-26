'use client';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Wrench, Package, RotateCcw, AlertTriangle, CheckCircle2, Clock, Scale, HelpCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function GarantiasPage() {
  return (
    <div className="min-h-screen bg-[#0b131e] text-gray-200 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
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
              <span className="text-[10px] text-emerald-400 font-bold block">Póliza Oficial de Garantías & Devoluciones</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ArrowLeft size={14} />
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0e241c] to-[#0b131e] border-b border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Scale size={16} className="text-emerald-400" />
            <span>Ley Federal de Protección al Consumidor (PROFECO) · Normas Oficiales Mexicanas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Políticas de Garantía & Devoluciones
          </h1>

          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            En <strong>INGENIUM MOBILE</strong> respaldamos cada reparación y cada refacción con garantía oficial por escrito y plazos claros de cobertura en Sombrerete, Zacatecas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-emerald-400 font-bold">
              ✓ 30 Días en Taller & Mano de Obra
            </span>
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-blue-400 font-bold">
              ✓ 15 Días en Artículos de Electrónica
            </span>
            <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-amber-400 font-bold">
              ✓ 7 Días en Accesorios Generales
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-10 text-xs sm:text-sm leading-relaxed text-gray-300">
        
        {/* Tabla resumen de coberturas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <Clock size={18} className="text-emerald-400" />
            <h2>1. Plazos Oficiales de Cobertura de Garantía</h2>
          </div>
          <p>
            De conformidad con los Artículos 77 a 84 de la Ley Federal de Protección al Consumidor (LFPC), todo producto vendido o servicio prestado por <strong>INGENIUM MOBILE</strong> cuenta con términos de garantía claros y específicos según la categoría:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Tarjeta 1: Taller */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/40 to-white/[0.02] border border-emerald-500/30 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Wrench size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Servicio Técnico</span>
                <h3 className="font-black text-white text-lg">30 Días Naturales</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Aplica en <strong>mano de obra y refacciones aplicadas</strong> (displays, pantallas OLED, flexores de carga, baterías internas, micrófonos y botones instalados).
              </p>
              <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300 font-medium">
                Vigencia calculada automáticamente desde la fecha de entrega del equipo.
              </div>
            </div>

            {/* Tarjeta 2: Artículos de Electrónica */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-950/40 to-white/[0.02] border border-blue-500/30 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Package size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Artículos de Electrónica</span>
                <h3 className="font-black text-white text-lg">15 Días Naturales</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Aplica contra <strong>defectos de fabricación</strong> en cargadores de pared, cubos de carga rápida, cargadores inalámbricos, audífonos, bocinas y periféricos electrónicos.
              </p>
              <div className="pt-2 border-t border-blue-500/20 text-[11px] text-blue-300 font-medium">
                Requiere conservar empaque original y ticket de compra.
              </div>
            </div>

            {/* Tarjeta 3: Accesorios Generales */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-amber-950/40 to-white/[0.02] border border-amber-500/30 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Accesorios Generales</span>
                <h3 className="font-black text-white text-lg">7 Días Naturales</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Aplica contra <strong>defectos de fábrica</strong> en micas de cristal templado, láminas de hidrogel, fundas protectoras, cables y accesorios no electrónicos.
              </p>
              <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-300 font-medium">
                Válido previo a la instalación o con defecto demostrable de fábrica.
              </div>
            </div>
          </div>
        </div>

        {/* Exclusiones de Garantía en Reparaciones */}
        <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base">
            <AlertTriangle size={20} className="text-red-400" />
            <h2>2. Exclusiones Expresas de Garantía (Cuándo NO Aplica)</h2>
          </div>
          <p className="text-gray-300">
            Con fundamento en la LFPC, la garantía <strong>quedará sin efecto</strong> y no procederá en los siguientes supuestos:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 pl-1 text-xs">
            <li>
              <strong>Daños por líquidos o humedad:</strong> Dispositivos que presenten sensores de humedad activados, sulfatación en pines, corrosión interna o evidencia de haber estado en contacto con agua, alcohol u otras sustancias antes o después de la reparación.
            </li>
            <li>
              <strong>Daños físicos posteriores:</strong> Caídas, impactos, abolladuras en chasis, fisuras externas o internas en cristales, pantallas OLED o displays con líneas de fractura posteriores a la entrega.
            </li>
            <li>
              <strong>Violación de sellos de seguridad:</strong> Si las etiquetas, sellos térmicos o sellos de garantía internos colocados por el técnico de INGENIUM MOBILE fueron rotos, manipulados, raspados o retirados.
            </li>
            <li>
              <strong>Manipulación por terceros:</strong> Equipos que después del servicio en nuestro taller hayan sido abiertos, revisados o intervenidos por otro taller, técnico particular o por el propio usuario.
            </li>
            <li>
              <strong>Alteraciones de software o sobrevoltaje:</strong> Equipos dañados por descargas eléctricas externas durante la carga, uso de cargadores de mala calidad sin certificación, rooteo de sistema operativo o briqueo por actualizaciones no oficiales.
            </li>
          </ul>
        </div>

        {/* Política de Devoluciones y Cambios Físicos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <RotateCcw size={18} className="text-blue-400" />
            <h2>3. Política de Devolución, Reemplazo Físico y Saldo a Favor</h2>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <p>
              Conforme a los estándares comerciales autorizados por la legislación mexicana en materia de telecomunicaciones y servicio técnico:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Cambio físico directo:</strong> Si un producto o refacción instalada presenta falla técnica comprobable dentro del periodo de garantía estipulado, se procederá al reemplazo físico inmediato por una pieza idéntica o de especificación equivalente.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Saldo a favor en tienda:</strong> En caso de no existir disponibilidad inmediata de la pieza de recambio, el cliente podrá optar por saldo a favor íntegro aplicable a cualquier otro producto, accesorio o servicio de nuestro catálogo.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>No devoluciones en efectivo:</strong> Una vez aceptado y entregado el producto conforme o concluida la reparación autorizada a entera satisfacción del consumidor en mesa de taller, <strong>no aplican devoluciones en efectivo ni reembolsos monetarios</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Procedimiento para hacer efectiva una garantía */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-black text-base border-b border-white/10 pb-2">
            <HelpCircle size={18} className="text-emerald-400" />
            <h2>4. Procedimiento para Solicitar el Trámite de Garantía</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                1
              </span>
              <p className="font-bold text-white">Presentación del Equipo o Producto</p>
              <p className="text-gray-400">
                Acudir a nuestro establecimiento en Sombrerete, Zacatecas, con el equipo y su ticket de venta o folio de orden de servicio (<code className="text-emerald-300 font-mono">ORD-XXXX</code>).
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                2
              </span>
              <p className="font-bold text-white">Diagnóstico Técnico en Mesa</p>
              <p className="text-gray-400">
                El técnico evaluará el dispositivo en un plazo máximo de <strong>24 a 48 horas hábiles</strong> para verificar que la falla corresponda al componente garantizado y descartar exclusiones.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                3
              </span>
              <p className="font-bold text-white">Solución y Entrega</p>
              <p className="text-gray-400">
                Aprobada la garantía, se realiza el cambio de pieza sin costo alguno de mano de obra y se renueva el folio de entrega para respaldo del consumidor.
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta de soporte de garantías */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-blue-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-black text-white text-base">¿Tienes dudas sobre la garantía de tu equipo?</h4>
            <p className="text-xs text-gray-300 mt-1">
              Consulta en vivo con nuestro equipo técnico ingresando tu folio o enviando un mensaje directo a WhatsApp.
            </p>
          </div>
          <a
            href="https://wa.me/528139629319?text=Hola%20INGENIUM%20MOBILE%2C%20tengo%20una%20duda%20sobre%20la%20garant%C3%ADa%20de%20mi%20orden%2Fproducto."
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs transition shadow-lg shrink-0 flex items-center gap-2"
          >
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </main>

      {/* Footer Institucional */}
      <Footer />
    </div>
  );
}
