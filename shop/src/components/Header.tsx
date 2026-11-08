'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../lib/cartContext';
import { ShoppingBag, ThermometerSnowflake, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-berry-blush/40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-berry-red text-white flex items-center justify-center text-xl shadow-md">
            🍓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-berry-red">BERRY FRESH</span>
              <span className="text-[10px] font-bold bg-berry-pastel text-berry-red px-2 py-0.5 rounded-full">
                Shop Direct
              </span>
            </div>
            <p className="text-[11px] text-berry-green font-semibold">Freshness Connected • Cold-Chain Guaranteed</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-berry-charcoal">
          <Link href="/catalog" className="hover:text-berry-red transition">Fresh Catalog</Link>
          <Link href="/#coldchain" className="hover:text-berry-red transition flex items-center gap-1">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" />
            <span>2°C Cold Chain</span>
          </Link>
          <Link href="/#fefo" className="hover:text-berry-red transition flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-berry-green" />
            <span>FEFO Certified</span>
          </Link>
        </nav>

        {/* Cart Drawer Link */}
        <Link
          href="/checkout"
          className="flex items-center gap-2 px-4 py-2 bg-berry-red hover:bg-berry-red/90 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart ({totalItems})</span>
        </Link>
      </div>
    </header>
  );
};
