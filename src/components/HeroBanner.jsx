import React, { useState, useEffect, useRef } from 'react';
import { HERO_SLIDES } from '../data/banners';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroBanner Component - Extrovat Lifestyle
 * Premium, clean, minimal hero section.
 * Single clean product image, dark rich gradient overlay, serif heading, concise subtext, single clear CTA.
 */
export default function HeroBanner({ onShopNowClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const totalSlides = HERO_SLIDES.length;
  const slideTimerRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
      return;
    }

    slideTimerRef.current = setInterval(() => {
      handleNextSlide();
    }, 5000);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [currentSlide, isPaused, prefersReducedMotion]);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) {
      setIsPaused(false);
      return;
    }
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNextSlide();
    } else if (distance < -40) {
      handlePrevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setIsPaused(false);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section
      aria-label="Hero marketing banner"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-[#0E1330] shadow-lg border border-slate-800 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[400px] flex items-center">
          {/* Main Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.alt}
              loading="eager"
              className="w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out opacity-60"
            />
            {/* Rich gradient overlay for high text legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0E1330] via-[#0E1330]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E1330] via-transparent to-transparent opacity-90" />
          </div>

          {/* Promotional Badge in Corner */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold tracking-wide bg-[#C5A059]/20 text-[#FFC933] border border-[#C5A059]/40 backdrop-blur-md">
              {slide.badge}
            </span>
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12 md:px-12 flex flex-col items-start justify-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight mb-2.5">
              {slide.headline}
            </h1>

            <p className="text-xs sm:text-base font-sans text-slate-300 max-w-lg mb-6 leading-relaxed">
              {slide.subtext}
            </p>

            <button
              type="button"
              onClick={onShopNowClick}
              aria-label={`${slide.buttonText} for ${slide.headline}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFC933] hover:bg-[#e6b429] text-[#0E1330] font-sans font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC933] focus:ring-offset-2 focus:ring-offset-[#0E1330]"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4 text-[#0E1330]" />
            </button>
          </div>

          {/* Minimal Arrow Navigation */}
          <div className="hidden sm:flex absolute right-4 bottom-4 z-20 items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Previous slide"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Next slide"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Slide Indicator Line / Dots */}
        <div className="absolute bottom-3 left-5 sm:left-8 z-20 flex items-center gap-1.5">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? 'w-6 bg-[#FFC933]' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
