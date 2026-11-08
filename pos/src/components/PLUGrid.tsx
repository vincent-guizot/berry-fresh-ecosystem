import React, { useState } from 'react';
import { Product } from '../types';
import { Scale, Search, Sparkles } from 'lucide-react';

interface Props {
  products: Product[];
  onSelectProduct: (product: Product, quantityBase: number) => void;
}

export const PLUGrid: React.FC<Props> = ({ products, onSelectProduct }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [scaleModalProduct, setScaleModalProduct] = useState<Product | null>(null);
  const [scaleWeightGrams, setScaleWeightGrams] = useState<number>(350);

  const categories = ['All', 'Fresh Berries', 'Exotic Fruits'];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.plu_code.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleProductClick = (product: Product) => {
    if (product.is_catch_weight) {
      setScaleModalProduct(product);
      setScaleWeightGrams(350); // Default simulated scale tare weight
    } else {
      onSelectProduct(product, 1);
    }
  };

  const handleConfirmScaleWeight = () => {
    if (scaleModalProduct && scaleWeightGrams > 0) {
      onSelectProduct(scaleModalProduct, scaleWeightGrams);
      setScaleModalProduct(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-berry-blush/40 p-4 overflow-hidden">
      {/* Header & Search */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-berry-charcoal/40" />
          <input
            type="text"
            placeholder="Search by PLU (e.g. 4011) or fruit name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-berry-cream/60 border border-berry-blush/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-berry-red"
          />
        </div>
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeCategory === c
                  ? 'bg-berry-red text-white'
                  : 'bg-berry-cream text-berry-charcoal/70 hover:bg-berry-pastel'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 pr-1">
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            className="flex flex-col justify-between p-3 bg-white rounded-xl border border-berry-blush/50 hover:border-berry-red hover:shadow-md transition text-left group"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono bg-berry-cream text-berry-charcoal px-2 py-0.5 rounded font-bold border border-berry-beige/60">
                  PLU {product.plu_code}
                </span>
                {product.is_catch_weight && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                    <Scale className="w-3 h-3" /> Scale
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-berry-charcoal line-clamp-2 leading-tight group-hover:text-berry-red">
                {product.name}
              </h4>
            </div>

            <div className="mt-3 pt-2 border-t border-berry-cream flex justify-between items-baseline">
              <span className="text-xs text-berry-charcoal/60">{product.uom_name}</span>
              <span className="text-sm font-extrabold text-berry-red font-mono">
                Rp {product.price_cents.toLocaleString('id-ID')}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Scale Weigher Simulation Modal */}
      {scaleModalProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-berry-red/20">
            <div className="flex items-center gap-2 text-berry-red mb-2">
              <Scale className="w-6 h-6" />
              <h3 className="font-bold text-lg">Weigh Station / Scale Input</h3>
            </div>
            <p className="text-xs text-berry-charcoal/70 mb-4">{scaleModalProduct.name}</p>

            <div className="bg-berry-cream p-4 rounded-xl border border-berry-beige/80 mb-4 text-center">
              <div className="text-3xl font-extrabold font-mono text-berry-charcoal mb-1">
                {scaleWeightGrams} <span className="text-sm font-normal">grams</span>
              </div>
              <div className="text-xs text-berry-charcoal/60">
                Rate: Rp {(scaleModalProduct.price_cents / 1000).toLocaleString('id-ID')} / gram
              </div>
              <div className="text-sm font-bold text-berry-red mt-2 pt-2 border-t border-berry-beige/60">
                Line Total: Rp {Math.round((scaleModalProduct.price_cents * scaleWeightGrams) / 1000).toLocaleString('id-ID')}
              </div>
            </div>

            {/* Quick Weight Adjusters */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[100, 250, 500, 1000].map((w) => (
                <button
                  key={w}
                  onClick={() => setScaleWeightGrams(w)}
                  className="py-1.5 bg-berry-pastel text-berry-red rounded-lg font-bold text-xs hover:bg-berry-blush/40"
                >
                  +{w}g
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setScaleModalProduct(null)}
                className="flex-1 py-2 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmScaleWeight}
                className="flex-1 py-2 text-sm font-bold rounded-xl bg-berry-red hover:bg-berry-red/90 text-white shadow"
              >
                Accept Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
