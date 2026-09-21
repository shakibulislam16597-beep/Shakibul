import React, { useRef, useState } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  Package,
  Heart,
  ChevronDown,
  Menu
} from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import SideDrawer from './SideDrawer';

/**
 * Header Component - Extrovat Lifestyle
 * Rebuilt with luxury SideDrawer integration
 */
export default function Header({
  cartCount = 0,
  wishlistCount = 0,
  onLogoClick,
  onCartClick,
  onToggleSearch,
  isSearchOpen,
  isAdmin = false,
  user = null,
  userProfile = null,
  onOpenLogin,
  onLogout
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const hamburgerRef = useRef(null);

  const logoSrc = import.meta.env.BASE_URL + 'extrovat-logo.png';

  const avatarSrc = userProfile?.photoURL || user?.photoURL;
  const displayName =
    userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Account';
  const initialLetter = displayName.charAt(0).toUpperCase();

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
              ref={hamburgerRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
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

            {/* Person Icon / User Avatar Dropdown Entry */}
            <div className="relative shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                  aria-label="User account menu"
                  className="p-1 sm:p-1.5 rounded-xl border-2 border-[#0E1330] bg-[#FFFFFF] flex items-center gap-1 hover:bg-[#FFC933] transition-all cursor-pointer shadow-[2px_2px_0px_#0E1330]"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-[#0E1330]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#2436F5] text-white flex items-center justify-center font-heading font-extrabold text-xs">
                      {initialLetter}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-[#0E1330]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  aria-label="Log in"
                  className="p-1.5 sm:p-2 rounded-xl border-2 border-transparent text-[#0E1330] hover:bg-[#FFFFFF] hover:border-[#0E1330] transition-all cursor-pointer"
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}

              {/* Customer Account Dropdown Menu */}
              {user && isAccountDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-2xl shadow-[4px_4px_0px_#0E1330] py-2 z-50 animate-in fade-in zoom-in-95 font-sans text-xs text-[#0E1330]"
                  onMouseLeave={() => setIsAccountDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b-2 border-[#0E1330]/10 font-heading">
                    <p className="font-extrabold text-[#0E1330] truncate">{displayName}</p>
                    <p className="text-[10px] text-[#5B6079] font-sans truncate">{user.email}</p>
                  </div>

                  <a
                    href="#/account"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 font-bold hover:bg-[#F7F8FC] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#2436F5]" />
                    <span>My Account</span>
                  </a>

                  <a
                    href="#/account/orders"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 font-bold hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-[#2436F5]" />
                    <span>My Orders</span>
                  </a>

                  <a
                    href="#/wishlist"
                    onClick={() => setIsAccountDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 font-bold hover:bg-[#F7F8FC] transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#2436F5]" />
                    <span>Saved Items</span>
                  </a>

                  <div className="border-t border-[#0E1330]/10 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Luxury Classical Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenCart={onCartClick}
        triggerRef={hamburgerRef}
        isAdmin={isAdmin}
      />
    </>
  );
}
