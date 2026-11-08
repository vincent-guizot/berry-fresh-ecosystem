'use client';

import React, { useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { Product } from '../../lib/types';
import { Search } from 'lucide-react';

const ALL_PRODUCTS: Product[] = [
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
  {
    id: 'prod-bk-125',
    sku: 'BF-BLK-ARK-125G',
    name: 'Prime-Ark Blackberries (125g Punnet)',
    category: 'Fresh Berries',
    variety: 'Prime-Ark Freedom',
    uom_name: '125g Clamshell',
    price_cents: 58000,
    compare_at_price_cents: 68000,
    image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 6,
    storage_temp_c: 1.5,
    tags: ['Sweet & Tart', 'Antioxidants'],
  },
];

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [activeVariety, setActiveVariety] = useState('All');

  const varieties = ['All', 'Strawberries', 'Blueberries', 'Raspberries', 'Blackberries'];

  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    let matchesVariety = true;
    if (activeVariety === 'Strawberries') matchesVariety = p.name.includes('Strawberr');
    if (activeVariety === 'Blueberries') matchesVariety = p.name.includes('Blueberr');
    if (activeVariety === 'Raspberries') matchesVariety = p.name.includes('Raspberr');
    if (activeVariety === 'Blackberries') matchesVariety = p.name.includes('Blackberr');
    return matchesSearch && matchesVariety;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-berry-charcoal mb-2">Fresh Fruit Catalog</h1>
        <p className="text-xs text-gray-500">
          Direct highland harvests sorted by FEFO lot freshness and packaged in tamper-evident clamshells
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search berries by name, variety, or grade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-berry-blush/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-berry-red"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {varieties.map((v) => (
            <button
              key={v}
              onClick={() => setActiveVariety(v)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                activeVariety === v
                  ? 'bg-berry-red text-white shadow-sm'
                  : 'bg-white border border-berry-blush/60 text-berry-charcoal hover:bg-berry-cream'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
