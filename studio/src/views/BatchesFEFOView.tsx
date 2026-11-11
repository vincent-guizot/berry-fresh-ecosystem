import React from 'react';
import { Batch } from '../types';
import { Clock, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

export const BatchesFEFOView: React.FC = () => {
  const batches: Batch[] = [
    {
      id: 'batch-str-001',
      batch_code: 'BF-20261108-STR-01A',
      product_id: 'prod-sb-250',
      product_name: 'Albion Strawberries (Grade A, 250g Punnet)',
      farm_name: 'Ciwidey Highland Farm Plot 3',
      harvest_date: '2026-11-06',
      best_before_date: '2026-11-11',
      hours_remaining: 64,
      quality_grade: 'GRADE_A',
      brix: 9.4,
      remaining_quantity_base: 180,
      status: 'ACTIVE',
      fefo_order: 1,
    },
    {
      id: 'batch-str-002',
      batch_code: 'BF-20261108-STR-02B',
      product_id: 'prod-sb-250',
      product_name: 'Albion Strawberries (Grade A, 250g Punnet)',
      farm_name: 'Lembang Sunrise Farm',
      harvest_date: '2026-11-08',
      best_before_date: '2026-11-13',
      hours_remaining: 112,
      quality_grade: 'GRADE_A',
      brix: 9.8,
      remaining_quantity_base: 350,
      status: 'ACTIVE',
      fefo_order: 2,
    },
    {
      id: 'batch-blu-001',
      batch_code: 'BF-20261105-BLU-01',
      product_id: 'prod-bb-125',
      product_name: 'Highland Duke Blueberries (125g Punnet)',
      farm_name: 'Batu Highland Agro',
      harvest_date: '2026-11-04',
      best_before_date: '2026-11-14',
      hours_remaining: 136,
      quality_grade: 'GRADE_A',
      brix: 12.5,
      remaining_quantity_base: 220,
      status: 'ACTIVE',
      fefo_order: 1,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Batch Traceability & FEFO Monitor</h2>
          <p className="text-xs text-gray-500">
            Automated First-Expired, First-Out picking engine allocating lots from harvest to retail
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-berry-red bg-berry-pastel px-3 py-1.5 rounded-xl border border-berry-blush">
          <Clock className="w-3.5 h-3.5" />
          <span>FEFO Sorting Active</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">FEFO Priority</th>
              <th className="p-4">Batch Code & Product</th>
              <th className="p-4">Farm of Origin</th>
              <th className="p-4">Brix / Grade</th>
              <th className="p-4">Remaining Qty</th>
              <th className="p-4">Shelf-Life Clock</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {batches.map((b) => (
              <tr key={b.id} className="hover:bg-berry-cream/40 transition">
                <td className="p-4">
                  <span className="w-6 h-6 rounded-full bg-berry-pastel text-berry-red font-black text-xs flex items-center justify-center font-mono">
                    #{b.fefo_order}
                  </span>
                </td>
                <td className="p-4">
                  <div className="font-bold text-berry-charcoal">{b.product_name}</div>
                  <div className="text-[11px] font-mono text-gray-400">{b.batch_code}</div>
                </td>
                <td className="p-4">
                  <div className="text-gray-700">{b.farm_name}</div>
                  <div className="text-[10px] text-gray-400">Harvest: {b.harvest_date}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-amber-700 font-mono">{b.brix}° Bx</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {b.quality_grade}
                    </span>
                  </div>
                </td>
                <td className="p-4 font-mono font-bold text-berry-charcoal">
                  {b.remaining_quantity_base} units
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-berry-red font-bold font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.hours_remaining} hours left</span>
                  </div>
                  <div className="text-[10px] text-gray-400">Expiry: {b.best_before_date}</div>
                </td>
                <td className="p-4 text-right">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
