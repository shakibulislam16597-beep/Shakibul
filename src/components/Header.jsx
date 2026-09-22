import React, { useRef, useState } from 'react';
import {
  User,
  LogOut,
  Package,
  Heart,
  ChevronDown,
  Menu
} from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import SideDrawer from './SideDrawer';
import SearchBar from './SearchBar';

/**
 * Header Component - Extrovat Lifestyle
 * Two-row stacked sticky header layout
 */
export default function Header({
  cartCount = 0,
  wishlistCount = 0,
  onLogoClick,
  onCartClick,
  isAdmin = false,
  user = null,
  userProfile = null,
  onOpenLogin,
  onLogout,
  onSearchSubmit,
  onSelectProduct,
  products
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

      <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0E1330] border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {/* Row 1 (~56px height): Hamburger + Logo & Wordmark (Left) | Profile/Login (Right) */}
          <div className="h-[56px] flex items-center justify-between gap-2 overflow-hidden">
            {/* Left: Hamburger Button + Logo & Wordmark */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Hamburger Button */}
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open menu"
                className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-[#0E1330] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo & Wordmark */}
              <a
                href="#/"
                onClick={(e) => {
                  if (onLogoClick) {
                    onLogoClick(e);
                  }
                }}
                aria-label="Extrovat Lifestyle home"
                className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#FFC933] rounded-lg p-0.5 cursor-pointer group shrink-0"
              >
                <img
                  src={logoSrc}
                  alt="Extrovat Lifestyle logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-[#0E1330] object-cover bg-white shrink-0"
                />
                <span className="font-heading font-extrabold text-base sm:text-lg text-[#0E1330] dark:text-white tracking-tight shrink-0">
                  Extrovat
                </span>
              </a>
            </div>

            {/* Right: Profile or Login Button */}
            <div className="relative shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                  aria-label="User account menu"
                  className="min-w-[44px] min-h-[44px] px-2 py-1 rounded-xl border-2 border-[#0E1330] bg-white flex items-center gap-1 hover:bg-[#FFC933] transition-all cursor-pointer shadow-[2px_2px_0px_#0E1330] focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
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
                  className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl border-2 border-transparent text-[#0E1330] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-[#0E1330] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
                >
                  <User className="w-6 h-6" />
                </button>
              )}

              {/* Customer Account Dropdown Menu */}
              {user && isAccountDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#0E1330] rounded-2xl shadow-[4px_4px_0px_#0E1330] py-2 z-50 animate-in fade-in zoom-in-95 font-sans text-xs text-[#0E1330]"
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

          {/* Row 2 (~48px height): Full width pill Search Bar */}
          <div className="pb-2 pt-0.5">
            <SearchBar
              onSearchSubmit={onSearchSubmit}
              onSelectProduct={onSelectProduct}
              products={products}
            />
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
