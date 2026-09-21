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
 *
 * Requirements:
 * - 5 columns and 2 rows grid that scrolls sideways (CSS grid, grid-auto-flow: column, scroll-snap-type: x mandatory, hidden scrollbar).
 * - Thin track indicator below showing scroll position (only when overflow, aria-hidden).
 * - Tile: rounded-16 (rounded-[16px]) icon box (~60px) with 2px ink border (#0E1330) and soft tinted background.
 * - Inline SVG icon (or optional image at public/categories/<slug>.png with SVG fallback on error).
 * - Centered label of at most 2 lines below, sentence case, 12px.
 * - Tapping a tile triggers onSelectCategory(tile).
 * - Shows active state (blue outline ring-2 ring-[#2436F5] and bold label).
 * - Real button with aria-label and visible focus ring.
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
    <div className="w-full space-y-2 select-none">
      {/* Scrollable Grid Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto scrollbar-none snap-x snap-mandatory py-1 px-1"
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
                className="snap-start flex flex-col items-center group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2436F5] rounded-xl p-0.5"
              >
                {/* ~60px Icon Box */}
                <div
                  style={{ backgroundColor: tile.bgColor }}
                  className={`w-[60px] h-[60px] rounded-[16px] border-2 border-[#0E1330] flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'shadow-[2px_2px_0px_#2436F5] ring-2 ring-[#2436F5] scale-105'
                      : 'shadow-[2px_2px_0px_#0E1330] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                  }`}
                >
                  <IconComponent
                    className={`w-6 h-6 stroke-[2.25] ${
                      isActive ? 'text-[#2436F5]' : 'text-[#0E1330]'
                    }`}
                  />
                </div>

                {/* Label below <= 2 lines, 12px */}
                <span
                  className={`text-[11px] sm:text-xs text-center leading-tight mt-1.5 max-w-[76px] line-clamp-2 transition-colors ${
                    isActive
                      ? 'font-heading font-extrabold text-[#2436F5]'
                      : 'font-sans font-medium text-[#0E1330] group-hover:text-[#2436F5]'
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
        <div aria-hidden="true" className="w-24 h-1 mx-auto bg-[#0E1330]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2436F5] rounded-full transition-all duration-150"
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
