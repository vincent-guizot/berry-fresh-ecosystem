import React, { useState } from 'react';
import { Boxes, AlertOctagon, Plus, CheckCircle2 } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [toast, setToast] = useState('');

  const [adjustData, setAdjustData] = useState({
    batch_id: 'batch-str-001',
    product_name: 'Albion Strawberries (250g Punnet)',
    quantity: 4,
    reason: 'SPOILED_DISCARD',
    notes: 'Physical bruising observed during morning shelf audit',
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(`Adjustment logged: ${adjustData.quantity} units discarded due to ${adjustData.reason}`);
    setShowAdjustModal(false);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <div>
          <h2 className="text-xl font-black text-berry-charcoal">Inventory Balances & Shrinkage</h2>
          <p className="text-xs text-gray-500">
            Immutable stock ledger and audited natural moisture loss / spoilage adjustments
          </p>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Write-Off Shrinkage</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Facilities Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-berry-green">
                National Cold Hub
              </span>
              <h3 className="font-bold text-sm text-berry-charcoal">Central Warehouse Jakarta</h3>
            </div>
            <span className="px-2 py-0.5 bg-berry-pastel text-berry-red rounded font-mono text-xs font-bold">
              WH-JKT-MAIN
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Albion Strawberries (250g):</span>
              <span className="font-mono font-bold">530 punnets</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Sweet Charlie Loose:</span>
              <span className="font-mono font-bold">145.5 kg</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Duke Blueberries (125g):</span>
              <span className="font-mono font-bold">220 punnets</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-berry-red">
                Retail Point of Sale
              </span>
              <h3 className="font-bold text-sm text-berry-charcoal">Store Jakarta Central</h3>
            </div>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-mono text-xs font-bold">
              STORE-JKT-01
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Albion Strawberries (250g):</span>
              <span className="font-mono font-bold">64 punnets</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Sweet Charlie Loose:</span>
              <span className="font-mono font-bold">18.2 kg</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Duke Blueberries (125g):</span>
              <span className="font-mono font-bold">35 punnets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shrinkage Write-off Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-rose-200">
            <h3 className="font-black text-lg text-rose-700 mb-1">Stock Shrinkage & Spoilage Write-Off</h3>
            <p className="text-xs text-gray-500 mb-4">Record discarded or degraded stock with immutable audit reason</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Target Batch</label>
                <select
                  value={adjustData.batch_id}
                  onChange={(e) => setAdjustData({ ...adjustData, batch_id: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <option value="batch-str-001">BF-20261108-STR-01A (Albion 250g)</option>
                  <option value="batch-str-002">BF-20261108-STR-02B (Albion 250g)</option>
                  <option value="batch-blu-001">BF-20261105-BLU-01 (Blueberry 125g)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Reason Code</label>
                <select
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <option value="SPOILED_DISCARD">SPOILED_DISCARD (Natural fungal or mold write-off)</option>
                  <option value="MOISTURE_LOSS">MOISTURE_LOSS (Natural weight evaporation)</option>
                  <option value="DEFECT_DOWNGRADE">DEFECT_DOWNGRADE (Bruising / Cosmetic defect)</option>
                  <option value="DAMAGED_TRANSIT">DAMAGED_TRANSIT (Crushed in expedition)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Discarded Quantity (Units or Grams)</label>
                <input
                  type="number"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Inspector Notes</label>
                <textarea
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 bg-gray-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-bold">
                  Confirm Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
