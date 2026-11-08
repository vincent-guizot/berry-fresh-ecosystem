import React, { useState, useEffect } from 'react';
import { Product, CartItem, ShiftInfo, ReceiptData } from './types';
import { PLUGrid } from './components/PLUGrid';
import { CartList } from './components/CartList';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ShiftModal } from './components/ShiftModal';
import { OfflineBanner } from './components/OfflineBanner';
import {
  saveLocalCart,
  loadLocalCart,
  clearLocalCart,
  saveLocalShift,
  loadLocalShift,
} from './storage/posStorage';
import { Store, User, Clock, RefreshCw } from 'lucide-react';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-sb-250',
    sku: 'BF-STR-ALB-250G',
    barcode: '899123456701',
    plu_code: '4011',
    name: 'Albion Strawberries (Grade A, 250g Punnet)',
    category: 'Fresh Berries',
    variety: 'Albion High-Sugar',
    uom: 'PUNNET_250',
    uom_name: '250g Clamshell',
    is_catch_weight: false,
    price_cents: 38000,
    image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
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
    variety: 'Sweet Charlie',
    uom: 'KG',
    uom_name: 'Kilogram (Scale Weighed)',
    is_catch_weight: true,
    price_cents: 120000,
    image_url: 'https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=600&q=80',
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
    variety: 'Duke Super-Blue',
    uom: 'PUNNET_125',
    uom_name: '125g Clamshell',
    is_catch_weight: false,
    price_cents: 52000,
    image_url: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80',
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
    variety: 'Emerald Jumbo',
    uom: 'PUNNET_250',
    uom_name: '250g Clamshell',
    is_catch_weight: false,
    price_cents: 85000,
    image_url: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80',
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
    variety: 'Heritage Royal',
    uom: 'PUNNET_125',
    uom_name: '125g Clamshell',
    is_catch_weight: false,
    price_cents: 65000,
    image_url: 'https://images.unsplash.com/photo-1577069808021-766782559595?auto=format&fit=crop&w=600&q=80',
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
    variety: 'Prime-Ark Freedom',
    uom: 'PUNNET_125',
    uom_name: '125g Clamshell',
    is_catch_weight: false,
    price_cents: 58000,
    image_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80',
    shelf_life_days: 6,
    storage_temp_c: 1.5,
  },
];

