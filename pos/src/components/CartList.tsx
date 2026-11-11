import React from 'react';
import { CartItem } from '../types';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, Scale } from 'lucide-react';

interface Props {
  items: CartItem[];
  onUpdateQty: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOpenPayment: () => void;
}

export const CartList: React.FC<Props> = ({
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
}) => {
  const subtotal = items.reduce((acc, item) => acc + item.line_total_cents, 0);
  const tax = Math.round(subtotal * 0.11); // 11% PPN
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-berry-blush/40 p-4">
      <div className="flex justify-between items-center pb-3 border-b border-berry-blush/40">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-berry-red" />
          <h3 className="font-extrabold text-base text-berry-charcoal">Active Basket</h3>
          <span className="text-xs font-bold px-2 py-0.5 bg-berry-pastel text-berry-red rounded-full">
            {items.length} items
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Cart Items Scroll */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-berry-charcoal/40 text-center p-6">
            <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-berry-blush" />
            <p className="text-sm font-semibold">Cart is currently empty</p>
            <p className="text-xs">Select PLU items from grid or scan fruit barcode</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={`${item.product.id}-${idx}`}
              className="flex items-center justify-between p-2.5 bg-berry-cream/50 rounded-xl border border-berry-blush/30 hover:border-berry-blush transition"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1">
                  <h5 className="font-bold text-xs text-berry-charcoal truncate">{item.product.name}</h5>
                  {item.product.is_catch_weight && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded flex items-center gap-0.5">
                      <Scale className="w-2.5 h-2.5" /> {item.quantity_base}g
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-berry-charcoal/60 font-mono mt-0.5">
                  Rp {item.unit_price_cents.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                {!item.product.is_catch_weight && (
                  <div className="flex items-center bg-white rounded-lg border border-berry-blush/50">
                    <button
                      onClick={() => onUpdateQty(idx, item.quantity_base - 1)}
                      className="p-1 hover:bg-berry-pastel text-berry-charcoal rounded-l-lg"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono">
                      {item.quantity_base}
                    </span>
                    <button
                      onClick={() => onUpdateQty(idx, item.quantity_base + 1)}
                      className="p-1 hover:bg-berry-pastel text-berry-charcoal rounded-r-lg"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="w-20 text-right font-extrabold text-xs font-mono text-berry-charcoal">
                  Rp {item.line_total_cents.toLocaleString('id-ID')}
                </div>

                <button
                  onClick={() => onRemoveItem(idx)}
                  className="p-1 text-gray-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bill Breakdown */}
      <div className="pt-3 border-t border-berry-blush/40 space-y-1.5 text-xs">
        <div className="flex justify-between text-berry-charcoal/70">
          <span>Subtotal</span>
          <span className="font-mono font-semibold">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-berry-charcoal/70">
          <span>PPN (11%)</span>
          <span className="font-mono font-semibold">Rp {tax.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold text-berry-charcoal pt-1 border-t border-berry-blush/30">
          <span>Total Bill</span>
          <span className="font-mono text-berry-red text-lg">Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        disabled={items.length === 0}
        onClick={onOpenPayment}
        className="w-full mt-3 py-3.5 bg-berry-red hover:bg-berry-red/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
      >
        <CreditCard className="w-5 h-5" />
        <span>Pay Bill (Rp {total.toLocaleString('id-ID')})</span>
      </button>
    </div>
  );
};
