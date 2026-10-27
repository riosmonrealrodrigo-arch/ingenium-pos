'use client';
import Link from 'next/link';
import { ShieldCheck, Scale, FileText, Phone, Mail, MapPin, DollarSign, ExternalLink } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`relative z-10 border-t border-white/10 bg-[#08121c] text-gray-300 py-12 px-4 sm:px-6 lg:px-8 text-xs font-sans mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Main Grid: 4 Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Identity & Establishment */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.jpg"
                alt="INGENIUM MOBILE"
                className="w-11 h-11 rounded-2xl object-cover border border-white/20 shadow-md"
              />
              <div>
                <p className="font-black text-white text-base tracking-tight">INGENIUM MOBILE</p>
                <p className="text-[11px] text-blue-400 font-bold">Taller Especializado & Tienda de Refacciones</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-400 leading-relaxed">
              Servicio técnico profesional de telefonía móvil, venta de pantallas, baterías, repuestos y accesorios garantizados en Sombrerete, Zacatecas.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Establecimiento Oficial Verificado</span>
            </div>
          </div>

          {/* Col 2: Legal & Consumer Compliance (PROFECO & INAI) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Scale size={16} className="text-amber-400" />
              <span>Marco Legal & Consumidor</span>
            </div>
            <ul className="space-y-2 text-[12px]">
              <li>
                <Link
                  href="/privacidad"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group"
                >
                  <ShieldCheck size={14} className="text-blue-400 group-hover:scale-110 transition" />
                  <span className="group-hover:underline">Aviso de Privacidad (LFPDPPP)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/garantias"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group"
                >
                  <FileText size={14} className="text-emerald-400 group-hover:scale-110 transition" />
                  <span className="group-hover:underline">Políticas de Garantía & Devoluciones (PROFECO)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group"
                >
                  <Scale size={14} className="text-amber-400 group-hover:scale-110 transition" />
                  <span className="group-hover:underline">Términos y Condiciones de Uso</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tienda"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition group"
                >
                  <span className="text-xs">🛒</span>
                  <span className="group-hover:underline">Catálogo de Productos en Línea</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Location */}
          <div className="space-y-3">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              <MapPin size={16} className="text-red-400" />
              <span>Ubicación & Contacto</span>
            </p>
            <div className="space-y-2 text-[12px] text-gray-400">
              <p className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-500 shrink-0 mt-0.5" />
                <span>Sombrerete, Zacatecas, México. C.P. 99100.</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/528139629319"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-300 hover:text-emerald-400 transition"
                >
                  WhatsApp: +52 81 3962 9319
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-blue-400 shrink-0" />
                <a
                  href="mailto:ingeniummobile0@gmail.com"
                  className="text-gray-300 hover:text-blue-400 transition truncate"
                >
                  ingeniummobile0@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Col 4: Commercial Terms & Currency */}
          <div className="space-y-3">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              <DollarSign size={16} className="text-amber-400" />
              <span>Transacciones & Precios</span>
            </p>
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 text-[11px] text-gray-400 leading-relaxed">
              <p className="font-bold text-white flex items-center gap-1.5">
                <span className="text-amber-400 font-black">$ MXN</span> Moneda Oficial Nacional
              </p>
              <p>
                Todos los precios de refacciones, artículos y mano de obra exhibidos se expresan en <strong>Pesos Mexicanos ($ MXN)</strong> con IVA incluido, en cumplimiento con el Art. 7 Bis de la Ley Federal de Protección al Consumidor.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer on trademarks */}
        <div className="pt-6 border-t border-white/5 text-[11px] text-gray-500 leading-relaxed">
          <p>
            <strong>Deslinde de Marcas Registradas:</strong> Apple, iPhone, Samsung, Galaxy, Xiaomi, Redmi, Huawei, Motorola y demás marcas o nombres comerciales citados en este sitio web son propiedad exclusiva de sus respectivos titulares. INGENIUM MOBILE es un centro independiente de servicio técnico, venta de refacciones y accesorios sin afiliación comercial directa, patrocinio ni representación oficial de los fabricantes citados.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Hidden POS Access */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>© 2026 INGENIUM MOBILE. Sombrerete, Zacatecas, México. Todos los derechos reservados.</span>
            <span className="text-gray-600">|</span>
            <span className="text-emerald-400/80 font-medium">Cumplimiento PROFECO & INAI / LFPDPPP</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-white transition">
              Inicio
            </Link>
            <span>·</span>
            <Link href="/tienda" className="hover:text-white transition">
              Tienda
            </Link>
            <span>·</span>
            <Link href="/garantias" className="hover:text-white transition">
              Garantías
            </Link>
            {/* Acceso discreto/oculto al sistema POS solo para el administrador */}
            <Link
              href="/login"
              aria-label="Acceso"
              tabIndex={-1}
              className="opacity-0 w-6 h-4 inline-block select-none cursor-default"
            >
              ·
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