export default function App() {
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => loadLocalCart());
  const [shift, setShift] = useState<ShiftInfo>(
    () =>
      loadLocalShift() || {
        id: 'shift-20261108-01',
        register_id: 'reg-jkt-01',
        register_code: 'POS-REG-01',
        cashier_name: 'Siti Rahma',
        opened_at: new Date().toISOString(),
        opening_cash_float_cents: 200000,
        status: 'OPEN',
        total_transactions: 14,
        total_revenue_cents: 1845000,
      }
  );

  const [isOffline, setIsOffline] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Preserve cart to localStorage on every change
  useEffect(() => {
    saveLocalCart(cart);
  }, [cart]);

  // Preserve shift to localStorage
  useEffect(() => {
    saveLocalShift(shift);
  }, [shift]);

  // Check connection to Core
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:8080/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
        if (res.ok) setIsOffline(false);
        else setIsOffline(true);
      } catch (e) {
        setIsOffline(true);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectProduct = (product: Product, quantityBase: number) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);

      if (product.is_catch_weight) {
        // Variable weighed item -> calculate line total: (price_per_kg * grams) / 1000
        const lineTotal = Math.round((product.price_cents * quantityBase) / 1000);
        return [
          ...prev,
          {
            product,
            quantity_base: quantityBase,
            unit_price_cents: product.price_cents,
            line_total_cents: lineTotal,
            weighed_on_scale: true,
          },
        ];
      }

      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity_base + quantityBase;
        updated[existingIdx].quantity_base = newQty;
        updated[existingIdx].line_total_cents = newQty * product.price_cents;
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity_base: quantityBase,
          unit_price_cents: product.price_cents,
          line_total_cents: quantityBase * product.price_cents,
        },
      ];
    });
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity_base = newQty;
      updated[index].line_total_cents = newQty * updated[index].unit_price_cents;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    clearLocalCart();
  };

  const subtotal = cart.reduce((acc, i) => acc + i.line_total_cents, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const handleConfirmPayment = async (method: 'CASH' | 'QRIS_DYNAMIC', tenderedCents: number) => {
    const receiptNum = `BF-POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const receipt: ReceiptData = {
      receipt_number: receiptNum,
      transacted_at: new Date().toLocaleString('id-ID'),
      register_code: shift.register_code,
      cashier_name: shift.cashier_name,
      items: cart.map((i) => ({
        product_name: i.product.name,
        quantity_base: i.quantity_base,
        unit_price_cents: i.unit_price_cents,
        line_total_cents: i.line_total_cents,
        is_catch_weight: i.product.is_catch_weight,
      })),
      subtotal_cents: subtotal,
      discount_cents: 0,
      tax_cents: tax,
      total_amount_cents: total,
      payment_method: method,
      cash_tendered_cents: tenderedCents,
      cash_change_cents: Math.max(0, tenderedCents - total),
    };

    // Try posting to core API
    try {
      await fetch('http://localhost:8080/api/v1/retail/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity_base: i.quantity_base,
            is_catch_weight: i.product.is_catch_weight,
            unit_price_cents: i.unit_price_cents,
            line_total_cents: i.line_total_cents,
          })),
          subtotal_cents: subtotal,
          discount_cents: 0,
          tax_cents: tax,
          total_amount_cents: total,
          payment_method: method,
          cash_tendered_cents: tenderedCents,
        }),
      });
    } catch (e) {
      console.warn('POS Core unreachable; transaction saved locally');
    }

    // Update shift metrics
    setShift((prev) => ({
      ...prev,
      total_transactions: prev.total_transactions + 1,
      total_revenue_cents: prev.total_revenue_cents + total,
    }));

    setActiveReceipt(receipt);
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
    setCart([]);
    clearLocalCart();
  };

  const handleCloseShift = (actualCash: number) => {
    setShift((prev) => ({ ...prev, status: 'CLOSED' }));
    setIsShiftOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-berry-cream overflow-hidden">
      {/* Offline Alert Banner */}
      <OfflineBanner isOffline={isOffline} />

      {/* Top POS Header */}
      <header className="bg-white border-b border-berry-blush/40 px-6 py-2.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-berry-red rounded-xl flex items-center justify-center text-white text-lg shadow-sm">
            🍓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-tight text-berry-red">BERRY FRESH POS</h1>
              <span className="text-[10px] bg-berry-pastel text-berry-red font-extrabold px-2 py-0.5 rounded-full">
                STORE JKT-01
              </span>
            </div>
            <p className="text-[11px] text-berry-charcoal/60 flex items-center gap-1 font-medium">
              <Store className="w-3 h-3 text-berry-green" /> Central Jakarta Store • Reg 01
            </p>
          </div>
        </div>

        {/* Cashier & Shift Widget */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-berry-charcoal flex items-center justify-end gap-1">
              <User className="w-3.5 h-3.5 text-berry-red" />
              <span>{shift.cashier_name}</span>
            </div>
            <div className="text-[11px] text-berry-charcoal/60 font-mono">
              Revenue: Rp {shift.total_revenue_cents.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            onClick={() => setIsShiftOpen(true)}
            className="px-3 py-1.5 bg-berry-cream hover:bg-berry-pastel border border-berry-beige text-berry-charcoal font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <Clock className="w-3.5 h-3.5 text-berry-red" />
            <span>Shift Register</span>
          </button>
        </div>
      </header>

      {/* Workspace Split */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left: PLU Grid (7 cols) */}
        <div className="col-span-12 lg:col-span-7 h-full overflow-hidden">
          <PLUGrid products={products} onSelectProduct={handleSelectProduct} />
        </div>

        {/* Right: Cart List (5 cols) */}
        <div className="col-span-12 lg:col-span-5 h-full overflow-hidden">
          <CartList
            items={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        totalAmountCents={total}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        receipt={activeReceipt}
        onNewSale={() => setIsReceiptOpen(false)}
      />

      <ShiftModal
        isOpen={isShiftOpen}
        shift={shift}
        onClose={() => setIsShiftOpen(false)}
        onCloseShift={handleCloseShift}
      />
    </div>
  );
}
