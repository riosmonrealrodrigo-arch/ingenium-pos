'use client';
import { useState } from 'react';
import { ExternalLink, QrCode, X, Sparkles, Heart } from 'lucide-react';

interface SocialNetworksBarProps {
  variant?: 'floating' | 'inline' | 'hero' | 'footer';
  className?: string;
}

const SOCIAL_LINKS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@ingeniummobile',
    subtitle: 'Tips de reparación y unboxings',
    url: 'https://www.tiktok.com/@ingeniummobile?_r=1&_t=ZS-9AkI9Ob9jCn',
    color: 'from-[#000000] via-[#010101] to-[#121212]',
    borderColor: 'border-cyan-400/40 hover:border-pink-500/80',
    glowColor: 'hover:shadow-[0_0_20px_rgba(37,244,238,0.35)]',
    badgeText: 'Videos & Trucos',
    badgeBg: 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white',
    qrImage: '/images/tiktok-qr.jpg',
    iconSvg: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@ingeniummobile',
    subtitle: 'Reels, repuestos y promociones',
    url: 'https://www.instagram.com/ingeniummobile?mdxt=MWhwc3FndnkyanM0cA==',
    color: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
    borderColor: 'border-pink-400/40 hover:border-amber-400/80',
    glowColor: 'hover:shadow-[0_0_20px_rgba(253,29,29,0.35)]',
    badgeText: 'Historias & Ofertas',
    badgeBg: 'bg-gradient-to-r from-purple-500 to-amber-500 text-white',
    qrImage: '/images/instagram-qr.jpg',
    iconSvg: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'Ingeniummobile',
    subtitle: 'Comunidad, opiniones y servicios',
    url: 'https://www.facebook.com/Ingeniummobile',
    color: 'from-[#1877f2] to-[#0c5dc7]',
    borderColor: 'border-blue-400/40 hover:border-blue-300',
    glowColor: 'hover:shadow-[0_0_20px_rgba(24,119,242,0.35)]',
    badgeText: 'Página Oficial',
    badgeBg: 'bg-blue-600 text-white',
    qrImage: null,
    iconSvg: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    handle: '+52 81 3962 9319',
    subtitle: 'Atención técnica y cotizaciones',
    url: 'https://wa.me/528139629319?text=Hola%20INGENIUM%20MOBILE%2C%20me%20comunico%20desde%20la%20p%C3%A1gina%20web.',
    color: 'from-[#25D366] to-[#128C7E]',
    borderColor: 'border-emerald-400/40 hover:border-emerald-300',
    glowColor: 'hover:shadow-[0_0_20px_rgba(37,211,102,0.35)]',
    badgeText: 'Chat Directo',
    badgeBg: 'bg-emerald-600 text-white',
    qrImage: null,
    iconSvg: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    ),
  },
];

export default function SocialNetworksBar({ variant = 'inline', className = '' }: SocialNetworksBarProps) {
  const [activeQr, setActiveQr] = useState<{ title: string; image: string; url: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Variant: Floating pill on bottom-left of screen
  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed bottom-6 left-6 z-40 ${className}`}>
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1e3a5f]/95 hover:bg-[#162a45] text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 group cursor-pointer"
              title="Redes Sociales Oficiales"
            >
              <div className="flex -space-x-1.5 overflow-hidden">
                <span className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-cyan-400 border border-white/20">
                  {SOCIAL_LINKS[0].iconSvg}
                </span>
                <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white border border-white/20">
                  {SOCIAL_LINKS[1].iconSvg}
                </span>
                <span className="w-6 h-6 rounded-full bg-[#1877f2] flex items-center justify-center text-white border border-white/20">
                  {SOCIAL_LINKS[2].iconSvg}
                </span>
                <span className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white border border-white/20">
                  {SOCIAL_LINKS[3].iconSvg}
                </span>
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Redes Oficiales</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </button>
          ) : (
            <div className="bg-[#1e3a5f]/95 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-md w-72 animate-slide-up">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-xs font-bold text-white">Comunidad INGENIUM</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2">
                {SOCIAL_LINKS.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                        {item.iconSvg}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-white/60 truncate">{item.handle}</p>
                      </div>
                    </a>

                    <div className="flex items-center gap-1">
                      {item.qrImage && (
                        <button
                          onClick={() => setActiveQr({ title: item.name, image: item.qrImage!, url: item.url })}
                          title="Ver código QR"
                          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          <QrCode size={14} />
                        </button>
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir enlace"
                        className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal QR Code */}
        {activeQr && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e3a5f] border border-white/20 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl relative animate-scale-up">
              <button
                onClick={() => setActiveQr(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Escanea y Síguenos</span>
                <h3 className="text-lg font-black mt-0.5">{activeQr.title} Oficial</h3>
                <p className="text-xs text-white/70 mt-1">
                  Abre la cámara de tu smartphone para escanear el código QR directo.
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto max-w-[260px] flex items-center justify-center">
                <img
                  src={activeQr.image}
                  alt={`QR ${activeQr.title}`}
                  className="w-full h-auto rounded-xl object-contain max-h-[320px]"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <a
                  href={activeQr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#2563eb] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-xl text-xs text-center shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} /> Abrir Perfil Directo
                </a>
                <button
                  onClick={() => setActiveQr(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant: Hero Section or Featured Banner
  if (variant === 'hero') {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {SOCIAL_LINKS.map(item => (
            <div key={item.id} className="relative group w-full">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border ${item.borderColor} ${item.glowColor} text-white transition-all backdrop-blur-md cursor-pointer shadow-sm group-hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md shrink-0 text-white`}>
                    {item.iconSvg}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black tracking-tight">{item.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeBg}`}>
                        {item.badgeText}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/70 block truncate mt-0.5">{item.handle}</span>
                  </div>
                </div>
                <ExternalLink size={13} className="text-white/40 group-hover:text-white transition shrink-0 ml-1" />
              </a>

              {item.qrImage && (
                <button
                  onClick={e => {
                    e.preventDefault();
                    setActiveQr({ title: item.name, image: item.qrImage!, url: item.url });
                  }}
                  title="Ver QR"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center shadow-md hover:scale-110 transition cursor-pointer border-2 border-gray-900 z-10"
                >
                  <QrCode size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Modal QR Code */}
        {activeQr && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e3a5f] border border-white/20 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl relative animate-scale-up">
              <button
                onClick={() => setActiveQr(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Escanea y Síguenos</span>
                <h3 className="text-lg font-black mt-0.5">{activeQr.title} Oficial</h3>
                <p className="text-xs text-white/70 mt-1">
                  Abre la cámara de tu smartphone para escanear el código QR directo.
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto max-w-[260px] flex items-center justify-center">
                <img
                  src={activeQr.image}
                  alt={`QR ${activeQr.title}`}
                  className="w-full h-auto rounded-xl object-contain max-h-[320px]"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <a
                  href={activeQr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#2563eb] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold rounded-xl text-xs text-center shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} /> Abrir Perfil Directo
                </a>
                <button
                  onClick={() => setActiveQr(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: Default Inline / Footer
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {SOCIAL_LINKS.map(item => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10 hover:border-white/30 cursor-pointer shadow-sm"
          title={`Visitar ${item.name}`}
        >
          <span className={`w-5 h-5 rounded bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
            {item.iconSvg}
          </span>
          <span>{item.name}</span>
          <ExternalLink size={11} className="opacity-60" />
        </a>
      ))}
    </div>
  );
}
