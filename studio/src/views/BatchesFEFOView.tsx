import React, { useState, useEffect } from 'react';
import { Batch } from '../types';
import { Clock, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { CORE_API_URL } from '../api';

const FALLBACK_BATCHES: Batch[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    batch_code: 'BF-20261108-STR-01A',
    product_id: '10000000-0000-0000-0000-000000000001',
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
    id: 'b1000000-0000-0000-0000-000000000002',
    batch_code: 'BF-20261108-STR-02B',
    product_id: '10000000-0000-0000-0000-000000000001',
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
    id: 'b1000000-0000-0000-0000-000000000004',
    batch_code: 'BF-20261105-BLU-01',
    product_id: '10000000-0000-0000-0000-000000000003',
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

export const BatchesFEFOView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>(FALLBACK_BATCHES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/inventory/batches`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setBatches(json.data);
        }
      } else {
        throw new Error(`HTTP error ${res.status}`);
      }
    } catch (e: any) {
      console.warn('Batches API error, using cached lots:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Batch Traceability & FEFO Monitor</h2>
          <p className="text-xs text-gray-500">
            Automated First-Expired, First-Out picking engine allocating lots from harvest to retail
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-berry-red transition disabled:opacity-50"
            title="Refresh Batches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-berry-red bg-berry-pastel px-3 py-1.5 rounded-xl border border-berry-blush">
            <Clock className="w-3.5 h-3.5" />
            <span>FEFO Sorting Active</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No active batches found in warehouse.
          </div>
        ) : (
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
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800">
                        {b.quality_grade}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-berry-charcoal">
                    {b.remaining_quantity_base.toLocaleString('id-ID')} {b.remaining_quantity_base > 1000 ? 'g' : 'units'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-mono font-bold text-berry-charcoal">
                        {b.hours_remaining}h remaining
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Best before: {b.best_before_date}</div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {b.status}
                    </span>
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
