import React, { useState } from 'react';
import { ShiftInfo } from '../types';
import { ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

interface Props {
  shift: ShiftInfo;
  isOpen: boolean;
  onClose: () => void;
  onCloseShift: (actualCashCents: number) => void;
}

export const ShiftModal: React.FC<Props> = ({
  shift,
  isOpen,
  onClose,
  onCloseShift,
}) => {
  if (!isOpen) return null;

  const expectedCash = shift.opening_cash_float_cents + shift.total_revenue_cents;
  const [actualCash, setActualCash] = useState<number>(expectedCash);

  const discrepancy = actualCash - expectedCash;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(actualCash);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-berry-blush">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-berry-charcoal">Cashier Shift Register</h3>
            <p className="text-xs text-berry-charcoal/60">Shift ID: {shift.id}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
            {shift.status}
          </span>
        </div>

        {/* Current Shift Summary */}
        <div className="bg-berry-cream/60 p-4 rounded-2xl border border-berry-beige mb-4 space-y-2 text-xs">
          <div className="flex justify-between text-berry-charcoal/70">
            <span>Cashier:</span>
            <span className="font-bold text-berry-charcoal">{shift.cashier_name}</span>
          </div>
          <div className="flex justify-between text-berry-charcoal/70">
            <span>Register:</span>
            <span className="font-mono font-bold text-berry-charcoal">{shift.register_code}</span>
          </div>
          <div className="flex justify-between text-berry-charcoal/70">
            <span>Opening Float:</span>
            <span className="font-mono font-bold">Rp {shift.opening_cash_float_cents.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-berry-charcoal/70">
            <span>Sales Revenue:</span>
            <span className="font-mono font-bold text-berry-red">
              Rp {shift.total_revenue_cents.toLocaleString('id-ID')} ({shift.total_transactions} tx)
            </span>
          </div>
          <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-berry-beige">
            <span>Expected Cash in Drawer:</span>
            <span className="font-mono text-berry-charcoal">Rp {expectedCash.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Closing Drawer Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-berry-charcoal block mb-1">
              Actual Physical Cash Counted (IDR)
            </label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(Number(e.target.value))}
              required
              className="w-full px-4 py-2.5 bg-white border border-berry-blush rounded-xl font-mono text-lg font-bold text-berry-charcoal focus:ring-2 focus:ring-berry-red focus:outline-none"
            />
          </div>

          {/* Discrepancy Alert */}
          {discrepancy !== 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Discrepancy: {discrepancy > 0 ? '+' : ''}Rp {discrepancy.toLocaleString('id-ID')}. This will be flagged on the audit report.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Perfect cash drawer balance! Zero discrepancy.</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-berry-charcoal bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Continue Shift
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Close Shift & Reconcile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
