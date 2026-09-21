import React, { useEffect, useState } from 'react';

/**
 * SplashScreen Component - Extrovat Lifestyle
 *
 * Requirements:
 * - Logo centered (~180px wide) on app background (#F7F8FC).
 * - Gentle fade and scale-in, held about 1.8 seconds, then go to Home.
 * - Respect prefers-reduced-motion (show without animation).
 * - If image fails to load or anything throws, skip splash so app never stays blank.
 * - Logo URL: import.meta.env.BASE_URL + "extrovat-logo.png"
 * - Attributes: width={180}, height={180}, alt="Extrovat Lifestyle logo".
 */
export default function SplashScreen({ onFinish }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const logoSrc = import.meta.env.BASE_URL + 'extrovat-logo.png';

  useEffect(() => {
    let timer;
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery && mediaQuery.matches) {
        setIsReducedMotion(true);
      }
    } catch (e) {
      console.warn('Error reading prefers-reduced-motion:', e);
    }

    try {
      timer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 1800);
    } catch (e) {
      console.warn('SplashScreen timer error:', e);
      if (onFinish) onFinish();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [onFinish]);

  const handleImageError = () => {
    console.warn('Splash logo failed to load, skipping splash');
    if (onFinish) onFinish();
  };

  return (
    <div
      role="region"
      aria-label="App opening splash screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F8FC] p-6 selection:bg-[#2436F5] selection:text-white"
    >
      <div className="flex flex-col items-center justify-center text-center select-none">
        <img
          src={logoSrc}
          alt="Extrovat Lifestyle logo"
          width={180}
          height={180}
          onError={handleImageError}
          className={`w-[180px] h-[180px] object-contain ${
            isReducedMotion
              ? 'opacity-100 transform-none'
              : 'animate-[fadeScaleIn_0.7s_cubic-bezier(0.16,1,0.3,1)_both]'
          }`}
        />
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
