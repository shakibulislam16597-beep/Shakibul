import React, { useState } from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { formatBDT } from '../utils/currency';

/**
 * FloatingCart Component - Extrovat Lifestyle
 * Docked to the right edge of the viewport, vertically centered around 55% down.
 * ~65% hidden off the right edge, ~35% visible showing cart icon and count badge.
 * Tapping or dragging reveals total and opens cart drawer.
 */
export default function FloatingCart({ itemCount = 0, totalAmount = 0, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed right-0 top-[55%] -translate-y-1/2 z-30 pointer-events-auto select-none pr-[env(safe-area-inset-right)]">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Shopping cart floating tab with ${itemCount} items, total ${formatBDT(totalAmount)}`}
        className={`group relative flex items-center bg-[#0E1330] text-[#FFFFFF] border-2 border-r-0 border-[#0E1330] rounded-l-2xl shadow-xl transition-all duration-300 ease-out cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FFC933] ${
          isHovered ? 'translate-x-0' : 'translate-x-[62%]'
        }`}
        style={{
          minHeight: '52px'
        }}
      >
        {/* Visible Tab Container */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Cart Icon & Badge Area (Always Visible in peek) */}
          <div className="relative flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#FFC933]" />
            <span className="absolute -top-2 -right-2 bg-[#FFC933] text-[#0E1330] border border-[#0E1330] text-[10px] font-heading font-extrabold rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center leading-none shadow-xs">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          </div>

          {/* Reveal Indicator / Price Info (Revealed on hover/focus/slide) */}
          <div className="flex items-center gap-1.5 pl-1 whitespace-nowrap overflow-hidden">
            <ChevronLeft className={`w-4 h-4 text-[#FFC933] transition-transform duration-200 ${isHovered ? 'rotate-180' : ''}`} />
            <span className="text-xs font-sans font-extrabold text-[#FFFFFF]">
              {formatBDT(totalAmount)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
