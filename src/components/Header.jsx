import React, { useState } from 'react';
import { Menu, Search, ShoppingBag, X, Package, Phone, Lock, ShieldCheck, MessageCircle } from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import { WHATSAPP_NUMBER } from '../config';

/**
 * Header Component - Extrovat Lifestyle
 *
 * Requirements:
 * - Always visible while scrolling.
 * - Logo image on LEFT as a 42px circle with a 2px ink border, followed by small wordmark "Extrovat" (font-weight 800 / font-extrabold).
 * - Whole logo area is a button or link to Home page with aria-label="Extrovat Lifestyle home".
 * - Hamburger right after the logo.
 * - Search and cart icons on the right.
 * - No overflow on 360px wide screen.
 */
export default function Header({
  cartCount = 0,
  onLogoClick,
  onCartClick,
  onToggleSearch,
  isSearchOpen,
  onOpenTrackOrder,
  isAdmin = false
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logoSrc = import.meta.env.BASE_URL + 'extrovat-logo.png';

  const categories = [
    'Attar',
    'Perfume',
    'Body Spray',
    'Oud & Agarwood',
    'Gift Sets',
    'Lifestyle',
    'Combo Offers',
    'Under ৳999',
    'Track Order',
    'Contact'
  ];

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar />

      <header className="sticky top-0 z-40 w-full bg-[#F7F8FC] border-b-2 border-[#0E1330] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
          {/* Left: Logo Area + Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Logo Button/Link */}
            <a
              href="#/"
              onClick={(e) => {
                if (onLogoClick) {
                  onLogoClick(e);
                }
              }}
              aria-label="Extrovat Lifestyle home"
              className="flex items-center gap-1.5 focus:outline-none cursor-pointer group shrink-0"
            >
              <img
                src={logoSrc}
                alt="Extrovat Lifestyle logo"
                width={42}
                height={42}
                className="w-[42px] h-[42px] rounded-full border-2 border-[#0E1330] object-cover bg-white shrink-0"
              />
              <span className="font-heading font-extrabold text-base sm:text-lg text-[#0E1330] tracking-tight shrink-0">
                Extrovat
              </span>
            </a>

            {/* Hamburger Button right after logo */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="p-1.5 sm:p-2 text-[#0E1330] hover:bg-[#FFFFFF] rounded-xl border-2 border-transparent hover:border-[#0E1330] transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Right: Search and Cart Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Icon Toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="Search"
              aria-expanded={isSearchOpen}
              className={`p-1.5 sm:p-2 rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                isSearchOpen
                  ? 'bg-[#FFFFFF] text-[#0E1330] border-[#0E1330] shadow-[2px_2px_0px_#0E1330]'
                  : 'border-transparent text-[#0E1330] hover:bg-[#FFFFFF] hover:border-[#0E1330]'
              }`}
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={onCartClick}
              aria-label={`Shopping cart, ${cartCount} items`}
              className="relative p-1.5 sm:p-2 rounded-xl border-2 border-transparent text-[#0E1330] hover:bg-[#FFFFFF] hover:border-[#0E1330] transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#FFC933] text-[#0E1330] border border-[#0E1330] text-[10px] font-heading font-extrabold rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0E1330]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-[#F7F8FC] border-r-2 border-[#0E1330] h-full shadow-2xl flex flex-col justify-between z-10 overflow-y-auto text-[#0E1330]">
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b-2 border-[#0E1330] flex items-center justify-between bg-[#FFFFFF]">
                <div className="flex items-center gap-2">
                  <img
                    src={logoSrc}
                    alt="Extrovat Lifestyle logo"
                    width={36}
                    height={36}
                    className="w-[36px] h-[36px] rounded-full border-2 border-[#0E1330] object-cover bg-white"
                  />
                  <div className="flex flex-col">
                    <span className="font-heading font-extrabold text-base text-[#0E1330] leading-tight">
                      Extrovat
                    </span>
                    <span className="text-[10px] font-sans text-[#5B6079]">
                      Lifestyle products & fragrances
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 rounded-xl border-2 border-[#0E1330] bg-[#FFFFFF] text-[#0E1330] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Category List */}
              <nav className="p-4 space-y-1">
                {categories.map((cat, idx) => {
                  const targetId = cat.toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
                  return (
                    <div key={idx}>
                      {cat === 'Track Order' ? (
                        <a
                          href="#/track"
                          onClick={() => setIsMenuOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl font-heading text-xl font-bold text-[#0E1330] hover:bg-[#FFFFFF] hover:border-2 hover:border-[#0E1330] transition-all text-left cursor-pointer"
                        >
                          <span>{cat}</span>
                          <Package className="w-4 h-4 text-[#2436F5]" />
                        </a>
                      ) : cat === 'Contact' ? (
                        <a
                          href="tel:+8809638316596"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-3 rounded-xl font-heading text-xl font-bold text-[#0E1330] hover:bg-[#FFFFFF] hover:border-2 hover:border-[#0E1330] transition-all"
                        >
                          <span>{cat}</span>
                          <Phone className="w-4 h-4 text-[#2436F5]" />
                        </a>
                      ) : (
                        <a
                          href={`#${targetId}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-3 rounded-xl font-heading text-xl font-bold text-[#0E1330] hover:bg-[#FFFFFF] hover:border-2 hover:border-[#0E1330] transition-all"
                        >
                          <span>{cat}</span>
                        </a>
                      )}
                      <div className="border-b border-[#0E1330]/10 my-0.5" />
                    </div>
                  );
                })}
              </nav>

              {/* Call, WhatsApp & Staff Login/Admin Section */}
              <div className="p-4 pt-1 space-y-2 border-t border-[#0E1330]/10">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+8809638316596"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs text-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#F7F8FC] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Phone className="w-4 h-4 text-[#2436F5]" />
                    <span>Call Store</span>
                  </a>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("I want to order from Extrovat Lifestyle")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#25D366] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs text-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#22bf5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-[#0E1330]" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Staff Login / Admin Panel Button */}
                {isAdmin ? (
                  <a
                    href="#/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FFC933] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs text-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#f0ba28] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0E1330]" />
                      <span>Admin panel</span>
                    </div>
                    <span className="font-sans font-bold">→</span>
                  </a>
                ) : (
                  <a
                    href="#/admin/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-xl font-heading font-bold text-xs text-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#2436F5] hover:text-[#FFFFFF] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#2436F5] group-hover:text-[#FFFFFF]" />
                      <span>Staff login</span>
                    </div>
                    <span className="font-sans font-bold">→</span>
                  </a>
                )}
              </div>
            </div>

            {/* Bottom Opacity Watermark */}
            <div className="p-6 relative overflow-hidden pointer-events-none select-none">
              <span className="font-heading font-extrabold text-5xl text-[#0E1330]/6 block tracking-tighter uppercase leading-none">
                Extrovat
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
