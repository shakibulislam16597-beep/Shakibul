import React, { useEffect, useRef, useState } from 'react';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource-variable/montserrat';

import {
  X,
  Home,
  ShoppingBag,
  Heart,
  Package,
  Tag,
  HelpCircle,
  BookOpen,
  MessageSquare,
  ArrowUpRight,
  Phone,
  Shield,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';

import { PHONE, WHATSAPP, ADMIN_MENU_BUTTON } from '../config';
import { safeGetItem, safeSetItem } from '../utils/storage';

/**
 * SideDrawer - Luxury classical French/Middle-Eastern perfume house mobile-first side menu
 */
export default function SideDrawer({
  isOpen,
  onClose,
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  triggerRef,
  isAdmin = false
}) {
  const drawerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchMoveXRef = useRef(null);

  // Theme state: light or dark (scoped to drawer only)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = safeGetItem('extrovat_drawer_theme', null);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    safeSetItem('extrovat_drawer_theme', nextTheme);
  };

  // Current route tracking for active states
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lock body scroll and handle focus trap / escape key
  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into drawer
    const focusableElements = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);

      // Return focus to trigger button on close
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  // Touch swipe left handler
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchMoveXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchMoveXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null &&
      touchMoveXRef.current !== null &&
      touchStartXRef.current - touchMoveXRef.current > 60
    ) {
      onClose();
    }
    touchStartXRef.current = null;
    touchMoveXRef.current = null;
  };

  const logoUrl = import.meta.env.BASE_URL + 'extrovat-logo.png';

  // Active route matching helper
  const isRouteActive = (routeHash) => {
    if (routeHash === '#/' || routeHash === '#') {
      return currentHash === '' || currentHash === '#' || currentHash === '#/' || currentHash === '#';
    }
    return currentHash.startsWith(routeHash);
  };

  // Admin button visibility check
  const showAdminButton =
    ADMIN_MENU_BUTTON === 'everyone' || (ADMIN_MENU_BUTTON === 'admin-only' && isAdmin);

  const handleNavigate = (targetHash) => {
    onClose();
    window.location.hash = targetHash;
  };

  const handleCartClick = () => {
    onClose();
    if (onOpenCart) onOpenCart();
  };

  // Scoped CSS variable values based on drawer theme
  const isDark = theme === 'dark';
  const drawerBg = isDark ? '#0F172A' : '#FAF8F5';
  const drawerText = isDark ? '#F5F0E6' : '#1A1A1A';
  const drawerMuted = isDark ? '#94A3B8' : '#6B6B6B';
  const drawerHairline = isDark ? 'rgba(245,240,230,0.14)' : '#E8E2D6';
  const goldColor = '#C9A227';
  const goldTint = 'rgba(201,162,39,0.12)';
  const burgundy = '#6B1F2A';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      className="fixed inset-0 z-50 flex"
    >
      {/* Scrim Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[#000000]/60 backdrop-blur-xs transition-opacity duration-300 ${
          prefersReducedMotion ? '' : 'animate-in fade-in'
        }`}
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: drawerBg,
          color: drawerText,
          fontFamily: "'Montserrat Variable', Montserrat, sans-serif",
          width: 'min(88vw, 400px)'
        }}
        className={`relative z-10 flex flex-col h-full shadow-[8px_0_28px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out ${
          prefersReducedMotion ? '' : 'animate-in slide-in-from-left duration-300'
        }`}
      >
        {/* Drawer Header */}
        <div
          style={{ borderBottomColor: drawerHairline }}
          className="p-4 border-b flex flex-col gap-3 shrink-0"
        >
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Extrovat Lifestyle logo"
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border-2 border-[#C9A227] object-cover shrink-0 shadow-sm"
              />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  fontSize: '26px',
                  color: drawerText,
                  lineHeight: '1.1'
                }}
                className="tracking-tight"
              >
                Extrovat Lifestyle
              </span>
            </div>

            {/* Controls: Theme Toggle + Close Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} drawer theme`}
                className="p-2 rounded-full border border-[#C9A227]/40 hover:bg-[#C9A227]/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-[#D4AF37]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#C9A227]" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-full border border-transparent hover:bg-[#C9A227]/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
                <X className="w-5 h-5 text-[#C9A227]" />
              </button>
            </div>
          </div>

          {/* Gold Ornamental Line with Centered Diamond */}
          <div className="relative flex items-center justify-center mt-1">
            <div
              style={{ backgroundColor: goldColor }}
              className="w-full h-[1px] opacity-40"
            />
            <span
              style={{ backgroundColor: drawerBg, color: goldColor }}
              className="absolute px-2 text-[10px] leading-none"
            >
              ◆
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu List */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {/* Menu Item 1: Home */}
          <button
            type="button"
            onClick={() => handleNavigate('#/')}
            aria-current={isRouteActive('#/') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <Home className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">Home</span>
            </div>
          </button>

          {/* Menu Item 2: My Cart */}
          <button
            type="button"
            onClick={handleCartClick}
            style={{
              backgroundColor: 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            <div className="flex items-center gap-3.5">
              <ShoppingBag className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">My Cart</span>
            </div>
            {cartCount > 0 && (
              <span
                style={{ backgroundColor: burgundy }}
                className="text-[#FFFFFF] text-xs font-bold px-2 py-0.5 rounded-full"
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* Menu Item 3: Wishlist */}
          <button
            type="button"
            onClick={() => handleNavigate('#/wishlist')}
            aria-current={isRouteActive('#/wishlist') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/wishlist') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/wishlist') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <Heart className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span
                style={{ backgroundColor: burgundy }}
                className="text-[#FFFFFF] text-xs font-bold px-2 py-0.5 rounded-full"
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Hairline Divider */}
          <div style={{ backgroundColor: drawerHairline }} className="h-[1px] my-2" />

          {/* Menu Item 4: Track Order */}
          <button
            type="button"
            onClick={() => handleNavigate('#/track')}
            aria-current={isRouteActive('#/track') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/track') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/track') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <Package className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">Track Order</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-60" />
          </button>

          {/* Menu Item 5: Offers and Deals */}
          <button
            type="button"
            onClick={() => handleNavigate('#/offers')}
            aria-current={isRouteActive('#/offers') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/offers') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/offers') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <Tag className="w-5 h-5 shrink-0 opacity-90 text-[#C9A227]" />
              <span className="text-[15px] font-medium tracking-wide">Offers & Deals</span>
            </div>
            <span
              style={{ backgroundColor: burgundy }}
              className="text-[#FFFFFF] text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
            >
              SALE
            </span>
          </button>

          {/* Hairline Divider */}
          <div style={{ backgroundColor: drawerHairline }} className="h-[1px] my-2" />

          {/* Menu Item 6: FAQ */}
          <button
            type="button"
            onClick={() => handleNavigate('#/faq')}
            aria-current={isRouteActive('#/faq') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/faq') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/faq') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <HelpCircle className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">FAQ</span>
            </div>
          </button>

          {/* Menu Item 7: About Us */}
          <button
            type="button"
            onClick={() => handleNavigate('#/about')}
            aria-current={isRouteActive('#/about') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/about') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/about') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <BookOpen className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">About Us</span>
            </div>
          </button>

          {/* Menu Item 8: Contact Us */}
          <button
            type="button"
            onClick={() => handleNavigate('#/contact')}
            aria-current={isRouteActive('#/contact') ? 'page' : undefined}
            style={{
              backgroundColor: isRouteActive('#/contact') ? goldTint : 'transparent',
              color: drawerText
            }}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-300 relative group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
          >
            {isRouteActive('#/contact') && (
              <span
                style={{ backgroundColor: goldColor }}
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
              />
            )}
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5 shrink-0 opacity-90" />
              <span className="text-[15px] font-medium tracking-wide">Contact Us</span>
            </div>
            <Phone className="w-4 h-4 opacity-60 text-[#C9A227]" />
          </button>
        </div>

        {/* Sticky Action Bar at Bottom of Drawer */}
        <div
          style={{
            borderTopColor: drawerHairline,
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
          }}
          className="p-4 border-t space-y-2.5 shrink-0 bg-inherit"
        >
          {/* Side by side buttons: Call Store & WhatsApp */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Call Store Button */}
            <a
              href={`tel:${PHONE}`}
              style={{ borderColor: goldColor, color: drawerText }}
              className="min-h-[44px] py-2.5 px-3 rounded-[10px] border-[1.5px] font-medium text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-[#C9A227]/10 active:scale-[0.98] transition-all shadow-xs cursor-pointer text-center"
            >
              <Phone className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
              <span>Call Store</span>
            </a>

            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] py-2.5 px-3 rounded-[10px] bg-[#25D366] text-[#FFFFFF] font-medium text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-[#20bd5a] active:scale-[0.98] transition-all shadow-xs cursor-pointer text-center"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Full-width Admin Panel Button */}
          {showAdminButton && (
            <button
              type="button"
              onClick={() => handleNavigate('#/admin')}
              style={{
                backgroundColor: isDark ? '#0B1220' : '#0F172A',
                borderColor: isDark ? 'rgba(201,162,39,0.4)' : 'transparent'
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-[10px] text-[#FFFFFF] font-medium text-xs tracking-wider uppercase border flex items-center justify-between hover:bg-[#1E293B] active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C9A227]" />
                <span>Admin Panel</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C9A227]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
