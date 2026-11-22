import React from 'react';
import Link from 'next/link';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../lib/types';
import { ThermometerSnowflake, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

const FEATURED_PRODUCTS: Product[] = [
  {
    id: 'prod-sb-250',
    sku: 'BF-STR-ALB-250G',
    name: 'Albion Strawberries (Grade A, 250g Punnet)',
    category: 'Fresh Berries',
    variety: 'Albion High-Sugar',
    uom_name: '250g Clamshell',
    price_cents: 38000,
    compare_at_price_cents: 45000,
    image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 5,
    storage_temp_c: 2.0,
    tags: ['Best Seller', 'Grade A'],
  },
  {
    id: 'prod-bb-125',
    sku: 'BF-BLU-DUK-125G',
    name: 'Highland Duke Blueberries (125g Punnet)',
    category: 'Fresh Berries',
    variety: 'Duke Super-Blue',
    uom_name: '125g Clamshell',
    price_cents: 52000,
    compare_at_price_cents: 60000,
    image_url: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 10,
    storage_temp_c: 1.5,
    tags: ['Superfood', 'Anthocyanin Rich'],
  },
  {
    id: 'prod-bb-250',
    sku: 'BF-BLU-EME-250G',
    name: 'Emerald Blueberries Jumbo (250g Family Pack)',
    category: 'Fresh Berries',
    variety: 'Emerald Jumbo',
    uom_name: '250g Clamshell',
    price_cents: 85000,
    compare_at_price_cents: 98000,
    image_url: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 10,
    storage_temp_c: 1.5,
    tags: ['Jumbo Berries', 'Crisp'],
  },
  {
    id: 'prod-rb-125',
    sku: 'BF-RAS-HER-125G',
    name: 'Heritage Red Raspberries (125g Punnet)',
    category: 'Fresh Berries',
    variety: 'Heritage Royal',
    uom_name: '125g Clamshell',
    price_cents: 65000,
    compare_at_price_cents: 75000,
    image_url: 'https://images.unsplash.com/photo-1577069808021-766782559595?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 4,
    storage_temp_c: 1.0,
    tags: ['Delicate', 'High Fiber'],
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-berry-red via-[#8E3244] to-[#7A2C3A] text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Berry Good Business. Freshness Connected.</span>
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Direct-From-Highland Fresh Berries.
            </h1>

            <p className="text-berry-pastel text-sm md:text-base leading-relaxed max-w-lg">
              Harvested at dawn on volcanic highland slopes, hydro-cooled within 120 minutes, and delivered in strict 2°C cold-chain to protect every micronutrient.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalog"
                className="px-6 py-3.5 bg-white text-berry-red font-black text-xs md:text-sm rounded-xl shadow-lg hover:bg-berry-cream transition flex items-center gap-2"
              >
                <span>Shop Fresh Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#coldchain"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm rounded-xl border border-white/30 transition"
              >
                Our 2°C Guarantee
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
              <img
                src="https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=1000&q=80"
                alt="Fresh Strawberries"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section id="coldchain" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-berry-blush/40 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-berry-charcoal mb-2">Continuous 2°C Cold Chain</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Real-time refrigerated tracking stops moisture loss and mold growth, preserving 99% of field crispness.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-berry-blush/40 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-berry-charcoal mb-2">FEFO Certified Picking</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our automated First-Expired First-Out logistics prioritizes the freshest lot allocations, guaranteeing zero shelf staleness.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-berry-blush/40 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-berry-pastel text-berry-red flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-berry-charcoal mb-2">Tested 9°+ Brix Sweetness</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Every harvest batch is optically refractometer tested for high dissolved sugar solids before packaging into Grade A clamshells.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-berry-red">Freshly Picked Lots</span>
            <h2 className="text-2xl font-black text-berry-charcoal">Featured Berry Harvests</h2>
          </div>
          <Link href="/catalog" className="text-xs font-bold text-berry-red hover:underline flex items-center gap-1">
            <span>View All Berries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
