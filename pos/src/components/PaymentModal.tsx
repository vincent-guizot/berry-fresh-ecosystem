import React, { useState } from 'react';
import { Banknote, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  totalAmountCents: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: 'CASH' | 'QRIS_DYNAMIC', tenderedCents: number) => void;
}

export const PaymentModal: React.FC<Props> = ({
  totalAmountCents,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<'CASH' | 'QRIS_DYNAMIC'>('CASH');
  const [tenderedCents, setTenderedCents] = useState<number>(totalAmountCents);

  const changeCents = Math.max(0, tenderedCents - totalAmountCents);
  const isExact = tenderedCents === totalAmountCents;

  const quickTenders = [
    totalAmountCents,
    Math.ceil(totalAmountCents / 50000) * 50000,
    100000,
    200000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= totalAmountCents);

  const handlePay = () => {
    onConfirmPayment(method, method === 'CASH' ? tenderedCents : totalAmountCents);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-berry-blush/60">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-berry-charcoal">Tender Payment</h3>
            <p className="text-xs text-berry-charcoal/60">Select payment method and finalize sale</p>
          </div>
          <span className="text-2xl font-black font-mono text-berry-red">
            Rp {totalAmountCents.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Method Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setMethod('CASH')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border-2 transition ${
              method === 'CASH'
                ? 'border-berry-red bg-berry-pastel text-berry-red'
                : 'border-berry-blush/40 hover:bg-berry-cream text-berry-charcoal'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash Tender</span>
          </button>

          <button
            onClick={() => setMethod('QRIS_DYNAMIC')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm border-2 transition ${
              method === 'QRIS_DYNAMIC'
                ? 'border-berry-red bg-berry-pastel text-berry-red'
                : 'border-berry-blush/40 hover:bg-berry-cream text-berry-charcoal'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>Dynamic QRIS</span>
          </button>
        </div>

        {/* Cash Tender Interface */}
        {method === 'CASH' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-berry-charcoal block mb-1">
                Cash Tendered by Customer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm font-bold text-berry-charcoal/60">
                  Rp
                </span>
                <input
                  type="number"
                  value={tenderedCents}
                  onChange={(e) => setTenderedCents(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 bg-berry-cream/50 border border-berry-blush rounded-xl font-mono text-lg font-bold text-berry-charcoal focus:ring-2 focus:ring-berry-red focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Tender Suggestions */}
            <div className="flex gap-2 flex-wrap">
              {quickTenders.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTenderedCents(amt)}
                  className="px-3 py-1.5 bg-berry-cream hover:bg-berry-pastel border border-berry-beige/80 rounded-lg text-xs font-bold text-berry-charcoal font-mono"
                >
                  Rp {amt.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            {/* Change Display */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-emerald-800 block">Change Due</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  Rp {changeCents.toLocaleString('id-ID')}
                </span>
              </div>
              {isExact ? (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full">
                  Exact Amount
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          /* Dynamic QRIS Interface */
          <div className="text-center p-4 bg-berry-cream/60 rounded-2xl border border-berry-beige">
            <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-inner border border-berry-blush/60 mb-2 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226670014ID.BERRYFRESH.POS01189360091800000100010215BF${totalAmountCents}520454115303360540${totalAmountCents}5802ID5911BERRY FRESH6007JAKARTA62070703A016304`}
                alt="Dynamic QRIS"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs font-bold text-berry-charcoal">Scan with BCA, GoPay, OVO, ShopeePay, Dana</p>
            <p className="text-[11px] text-berry-charcoal/60 mt-0.5 font-mono">Simulated instant QRIS settlement</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-berry-charcoal bg-gray-100 hover:bg-gray-200 rounded-2xl transition"
          >
            Cancel
          </button>
          <button
            disabled={method === 'CASH' && tenderedCents < totalAmountCents}
            onClick={handlePay}
            className="flex-1 py-3 text-sm font-extrabold text-white bg-berry-red hover:bg-berry-red/90 disabled:bg-gray-300 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>Complete Sale</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
