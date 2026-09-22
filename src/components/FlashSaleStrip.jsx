import React, { useState, useEffect } from 'react';
import { FLASH_SALE_DATA } from '../data/banners';
import { Zap, Sparkles } from 'lucide-react';

/**
 * FlashSaleStrip Component - Visually refined, lightweight, dark luxury theme
 */
export default function FlashSaleStrip({ onExploreSale }) {
  const [timeLeft, setTimeLeft] = useState(
    (FLASH_SALE_DATA.durationHours || 8) * 3600
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatDigit = (num) => String(num).padStart(2, '0');

  return (
    <section
      aria-label="Flash Sale Countdown Strip"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"
    >
      <div className="w-full bg-[#0E1330] text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Headline & Icon */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 rounded-xl bg-[#FFC933] text-[#0E1330] shrink-0">
            <Zap className="w-5 h-5 fill-[#0E1330]" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-[#FFC933] text-[#0E1330] uppercase tracking-wider">
                {FLASH_SALE_DATA.badge}
              </span>
              <span className="text-xs text-[#FFC933] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Special Offers
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white">
              {FLASH_SALE_DATA.title}
            </h3>
            <p className="text-xs text-slate-300 font-sans hidden sm:block mt-0.5">
              {FLASH_SALE_DATA.subtext}
            </p>
          </div>
        </div>

        {/* Right: Live Countdown Timer & CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 font-sans font-medium">
            <div className="flex flex-col items-center">
              <div className="bg-white/10 text-white border border-white/15 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold min-w-[34px] text-center backdrop-blur-sm">
                {formatDigit(hours)}
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">HRS</span>
            </div>
            <span className="text-[#FFC933] font-bold text-sm mb-3.5">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/10 text-white border border-white/15 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold min-w-[34px] text-center backdrop-blur-sm">
                {formatDigit(minutes)}
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">MIN</span>
            </div>
            <span className="text-[#FFC933] font-bold text-sm mb-3.5">:</span>
            <div className="flex flex-col items-center">
              <div className="bg-white/10 text-[#FFC933] border border-[#FFC933]/40 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-bold min-w-[34px] text-center backdrop-blur-sm">
                {formatDigit(seconds)}
              </div>
              <span className="text-[9px] text-[#FFC933] uppercase tracking-wider mt-0.5">SEC</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onExploreSale}
            className="px-4 py-2 bg-[#FFC933] hover:bg-[#e6b429] text-[#0E1330] font-sans font-bold text-xs rounded-xl tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
          >
            Explore Sale
          </button>
        </div>
      </div>
    </section>
  );
}
