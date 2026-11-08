'use client';

import React from 'react';
import { Product } from '../lib/types';
import { useCart } from '../lib/cartContext';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-2xl border border-berry-blush/40 overflow-hidden shadow-sm hover:shadow-lg hover:border-berry-red transition flex flex-col justify-between group">
      <div className="relative aspect-[4/3] overflow-hidden bg-berry-cream">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          <span className="text-[10px] font-black bg-berry-red text-white px-2 py-0.5 rounded-full shadow">
            {product.variety}
          </span>
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[10px] font-extrabold bg-white/95 backdrop-blur-sm text-berry-charcoal px-2 py-0.5 rounded-full shadow-sm">
            {product.uom_name}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-berry-green uppercase tracking-wider block mb-0.5">
            {product.category}
          </span>
          <h3 className="font-extrabold text-sm text-berry-charcoal leading-snug group-hover:text-berry-red transition">
            {product.name}
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-base font-black text-berry-red font-mono">
              Rp {product.price_cents.toLocaleString('id-ID')}
            </div>
            {product.compare_at_price_cents && (
              <div className="text-[10px] text-gray-400 line-through font-mono">
                Rp {product.compare_at_price_cents.toLocaleString('id-ID')}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="p-2 bg-berry-cream hover:bg-berry-red text-berry-red hover:text-white rounded-xl transition shadow-sm"
            title="Add to Basket"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
