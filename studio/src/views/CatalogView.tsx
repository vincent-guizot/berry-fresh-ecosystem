import React from 'react';
import { ProductItem } from '../types';
import { Layers, ThermometerSnowflake, Tag } from 'lucide-react';

export const CatalogView: React.FC = () => {
  const products: ProductItem[] = [
    {
      id: 'prod-sb-250',
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
      id: 'prod-sb-loose',
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
      id: 'prod-bb-125',
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
      id: 'prod-bb-250',
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
      id: 'prod-rb-125',
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
      id: 'prod-bk-125',
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

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Master Fruit Catalog & Pricing</h2>
          <p className="text-xs text-gray-500">
            Unified catalog shared across Berry Fresh Shop (E-Commerce) and Berry Fresh POS (Retail)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Product Name & Category</th>
              <th className="p-4">SKU / Barcode</th>
              <th className="p-4">PLU Code</th>
              <th className="p-4">Standard Packaging Unit</th>
              <th className="p-4">Optimum Cold Temp</th>
              <th className="p-4 text-right">Unified Price (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition">
                <td className="p-4">
                  <div className="font-bold text-berry-charcoal">{p.name}</div>
                  <div className="text-[11px] text-berry-green font-semibold">{p.category}</div>
                </td>
                <td className="p-4 font-mono text-[11px]">
                  <div>{p.sku}</div>
                  <div className="text-gray-400 font-normal">{p.barcode}</div>
                </td>
                <td className="p-4 font-mono font-bold text-berry-red">
                  PLU {p.plu_code}
                </td>
                <td className="p-4 text-gray-700">{p.uom_name}</td>
                <td className="p-4 font-mono text-cyan-700">
                  <div className="flex items-center gap-1 font-bold">
                    <ThermometerSnowflake className="w-3.5 h-3.5" />
                    <span>{p.storage_temp_c}°C</span>
                  </div>
                </td>
                <td className="p-4 text-right font-mono font-extrabold text-berry-charcoal text-sm">
                  Rp {p.price_cents.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
