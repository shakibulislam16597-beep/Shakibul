import React, { useState, useRef, useEffect } from 'react';
import { CATEGORY_TILES } from '../data/categories';
import {
  Sparkles,
  Percent,
  Droplet,
  Wind,
  Flame,
  Gift,
  ShoppingBag,
  Layers,
  Tag,
  Zap,
  Award
} from 'lucide-react';

const ICON_MAP = {
  Sparkles,
  Percent,
  Droplet,
  Wind,
  Flame,
  Gift,
  ShoppingBag,
  Layers,
  Tag,
  Zap,
  Award
};

/**
 * CategoryGrid Component - Extrovat Lifestyle
 * Premium, clean category icons.
 */
export default function CategoryGrid({ activeCategory, onSelectCategory }) {
  const scrollContainerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    if (maxScrollLeft > 0) {
      setHasOverflow(true);
      const progress = (el.scrollLeft / maxScrollLeft) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    } else {
      setHasOverflow(false);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  return (
    <div className="w-full space-y-2 select-none max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Scrollable Grid Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto scrollbar-none snap-x snap-mandatory py-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(72px,1fr)] gap-x-3 gap-y-3 w-max">
          {CATEGORY_TILES.map((tile) => {
            const isActive = activeCategory === tile.slug || activeCategory === tile.categoryKey;
            const IconComponent = ICON_MAP[tile.iconName] || Sparkles;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(tile);
                  }
                }}
                aria-label={`Filter by ${tile.label}`}
                aria-pressed={isActive}
                className="snap-start flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC933] rounded-xl p-0.5"
              >
                {/* ~60px Icon Box */}
                <div
                  style={{ backgroundColor: isActive ? '#0E1330' : tile.bgColor || '#F8FAFC' }}
                  className={`w-[58px] h-[58px] rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'border-[#0E1330] text-[#FFC933] shadow-md scale-105'
                      : 'border-slate-200/90 text-[#0E1330] hover:border-slate-400 hover:shadow-sm'
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 stroke-[2] ${
                      isActive ? 'text-[#FFC933]' : 'text-[#0E1330]'
                    }`}
                  />
                </div>

                {/* Label below */}
                <span
                  className={`text-[11px] sm:text-xs text-center leading-tight mt-1.5 max-w-[76px] line-clamp-2 transition-colors ${
                    isActive
                      ? 'font-sans font-bold text-[#0E1330]'
                      : 'font-sans font-medium text-slate-600 group-hover:text-[#0E1330]'
                  }`}
                >
                  {tile.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thin Scroll Indicator Bar */}
      {hasOverflow && (
        <div aria-hidden="true" className="w-20 h-1 mx-auto bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0E1330] rounded-full transition-all duration-150"
            style={{
              width: '30%',
              transform: `translateX(${scrollProgress * 2.3}%)`
            }}
          />
        </div>
      )}
    </div>
  );
}
