import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { ShoppingBag, Eye, Heart } from 'lucide-react';
import { formatBDT } from '../utils/currency';

/**
 * ProductCard Component - Extrovat Lifestyle
 * Premium, clean, minimal product card.
 * Consistent 12px rounded corners, soft shadow, max 2 badges/icons per card,
 * elegant typography and unified Buy now button.
 */
export default function ProductCard({
  product,
  onBuyNow,
  onAddToCart,
  onQuickView,
  user = null,
  userProfile = null
}) {
  const [isLiked, setIsLiked] = useState(false);

  // Sync initial liked state from userProfile wishlist or localStorage
  useEffect(() => {
    if (!product?.id) return;
    if (user && userProfile?.wishlist) {
      setIsLiked(
        userProfile.wishlist.includes(String(product.id)) ||
        userProfile.wishlist.includes(Number(product.id))
      );
    } else {
      const localWish = safeGetItem('extrovat_wishlist', []);
      setIsLiked(localWish.includes(product.id));
    }
  }, [product, user, userProfile]);

  if (!product) return null;

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);

    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        if (nextState) {
          await updateDoc(userRef, {
            wishlist: arrayUnion(String(product.id))
          });
        } else {
          await updateDoc(userRef, {
            wishlist: arrayRemove(String(product.id))
          });
        }
      } catch (err) {
        console.warn('Error syncing wishlist to Firestore:', err);
      }
    } else {
      const localWish = safeGetItem('extrovat_wishlist', []);
      let updated = [];
      if (nextState) {
        updated = [...localWish, product.id];
      } else {
        updated = localWish.filter((id) => id !== product.id);
      }
      safeSetItem('extrovat_wishlist', updated);
    }
  };

  // Calculate discount percentage if oldPrice exists
  const discountPercent = product.oldPrice && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const badgeText = product.badge || (discountPercent ? `${discountPercent}% OFF` : null);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group relative">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-50 mb-3 border border-slate-100">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Max 1 Badge on Top Left (Discount or Promo Badge) */}
        {badgeText && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-block px-2 py-0.5 rounded-md bg-[#0E1330] text-[#FFC933] text-[10px] font-sans font-bold uppercase tracking-wider shadow-sm">
              {badgeText}
            </span>
          </div>
        )}

        {/* Top-Right Action Controls (Wishlist & Quick View) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label={`Quick view ${product.title}`}
              className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#0E1330] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={`Add ${product.title} to wishlist`}
            className={`w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-sm ${
              isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-600 hover:text-[#0E1330]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col text-left flex-1 justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-serif font-semibold text-[#0E1330] line-clamp-2 leading-snug group-hover:text-[#C5A059] transition-colors">
            {product.title}
          </h3>
        </div>

        <div className="pt-1">
          {/* Price Row */}
          <div className="flex items-baseline gap-2 mb-2 font-sans">
            <span className="text-sm sm:text-base font-bold text-[#0E1330]">
              {formatBDT(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs font-normal text-slate-400 line-through">
                {formatBDT(product.oldPrice)}
              </span>
            )}
          </div>

          {/* Buy Now Full-Width Button */}
          <button
            type="button"
            onClick={() => onBuyNow && onBuyNow(product)}
            aria-label={`Buy ${product.title} now for ${formatBDT(product.price)}`}
            className="w-full py-2 px-3 rounded-lg bg-[#0E1330] hover:bg-[#1e2550] text-white font-sans font-semibold text-xs tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFC933]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#FFC933]" />
            <span>Buy now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
