import React, { useEffect } from 'react';
import { ArrowLeft, Tag, ShoppingBag, Percent } from 'lucide-react';
import { MOCK_PRODUCTS } from '../data/products';
import ProductCard from './ProductCard';

export default function OffersPage({
  products = MOCK_PRODUCTS,
  onAddToCart,
  onBuyNow,
  user = null,
  userProfile = null
}) {
  useEffect(() => {
    document.title = "Special Offers & Deals | Extrovat Lifestyle";
  }, []);

  // Filter products with oldPrice > price and calculate discount %
  const discountedProducts = products
    .filter((p) => p.oldPrice && p.oldPrice > p.price)
    .map((p) => {
      const discountPercent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
      return { ...p, discountPercent };
    })
    .sort((a, b) => b.discountPercent - a.discountPercent);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#0E1330] pb-4">
        <div>
          <a
            href="#/"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#2436F5] hover:underline mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </a>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0E1330] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#2436F5]" /> Exclusive Offers & Deals
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#6B1F2A] text-[#FFFFFF] px-3.5 py-1.5 rounded-full border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330]">
          <Percent className="w-3.5 h-3.5 text-[#FFC933]" />
          <span className="text-xs font-heading font-extrabold uppercase tracking-wider">
            Up to 30% Off
          </span>
        </div>
      </div>

      {discountedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {discountedProducts.map((prod) => (
            <div key={prod.id} className="relative">
              {/* Discount Badge Override */}
              <div className="absolute top-3 left-3 z-10 bg-[#6B1F2A] text-[#FFFFFF] text-[10px] font-heading font-extrabold px-2.5 py-1 rounded-full border border-[#0E1330] shadow-sm">
                -{prod.discountPercent}% OFF
              </div>
              <ProductCard
                product={prod}
                onBuyNow={onBuyNow}
                onAddToCart={onAddToCart}
                user={user}
                userProfile={userProfile}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] p-8 text-center shadow-[4px_4px_0px_#0E1330] max-w-md mx-auto space-y-4 my-8">
          <div className="w-16 h-16 bg-[#FFC933] rounded-full flex items-center justify-center mx-auto border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330]">
            <Tag className="w-8 h-8 text-[#0E1330]" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#0E1330]">
            No promotional deals active right now
          </h2>
          <p className="text-xs font-sans text-[#5B6079]">
            Check back soon for seasonal flash sales and bundle offers!
          </p>
          <a
            href="#/"
            className="inline-block px-6 py-3 bg-[#2436F5] text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] hover:bg-[#1020D0] transition-all cursor-pointer"
          >
            Explore all products
          </a>
        </div>
      )}
    </div>
  );
}
