'use client';
import { useState, useEffect } from 'react';
import { StoreAdBanner } from '@/lib/storeAds';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink, MessageSquare, ArrowRight } from 'lucide-react';

interface StoreAdsCarouselProps {
  ads: StoreAdBanner[];
}

export default function StoreAdsCarousel({ ads }: StoreAdsCarouselProps) {
  const activeAds = ads.filter(a => a.active);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide every 5.5 seconds
  useEffect(() => {
    if (activeAds.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeAds.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [activeAds.length, isPaused]);

  if (activeAds.length === 0) return null;

  const current = activeAds[currentIndex] || activeAds[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? activeAds.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeAds.length);
  };

  const handleActionClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else if (link.startsWith('#')) {
      const el = document.querySelector(link);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = link;
    }
  };

  return (
    <div
      className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-1 sm:pb-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-white/20 transition-all duration-700 bg-gradient-to-r ${
          current.gradient_style || 'from-[#0f172a] via-[#1e3a5f] to-[#2563eb]'
        } text-white`}
      >
        {/* Subtle animated background shapes */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 sm:p-6 md:p-8 min-h-[160px] sm:min-h-[200px]">
          {/* Text Content */}
          <div className="flex-1 space-y-2 sm:space-y-3 text-center md:text-left">
            {current.badge_text && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                <Sparkles size={12} className="text-amber-300" />
                {current.badge_text}
              </span>
            )}

            <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-snug drop-shadow-sm">
              {current.title}
            </h3>

            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
              {current.subtitle}
            </p>

            {current.button_text && (
              <div className="pt-1 flex items-center justify-center md:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => handleActionClick(current.button_link)}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-gray-900 hover:bg-gray-100 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer group/btn"
                >
                  <span>{current.button_text}</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Banner Image Preview */}
          {current.image_url && (
            <div className="w-full md:w-72 lg:w-80 h-36 sm:h-44 md:h-48 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/25 shrink-0 transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src={current.image_url}
                alt={current.title}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          )}
        </div>

        {/* Carousel Navigation Arrows */}
        {activeAds.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer z-20 shadow-md"
              title="Anuncio anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer z-20 shadow-md"
              title="Siguiente anuncio"
            >
              <ChevronRight size={16} />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {activeAds.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === i ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Ir al anuncio ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
