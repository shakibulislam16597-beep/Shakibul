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

              {/* Luxury Logo & Brand Wordmark */}
              <a
                href="#/"
                onClick={(e) => {
                  if (onLogoClick) {
                    onLogoClick(e);
                  }
                }}
                aria-label="Extrovat Perfumes home"
                className="flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FFC933] rounded-lg px-1.5 py-0.5 cursor-pointer group shrink-0 animate-logo-entrance select-none"
              >
                {/* Flame Emblem Above Wordmark */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2436F5] dark:text-[#FFC933] transition-colors duration-200 -mb-0.5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C10.5 4.5 9 7 9 9.5C9 12.5 11 14 12 15C13 14 15 12.5 15 9.5C15 7 13.5 4.5 12 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 17C8 17 5 13.8 5 10C5 7 7 4 9.5 2.5C8.5 5 8 7.5 8.5 9.5C9 11.5 10.5 13 12 13.5C13.5 13 15 11.5 15.5 9.5C16 7.5 15.5 5 14.5 2.5C17 4 19 7 19 10C19 13.8 16 17 12 17Z"
                    fill="currentColor"
                    opacity="0.75"
                  />
                </svg>

                {/* Main Wordmark "EXTROVAT" */}
                <div className="font-serif-display flex items-center text-[#0E1330] dark:text-white leading-none font-bold text-lg sm:text-xl tracking-[0.1em] brand-wordmark-shimmer">
                  <span>EXTR</span>
                  {/* Integrated Flame inside "O" */}
                  <span className="relative inline-flex items-center justify-center mx-[0.5px]">
                    <span className="opacity-0">O</span>
                    <svg
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-0 w-full h-full text-current"
                      aria-hidden="true"
                    >
                      <ellipse
                        cx="50"
                        cy="50"
                        rx="38"
                        ry="42"
                        stroke="currentColor"
                        strokeWidth="11"
                        fill="none"
                      />
                      <path
                        d="M50 24C45 35 40 43 40 52C40 59 44.5 64 50 64C55.5 64 60 59 60 52C60 43 55 35 50 24Z"
                        fill="#2436F5"
                        className="dark:fill-[#FFC933] transition-colors duration-200"
                      />
                    </svg>
                  </span>
                  <span>VAT</span>
                </div>

                {/* Sub-text PERFUMES & Tagline MORE THAN A SCENT */}
                <div className="font-sans-sub flex items-center justify-between w-full text-[7.5px] sm:text-[8.5px] font-semibold text-[#0E1330]/85 dark:text-white/85 tracking-[0.18em] uppercase -mt-0.5">
                  <span>PERFUMES</span>
                  <span className="text-[6px] text-[#2436F5] dark:text-[#FFC933] mx-0.5">•</span>
                  <span>MORE THAN A SCENT</span>
                </div>
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
