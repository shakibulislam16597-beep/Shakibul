import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { MOCK_PRODUCTS } from '../data/products';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

export default function WishlistPage({
  user = null,
  userProfile = null,
  products = MOCK_PRODUCTS,
  onAddToCart,
  onBuyNow
}) {
  useEffect(() => {
    document.title = "Saved Wishlist | Extrovat Lifestyle";
  }, []);

  const [wishlistIds, setWishlistIds] = useState(() => {
    if (user && userProfile?.wishlist) {
      return userProfile.wishlist;
    }
    return safeGetItem('extrovat_wishlist', ['1', '2']);
  });

  useEffect(() => {
    if (user && userProfile?.wishlist) {
      setWishlistIds(userProfile.wishlist);
    }
  }, [user, userProfile]);

  const handleRemove = async (id) => {
    const stringId = String(id);
    const updated = wishlistIds.filter((item) => String(item) !== stringId);
    setWishlistIds(updated);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          wishlist: arrayRemove(stringId)
        });
      } catch (err) {
        console.warn('Error removing wishlist item from Firestore:', err);
      }
    } else {
      safeSetItem('extrovat_wishlist', updated);
    }
  };

  const wishlistProducts = products.filter((p) =>
    wishlistIds.some((id) => String(id) === String(p.id))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back to Home Navigation Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0E1330] pb-4">
        <div>
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#2436F5] hover:underline mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </a>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0E1330]">
            Your Saved Wishlist
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-[#FFC933] text-[#0E1330] px-3 py-1.5 rounded-full border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330]">
          <Heart className="w-4 h-4 fill-current" />
          <span className="text-xs font-heading font-extrabold">
            {wishlistProducts.length} Items
          </span>
        </div>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {wishlistProducts.map((product) => {
            const hasDiscount = product.oldPrice && product.oldPrice > product.price;
            return (
              <div
                key={product.id}
                className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[20px] p-3 flex flex-col justify-between shadow-[3px_3px_0px_#0E1330] relative group hover:shadow-[5px_5px_0px_#0E1330] transition-all"
              >
                {/* Image & Remove Icon */}
                <div className="relative aspect-square rounded-[14px] bg-[#F7F8FC] overflow-hidden mb-3 border border-[#0E1330]">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    aria-label={`Remove ${product.title} from wishlist`}
                    className="absolute top-2 right-2 p-2 bg-[#FFFFFF] text-[#FF4D4D] rounded-full border border-[#0E1330] shadow-sm hover:bg-[#FF4D4D] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#5B6079]">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-heading font-extrabold text-[#0E1330] line-clamp-1">
                      {product.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#E8E2D6] flex items-center justify-between">
                    <div>
                      <span className="text-sm font-heading font-extrabold text-[#0E1330]">
                        ৳{product.price.toLocaleString()}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] font-heading line-through text-[#5B6079] ml-1">
                          ৳{product.oldPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className="w-full mt-2 py-2 bg-[#2436F5] text-[#FFFFFF] text-xs font-heading font-extrabold rounded-full border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#1020D0] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] p-8 text-center shadow-[4px_4px_0px_#0E1330] max-w-md mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-[#FAF8F5] rounded-full flex items-center justify-center mx-auto border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330]">
            <Heart className="w-8 h-8 text-[#5B6079]" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#0E1330]">
            Your wishlist is empty
          </h2>
          <p className="text-xs font-sans text-[#5B6079]">
            Save your favorite organic attars and perfume oils to quickly access them anytime.
          </p>
          <a
            href="#/"
            className="inline-block px-6 py-3 bg-[#FFC933] text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] hover:bg-[#E5B520] transition-all cursor-pointer"
          >
            Browse products
          </a>
        </div>
      )}
    </div>
  );
}
