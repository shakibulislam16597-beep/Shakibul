import React, { useState, useEffect, useRef } from 'react';
import { BANNER_SLIDES } from '../data/banners';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * BannerStrip Component - Extrovat Lifestyle
 *
 * Requirements:
 * - Aspect ratio ~2.4:1, rounded-20 (rounded-[20px]), 2px ink border (#0E1330), hard offset shadow (shadow-[4px_4px_0px_#0E1330]).
 * - Left column (~55% width): tag pill, headline (Bricolage Grotesque, weight 800, max 2 lines), one-line subtitle, pill CTA button.
 * - Middle: round discount badge (badgeTop small, badgeBottom large) overlapping boundary.
 * - Right: product image with object-fit contain aligned bottom right. Text never overlaps image or badge.
 * - Image fallback: decorative gradient shape if missing or error.
 * - Behavior: auto-advance every 5000ms, pause on touch down, hover/focus, or tab hidden.
 * - Swipe left/right support.
 * - Clickable indicator segments below (active segment wider).
 * - Timer cleanup on unmount.
 * - Respects prefers-reduced-motion (no auto slide animation).
 * - Accessibility: role="region", aria-roledescription="carousel", slides labeled "n of 5".
 */
export default function BannerStrip({ onBannerAction }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const touchStartXRef = useRef(null);
  const totalSlides = BANNER_SLIDES.length;

  // Check prefers-reduced-motion
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) {
        setIsReducedMotion(true);
      }
    } catch (e) {
      console.warn('prefers-reduced-motion check error:', e);
    }
  }, []);

  // Handle visibility change (tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-advance timer every 5000ms
  useEffect(() => {
    if (isPaused || isReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, isReducedMotion, totalSlides]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Swipe handling
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  const handleImageError = (slideId) => {
    setImgErrors((prev) => ({ ...prev, [slideId]: true }));
  };

  const handleCtaClick = (slide) => {
    if (onBannerAction && slide.action) {
      onBannerAction(slide.action);
    }
  };

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banner carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full space-y-3 select-none"
    >
      {/* Outer Banner Frame */}
      <div className="relative w-full aspect-[2.4/1] min-h-[160px] sm:min-h-[190px] rounded-[20px] border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] overflow-hidden bg-[#FFFFFF]">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const slideImgUrl = slide.image ? import.meta.env.BASE_URL + slide.image : null;
          const hasError = imgErrors[slide.id];

          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${totalSlides}: ${slide.title}`}
              aria-hidden={!isActive}
              style={{
                backgroundColor: slide.bgFrom,
                backgroundImage: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`
              }}
              className={`absolute inset-0 w-full h-full flex items-center justify-between transition-all duration-500 ease-out ${
                isActive
                  ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
                  : 'opacity-0 translate-x-4 pointer-events-none z-0'
              }`}
            >
              {/* Left Column (Text & CTA) - ~55% width */}
              <div className="w-[58%] sm:w-[55%] h-full p-3 sm:p-5 flex flex-col justify-between z-20 overflow-hidden">
                <div className="space-y-1 sm:space-y-1.5">
                  {/* Small Tag Pill */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0E1330] text-[#FFC933] text-[9px] sm:text-[10px] font-heading font-extrabold uppercase tracking-wider w-max shadow-[1px_1px_0px_#0E1330]">
                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{slide.tag}</span>
                  </div>

                  {/* Headline (Bricolage Grotesque, 800, max 2 lines) */}
                  <h2 className="font-heading font-extrabold text-xs sm:text-lg lg:text-xl text-[#0E1330] leading-tight line-clamp-2 tracking-tight">
                    {slide.title}
                  </h2>

                  {/* Subtitle (1 line) */}
                  <p className="text-[9px] sm:text-xs font-sans text-[#0E1330]/80 truncate font-medium">
                    {slide.subtitle}
                  </p>
                </div>

                {/* Pill CTA Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCtaClick(slide)}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#2436F5] hover:bg-[#1B29C4] text-[#FFFFFF] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] rounded-full font-heading font-extrabold text-[10px] sm:text-xs uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle Round Discount Badge */}
              <div className="absolute left-[54%] sm:left-[52%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FFC933] border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex flex-col items-center justify-center text-center p-1 transform rotate-[-8deg]">
                  <span className="text-[8px] sm:text-[10px] font-heading font-extrabold uppercase leading-none text-[#0E1330]">
                    {slide.badgeTop}
                  </span>
                  <span className="text-[10px] sm:text-xs font-heading font-black text-[#0E1330] leading-tight">
                    {slide.badgeBottom}
                  </span>
                </div>
              </div>

              {/* Right Product Image Container */}
              <div className="w-[42%] sm:w-[45%] h-full relative flex items-end justify-end p-2 sm:p-3 z-10 overflow-hidden">
                {slideImgUrl && !hasError ? (
                  <img
                    src={slideImgUrl}
                    alt={slide.title}
                    width={240}
                    height={200}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onError={() => handleImageError(slide.id)}
                    className="max-h-full max-w-full object-contain object-bottom drop-shadow-[2px_4px_6px_rgba(14,19,48,0.15)]"
                  />
                ) : (
                  /* Fallback Decorative Gradient Shape */
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#2436F5]/20 to-[#FFC933]/50 border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] flex items-center justify-center transform rotate-12">
                    <Sparkles className="w-8 h-8 text-[#0E1330]/60" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Segment Indicator Buttons Under Strip */}
      <div className="flex items-center justify-center gap-1.5 pt-1" aria-label="Slide navigation">
        {BANNER_SLIDES.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={isActive ? 'true' : 'false'}
              className={`h-2 rounded-full border-2 border-[#0E1330] transition-all cursor-pointer ${
                isActive
                  ? 'w-7 sm:w-8 bg-[#2436F5] shadow-[1px_1px_0px_#0E1330]'
                  : 'w-2 sm:w-2.5 bg-[#FFFFFF] hover:bg-[#FFC933]'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
