import React from 'react';
import { ReceiptData } from '../types';
import { Printer, CheckCircle, RotateCcw } from 'lucide-react';

interface Props {
  receipt: ReceiptData | null;
  isOpen: boolean;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ receipt, isOpen, onNewSale }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-berry-blush flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-berry-charcoal mb-0.5">Transaction Approved</h3>
        <p className="text-xs text-berry-charcoal/60 mb-4 font-mono">{receipt.receipt_number}</p>

        {/* Thermal Receipt Simulation */}
        <div className="w-full bg-berry-cream/80 p-4 rounded-xl border border-berry-beige/80 text-xs font-mono text-berry-charcoal space-y-2 mb-5 shadow-inner">
          <div className="text-center pb-2 border-b border-dashed border-berry-charcoal/30">
            <div className="font-extrabold text-sm">BERRY FRESH RETAIL</div>
            <div className="text-[10px]">Store Jakarta Central — Reg 01</div>
            <div className="text-[10px] text-berry-charcoal/60">{receipt.transacted_at}</div>
          </div>

          <div className="space-y-1.5 py-1">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="truncate pr-2">
                  <div className="font-bold truncate">{item.product_name}</div>
                  <div className="text-[10px] text-berry-charcoal/60">
                    {item.quantity_base} {item.is_catch_weight ? 'g' : 'pcs'} @ Rp {item.unit_price_cents.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="font-bold whitespace-nowrap">
                  Rp {item.line_total_cents.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-dashed border-berry-charcoal/30 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {receipt.subtotal_cents.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>PPN (11%):</span>
              <span>Rp {receipt.tax_cents.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-berry-charcoal/20">
              <span>TOTAL:</span>
              <span>Rp {receipt.total_amount_cents.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Tender ({receipt.payment_method}):</span>
              <span>Rp {(receipt.cash_tendered_cents || receipt.total_amount_cents).toLocaleString('id-ID')}</span>
            </div>
            {receipt.cash_change_cents ? (
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Change:</span>
                <span>Rp {receipt.cash_change_cents.toLocaleString('id-ID')}</span>
              </div>
            ) : null}
          </div>

          <div className="text-center pt-2 border-t border-dashed border-berry-charcoal/30 text-[10px] text-berry-charcoal/60">
            Berry Good Business. Freshness Connected.<br />
            Thank you for shopping at Berry Fresh!
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-berry-cream hover:bg-berry-pastel border border-berry-beige text-berry-charcoal font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 py-2.5 bg-berry-red hover:bg-berry-red/90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
};
