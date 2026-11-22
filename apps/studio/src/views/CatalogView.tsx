import React, { useState, useEffect } from 'react';
import { ProductItem } from '../types';
import { Layers, ThermometerSnowflake, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { CORE_API_URL } from '../api';

const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    sku: 'BF-STR-ALB-250G',
    barcode: '899123456701',
    plu_code: '4011',
    name: 'Albion Strawberries (Grade A, 250g Punnet)',
    category: 'Fresh Berries',
    uom_name: '250g Clamshell',
    price_cents: 38000,
    shelf_life_days: 5,
    storage_temp_c: 2.0,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    sku: 'BF-STR-SWC-KG',
    barcode: '899123456702',
    plu_code: '4012',
    name: 'Sweet Charlie Strawberries (Loose Catch-Weight)',
    category: 'Fresh Berries',
    uom_name: 'Kilogram (Scale Weighed)',
    price_cents: 120000,
    shelf_life_days: 4,
    storage_temp_c: 2.5,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    sku: 'BF-BLU-DUK-125G',
    barcode: '899123456703',
    plu_code: '4021',
    name: 'Highland Duke Blueberries (125g Punnet)',
    category: 'Fresh Berries',
    uom_name: '125g Clamshell',
    price_cents: 52000,
    shelf_life_days: 10,
    storage_temp_c: 1.5,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    sku: 'BF-BLU-EME-250G',
    barcode: '899123456704',
    plu_code: '4022',
    name: 'Emerald Blueberries Jumbo (250g Family Pack)',
    category: 'Fresh Berries',
    uom_name: '250g Clamshell',
    price_cents: 85000,
    shelf_life_days: 10,
    storage_temp_c: 1.5,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    sku: 'BF-RAS-HER-125G',
    barcode: '899123456705',
    plu_code: '4031',
    name: 'Heritage Red Raspberries (125g Punnet)',
    category: 'Fresh Berries',
    uom_name: '125g Clamshell',
    price_cents: 65000,
    shelf_life_days: 4,
    storage_temp_c: 1.0,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    sku: 'BF-BLK-ARK-125G',
    barcode: '899123456706',
    plu_code: '4041',
    name: 'Prime-Ark Blackberries (125g Punnet)',
    category: 'Fresh Berries',
    uom_name: '125g Clamshell',
    price_cents: 58000,
    shelf_life_days: 6,
    storage_temp_c: 1.5,
  },
];

export const CatalogView: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/catalog/products`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        }
      }
    } catch (e) {
      console.warn('Catalog API error, using cached products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Master Fruit Catalog & Pricing</h2>
          <p className="text-xs text-gray-500">
            Unified catalog shared across Berry Fresh Shop (E-Commerce) and Berry Fresh POS (Retail)
          </p>
        </div>
        <button
          onClick={fetchCatalog}
          disabled={loading}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-berry-red transition disabled:opacity-50"
          title="Refresh Catalog"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No products found in catalog.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Product Name & Category</th>
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4">PLU Code</th>
                <th className="p-4">Standard Packaging Unit</th>
                <th className="p-4">Optimum Cold Temp</th>
                <th className="p-4">Shelf Life</th>
                <th className="p-4 text-right">Standard Retail Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-berry-cream/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-berry-charcoal">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.category}</div>
                  </td>
                  <td className="p-4 font-mono text-gray-600">
                    <div>{p.sku}</div>
                    <div className="text-[10px] text-gray-400">{p.barcode}</div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-berry-red px-2 py-0.5 bg-berry-pastel rounded">
                      {p.plu_code || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{p.uom_name}</td>
                  <td className="p-4 font-mono text-gray-600">
                    <span className="flex items-center gap-1">
                      <ThermometerSnowflake className="w-3 h-3 text-cyan-600" />
                      {p.storage_temp_c}°C
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{p.shelf_life_days} days</td>
                  <td className="p-4 text-right font-mono font-bold text-berry-charcoal">
                    Rp {p.price_cents.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
