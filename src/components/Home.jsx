import React, { useState, useEffect } from 'react';
import Header from './Header';
import CategoryGrid from './CategoryGrid';
import BannerStrip from './BannerStrip';
import FlashSaleStrip from './FlashSaleStrip';
import ProductCard from './ProductCard';
import FloatingCart from './FloatingCart';
import BottomNav from './BottomNav';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import OrderSuccessModal from './OrderSuccessModal';
import WhatsAppBanner from './WhatsAppBanner';
import FilterSheet from './FilterSheet';
import QuickViewModal from './QuickViewModal';
import RecentlyViewed from './RecentlyViewed';
import ScentFinderQuiz from './ScentFinderQuiz';
import OrderTrackingModal from './OrderTrackingModal';
import InstallPrompt from './InstallPrompt';
import LoginSheet from './LoginSheet';

// New Storefront Pages
import WishlistPage from './WishlistPage';
import OffersPage from './OffersPage';
import FaqPage from './FaqPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';

import { MOCK_PRODUCTS } from '../data/products';
import { getStorefrontData } from '../lib/storefrontData';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { X, ArrowLeft, Grid, ArrowUp, SlidersHorizontal } from 'lucide-react';

/**
 * Home Component - Extrovat Lifestyle Storefront
 * Premium, clean, minimal aesthetic.
 */
