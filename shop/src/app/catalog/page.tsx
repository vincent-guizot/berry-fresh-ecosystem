'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { Product } from '../../lib/types';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { CORE_API_URL } from '../../lib/api';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
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
    id: '10000000-0000-0000-0000-000000000003',
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
    id: '10000000-0000-0000-0000-000000000004',
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
    id: '10000000-0000-0000-0000-000000000005',
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
    id: '10000000-0000-0000-0000-000000000006',
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
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeVariety, setActiveVariety] = useState('All');

  const varieties = ['All', 'Strawberries', 'Blueberries', 'Raspberries', 'Blackberries'];

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/catalog/products?channel=ECOMMERCE`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        setProducts(data.data);
      }
    } catch (err: any) {
      console.warn('Could not fetch products from Core API, using cached master list:', err.message);
      // Keep fallback products
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variety.toLowerCase().includes(search.toLowerCase());
    let matchesVariety = true;
    if (activeVariety === 'Strawberries') matchesVariety = p.name.includes('Strawberr') || p.variety.includes('Albion') || p.variety.includes('Charlie');
    if (activeVariety === 'Blueberries') matchesVariety = p.name.includes('Blueberr') || p.variety.includes('Duke') || p.variety.includes('Emerald');
    if (activeVariety === 'Raspberries') matchesVariety = p.name.includes('Raspberr') || p.variety.includes('Heritage');
    if (activeVariety === 'Blackberries') matchesVariety = p.name.includes('Blackberr') || p.variety.includes('Prime-Ark');
    return matchesSearch && matchesVariety;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-berry-charcoal mb-2">Fresh Fruit Catalog</h1>
          <p className="text-xs text-gray-500">
            Hand-picked volcanic highland harvest delivered in strict 2°C cold-chain express
          </p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="self-start md:self-auto px-3.5 py-2 bg-berry-cream border border-berry-beige text-berry-charcoal hover:bg-berry-pastel text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-berry-red ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Catalog</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-berry-blush/40 shadow-sm">
        {/* Variety Chips */}
        <div className="flex flex-wrap gap-2">
          {varieties.map((v) => (
            <button
              key={v}
              onClick={() => setActiveVariety(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeVariety === v
                  ? 'bg-berry-red text-white shadow-sm'
                  : 'bg-berry-cream hover:bg-berry-pastel text-berry-charcoal'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search berry variety..."
            className="w-full pl-9 pr-3 py-1.5 bg-berry-cream/50 border border-gray-200 rounded-xl text-xs text-berry-charcoal placeholder-gray-400 focus:outline-none focus:border-berry-red"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 space-y-2">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-600">No berry varieties found</p>
          <p className="text-xs text-gray-400">Try adjusting your variety filter or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