export default function Home({
  onResetSplash,
  isAdmin = false,
  user = null,
  userProfile = null,
  onLogout
}) {
  const [storefrontProducts, setStorefrontProducts] = useState(MOCK_PRODUCTS);
  const [activeTab, setActiveTab] = useState('home');
  const [activeSearchTerm, setActiveSearchTerm] = useState(null);

  // Hash route tracking for inner storefront sub-pages
  const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Cart & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Filter states
  const maxPrice = 20000;
  const [priceRange, setPriceRange] = useState(maxPrice);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeTileSlug, setActiveTileSlug] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Standard Category Names
  const categoriesList = [
    'Attar',
    'Perfume',
    'Body Spray',
    'Oud & Agarwood',
    'Gift Sets',
    'Lifestyle',
    'Combo Offers',
    'Under ৳999'
  ];

  // Recently Viewed state
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Cart state from safe storage or default
  const [cartItems, setCartItems] = useState(() => {
    return safeGetItem('extrovat_cart', [
      { ...MOCK_PRODUCTS[0], quantity: 1, selectedSize: '12ml' },
      { ...MOCK_PRODUCTS[1], quantity: 1, selectedSize: '6ml' }
    ]);
  });

  // Wishlist count calculation
  const wishlistCount = userProfile?.wishlist?.length || safeGetItem('extrovat_wishlist', ['1', '2']).length;

  // Save cart to localStorage
  useEffect(() => {
    safeSetItem('extrovat_cart', cartItems);
  }, [cartItems]);

  // Load storefront products from Firestore or cache with fallback
  useEffect(() => {
    let isMounted = true;
    getStorefrontData()
      .then((data) => {
        if (isMounted && data && Array.isArray(data.products) && data.products.length > 0) {
          setStorefrontProducts(data.products);
        }
      })
      .catch((err) => {
        console.warn('Failed to load storefront data, using fallback:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load recently viewed
  useEffect(() => {
    const loaded = safeGetItem('extrovat_recently_viewed', []);
    setRecentlyViewed(loaded);
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToRecentlyViewed = (product) => {
    if (!product) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 8);
      safeSetItem('extrovat_recently_viewed', updated);
      return updated;
    });
  };

  const handleClearRecentlyViewed = () => {
    setRecentlyViewed([]);
    safeSetItem('extrovat_recently_viewed', []);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartBDT = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Home Page Sections
  const sections = categoriesList.map((catName) => {
    const sectionId = catName.toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
    return {
      id: sectionId,
      title: catName,
      categoryKey: catName
    };
  });

  // Helper to filter and sort product list
  const applyFiltersAndSort = (productList) => {
    let filtered = productList.filter((p) => {
      const matchesPrice = p.price <= priceRange;

      let matchesCat = true;
      if (activeTileSlug === 'offers') {
        matchesCat = Boolean(p.oldPrice && p.oldPrice > p.price);
      } else if (activeTileSlug === 'under-999' || selectedCategories.includes('Under ৳999')) {
        matchesCat = p.price <= 999;
      } else if (activeTileSlug === 'new-arrivals') {
        matchesCat = p.badge?.toLowerCase().includes('new') || p.badge?.toLowerCase().includes('off');
      } else if (activeTileSlug === 'best-sellers') {
        matchesCat = p.badge?.toLowerCase().includes('best') || p.rating >= 4.8;
      } else if (selectedCategories.length > 0) {
        matchesCat = selectedCategories.includes(p.category);
      }

      return matchesPrice && matchesCat;
    });

    if (sortBy === 'price-low-high') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high-low') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => b.id - a.id);
    }

    return filtered;
  };

  const scrollToProductGrid = () => {
    const gridElem = document.getElementById('products-grid-section');
    if (gridElem) {
      gridElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategoryTile = (tile) => {
    setActiveTileSlug(tile.slug);
    if (tile.filterType === 'all') {
      setSelectedCategories([]);
    } else if (tile.filterType === 'category') {
      setSelectedCategories([tile.categoryKey]);
    } else if (tile.filterType === 'under999') {
      setSelectedCategories(['Under ৳999']);
    } else {
      setSelectedCategories([]);
    }
    scrollToProductGrid();
  };

  const handleBannerAction = (action) => {
    if (!action) return;

    if (action.type === 'category') {
      const matchTile = sections.find((s) => s.categoryKey.toLowerCase() === action.value.toLowerCase());
      if (matchTile) {
        setSelectedCategories([matchTile.categoryKey]);
        setActiveTileSlug(matchTile.id);
      } else {
        setSelectedCategories([action.value]);
      }
      scrollToProductGrid();
    } else if (action.type === 'offers') {
      window.location.hash = '#/offers';
    } else if (action.type === 'link' && action.value) {
      window.location.hash = action.value;
    }
  };

  const handleToggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (updated.length === 1) {
        const slugMatch = updated[0].toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
        setActiveTileSlug(slugMatch);
      } else if (updated.length === 0) {
        setActiveTileSlug('all');
      } else {
        setActiveTileSlug('custom');
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setPriceRange(maxPrice);
    setSelectedCategories([]);
    setActiveTileSlug('all');
    setSortBy('popular');
  };

  const handleAddToCart = (prod, selectedSize = '12ml') => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === prod.id && item.selectedSize === selectedSize
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { ...prod, quantity: 1, selectedSize }];
    });
    addToRecentlyViewed(prod);
  };

  const handleBuyNow = (prod, selectedSize = '12ml') => {
    handleAddToCart(prod, selectedSize);
    setIsCheckoutOpen(true);
  };

  const handleQuickView = (prod) => {
    setQuickViewProduct(prod);
    addToRecentlyViewed(prod);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleSuccessOrder = () => {
    setIsCheckoutOpen(false);
    setCartItems([]);
    setIsSuccessOpen(true);
  };

  const handleSearchSubmit = (term) => {
    setActiveSearchTerm(term);
  };

  const handleSelectProduct = (prod) => {
    handleQuickView(prod);
  };

  const searchResults = activeSearchTerm
    ? applyFiltersAndSort(
        storefrontProducts.filter(
          (p) =>
            (p.title || p.name || '').toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
            (p.category || p.categoryName || '').toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
            (p.note && p.note.toLowerCase().includes(activeSearchTerm.toLowerCase()))
        )
      )
    : [];

  // Determine sub-page route mode
  const isWishlistRoute = currentHash.startsWith('#/wishlist');
  const isOffersRoute = currentHash.startsWith('#/offers');
  const isFaqRoute = currentHash.startsWith('#/faq');
  const isAboutRoute = currentHash.startsWith('#/about');
  const isContactRoute = currentHash.startsWith('#/contact');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0E1330] pb-24 selection:bg-[#0E1330] selection:text-[#FFC933] font-sans">
      {/* Install Prompt for PWA */}
      <InstallPrompt />

      {/* 1. Header with SideDrawer & SearchBar Integration */}
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogoClick={() => {
          setActiveSearchTerm(null);
          handleResetFilters();
        }}
        onCartClick={() => setIsCartOpen(true)}
        isAdmin={isAdmin}
        user={user}
        userProfile={userProfile}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={onLogout}
        onSearchSubmit={handleSearchSubmit}
        onSelectProduct={handleSelectProduct}
        products={storefrontProducts}
      />

      {/* Floating Cart Widget on Right Edge */}
      <FloatingCart
        itemCount={cartCount}
        totalAmount={totalCartBDT}
        onClick={() => setIsCartOpen(true)}
      />

      {/* Filter Bottom Sheet Modal */}
      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categoriesList}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        maxPrice={maxPrice}
        priceRange={priceRange}
        onChangePriceRange={setPriceRange}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        onClearAllFilters={handleResetFilters}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Track Order Modal */}
      <OrderTrackingModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onSuccessOrder={handleSuccessOrder}
        user={user}
        userProfile={userProfile}
      />

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      {/* Login Sheet Modal */}
      <LoginSheet
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Category Drawer Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1330]/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative text-[#0E1330]">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-[#0E1330] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Grid className="w-5 h-5 text-[#0E1330]" />
              <h3 className="text-lg font-serif font-bold text-[#0E1330]">Product Categories</h3>
            </div>

            <div className="space-y-2">
              {sections.map((sec) => {
                const count = storefrontProducts.filter((p) => {
                  if (sec.categoryKey === 'Under ৳999') return p.price < 1000;
                  return p.category === sec.categoryKey;
                }).length;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      setSelectedCategories([sec.categoryKey]);
                      setActiveTileSlug(sec.id);
                      scrollToProductGrid();
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl bg-slate-50 hover:bg-[#0E1330] hover:text-white font-sans font-medium text-xs tracking-wide transition-colors flex items-center justify-between cursor-pointer border border-slate-200/80 group"
                  >
                    <span>{sec.title}</span>
                    <span className="text-[10px] bg-slate-200 group-hover:bg-[#FFC933] text-[#0E1330] px-2 py-0.5 rounded-full font-bold">
                      {count} items
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Routes to specific page or Home view */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-3 space-y-8 sm:space-y-12">
        {isWishlistRoute ? (
          <WishlistPage
            user={user}
            userProfile={userProfile}
            products={storefrontProducts}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ) : isOffersRoute ? (
          <OffersPage
            products={storefrontProducts}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            user={user}
            userProfile={userProfile}
          />
        ) : isFaqRoute ? (
          <FaqPage />
        ) : isAboutRoute ? (
          <AboutPage />
        ) : isContactRoute ? (
          <ContactPage />
        ) : activeSearchTerm ? (
          /* Search Results View */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSearchTerm(null)}
                  className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-slate-600 hover:text-[#0E1330] mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to store
                </button>
                <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#0E1330]">
                  Search results for "{activeSearchTerm}"
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="px-4 py-2 bg-[#0E1330] text-white text-xs font-sans font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFC933]" /> Filters
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {searchResults.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onBuyNow={handleBuyNow}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
                    user={user}
                    userProfile={userProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm space-y-2">
                <p className="text-sm font-serif font-bold text-[#0E1330]">
                  No matching products found for "{activeSearchTerm}"
                </p>
                <p className="text-xs font-sans text-slate-500">
                  Try adjusting filters or search keywords.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 inline-block px-4 py-2 bg-[#0E1330] text-white text-xs font-sans font-semibold rounded-lg"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Normal Home Page View */
          <>
            {/* 2. CategoryGrid */}
            <CategoryGrid
              activeCategory={activeTileSlug}
              onSelectCategory={handleSelectCategoryTile}
            />

            {/* 3. BannerStrip */}
            <BannerStrip onBannerAction={handleBannerAction} />

            {/* 4. Flash Sale Strip */}
            <FlashSaleStrip
              onExploreSale={() => {
                window.location.hash = '#/offers';
              }}
            />

            {/* Scent Finder Interactive Quiz */}
            <ScentFinderQuiz onAddToCart={handleAddToCart} products={storefrontProducts} />

            {/* 5. Product Grid Section */}
            <div id="products-grid-section" className="space-y-10 sm:space-y-14 pt-2">
              {/* Product Category Sections */}
              {sections.map((sec) => {
                const categoryProducts = applyFiltersAndSort(
                  storefrontProducts.filter((p) => {
                    if (sec.categoryKey === 'Under ৳999') return p.price < 1000;
                    return p.category === sec.categoryKey;
                  })
                );

                if (categoryProducts.length === 0) return null;

                return (
                  <section key={sec.id} id={sec.id} aria-label={sec.title} className="space-y-4">
                    {/* Section Header Row */}
                    <div className="flex items-end justify-between pb-3 border-b border-slate-200/80">
                      <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#0E1330] tracking-tight">
                          {sec.title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategories([sec.categoryKey]);
                          const slugMatch = sec.categoryKey.toLowerCase().replace(/\s+/g, '-').replace('&', 'and');
                          setActiveTileSlug(slugMatch);
                          setIsFilterOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#0E1330] border border-slate-200/80 shadow-xs font-sans font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        See all
                      </button>
                    </div>

                    {/* 2 columns on mobile product grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                      {categoryProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          onBuyNow={handleBuyNow}
                          onAddToCart={handleAddToCart}
                          onQuickView={handleQuickView}
                          user={user}
                          userProfile={userProfile}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Recently Viewed Horizontal Scroll */}
            <RecentlyViewed
              products={recentlyViewed}
              onQuickView={handleQuickView}
              onAddToCart={handleAddToCart}
              onClear={handleClearRecentlyViewed}
            />

            {/* WhatsApp Contact Banner above Footer */}
            <WhatsAppBanner />
          </>
        )}
      </main>

      {/* Storefront Footer with Staff Login Link */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 mt-12 mb-16 text-center text-xs font-sans text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <p className="font-serif font-semibold text-[#0E1330]">
              © {new Date().getFullYear()} Extrovat Lifestyle. All rights reserved.
            </p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-[10px] font-mono text-slate-400">
              v1.0 ({typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'})
            </span>
          </div>
          <a
            href="#/admin/login"
            className="text-[11px] font-sans font-semibold text-slate-600 hover:text-[#0E1330] underline underline-offset-2 transition-colors cursor-pointer"
          >
            Staff login
          </a>
        </div>
      </footer>

      {/* Back To Top Floating Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-20 left-4 z-40 p-3 bg-white text-[#0E1330] hover:bg-slate-100 rounded-full border border-slate-200/80 shadow-md transition-all active:scale-95 cursor-pointer animate-in fade-in"
        >
          <ArrowUp className="w-5 h-5 text-[#0E1330]" />
        </button>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabSelect={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') {
            handleResetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCategory={() => setIsCategoryModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        user={user}
        userProfile={userProfile}
      />
    </div>
  );
}
