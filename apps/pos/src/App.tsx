import React, { useState, useEffect, useCallback } from 'react';
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
  saveOfflineSale,
  loadOfflineSales,
  removeOfflineSale,
  saveCachedProducts,
  loadCachedProducts,
  QueuedSale,
} from './storage/posStorage';
import { Store, User, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

const CORE_API_URL = ((import.meta as any).env?.VITE_CORE_API_URL as string) || 'http://localhost:8080';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
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
    id: '10000000-0000-0000-0000-000000000002',
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
    id: '10000000-0000-0000-0000-000000000003',
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
    id: '10000000-0000-0000-0000-000000000004',
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
    id: '10000000-0000-0000-0000-000000000005',
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
    id: '10000000-0000-0000-0000-000000000006',
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
  const [products, setProducts] = useState<Product[]>(() => loadCachedProducts() || INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => loadLocalCart());
  const [shift, setShift] = useState<ShiftInfo>(
    () =>
      loadLocalShift() || {
        id: '50000000-0000-0000-0000-000000000001',
        register_id: 'd0000000-0000-0000-0000-000000000001',
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
  const [offlineQueue, setOfflineQueue] = useState<QueuedSale[]>(() => loadOfflineSales());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState('');

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Preserve cart to localStorage
  useEffect(() => {
    saveLocalCart(cart);
  }, [cart]);

  // Preserve shift to localStorage
  useEffect(() => {
    saveLocalShift(shift);
  }, [shift]);

  // Fetch live products from Core catalog API
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/catalog/products?channel=POS`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          saveCachedProducts(data.data);
        }
      }
    } catch (e) {
      // Keep cached / initial products
    }
  }, []);

  // Sync Shift from Core API
  const fetchShift = useCallback(async () => {
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/retail/shifts/current?register_code=POS-REG-01`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          setShift(data.data);
          saveLocalShift(data.data);
        }
      }
    } catch (e) {
      // Keep local shift
    }
  }, []);

  // Sync offline sales to backend with idempotency
  const syncOfflineSales = useCallback(async () => {
    const queue = loadOfflineSales();
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await fetch(`${CORE_API_URL}/api/v1/retail/sales/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          removeOfflineSale(item.receipt_number);
          syncedCount++;
        }
      } catch (err) {
        break; // Still unreachable
      }
    }

    const remaining = loadOfflineSales();
    setOfflineQueue(remaining);
    setIsSyncing(false);

    if (syncedCount > 0) {
      setSyncToast(`Successfully synced ${syncedCount} offline sale(s) to Central Database`);
      setTimeout(() => setSyncToast(''), 4000);
      fetchShift();
    }
  }, [isSyncing, fetchShift]);

  // Check connection to Core and trigger sync when connection restores
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${CORE_API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          setIsOffline(false);
          // If returning from offline, sync queued sales
          if (loadOfflineSales().length > 0) {
            syncOfflineSales();
          }
        } else {
          setIsOffline(true);
        }
      } catch (e) {
        setIsOffline(true);
      }
    };

    checkConnection();
    fetchProducts();
    fetchShift();

    const interval = setInterval(checkConnection, 8000);
    return () => clearInterval(interval);
  }, [fetchProducts, fetchShift, syncOfflineSales]);

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

    const checkoutPayload = {
      receipt_number: receiptNum,
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
    };

    // Try posting to Core API
    let savedOnline = false;
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/retail/sales/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        savedOnline = true;
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      // Save in offline queue with idempotency key
      const queuedSale: QueuedSale = {
        receipt_number: receiptNum,
        payload: checkoutPayload,
        queued_at: new Date().toISOString(),
      };
      saveOfflineSale(queuedSale);
      setOfflineQueue(loadOfflineSales());
    }

    // Update local shift metrics
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

  const handleCloseShift = async (actualCash: number) => {
    try {
      await fetch(`${CORE_API_URL}/api/v1/retail/shifts/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_cash_cents: actualCash, notes: 'End-of-shift drawer reconciliation' }),
      });
    } catch (e) {
      console.warn('Shift close recorded locally');
    }
    setShift((prev) => ({ ...prev, status: 'CLOSED' }));
    setIsShiftOpen(false);
  };

  const handleOpenShift = async (openingFloat: number) => {
    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/retail/shifts/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ register_id: shift.register_id || 'POS-REG-01', opening_cash_float_cents: openingFloat }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setShift(data.data);
          setIsShiftOpen(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Shift open recorded locally');
    }

    setShift((prev) => ({
      ...prev,
      status: 'OPEN',
      opening_cash_float_cents: openingFloat,
      total_transactions: 0,
      total_revenue_cents: 0,
      opened_at: new Date().toISOString(),
    }));
    setIsShiftOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-berry-cream overflow-hidden">
      {/* Offline Alert & Sync Banner */}
      <OfflineBanner
        isOffline={isOffline}
        pendingCount={offlineQueue.length}
        isSyncing={isSyncing}
        onSync={syncOfflineSales}
      />

      {/* Sync Success Toast */}
      {syncToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast('')} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

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
                {shift.register_code}
              </span>
              {offlineQueue.length > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {offlineQueue.length} Queue
                </span>
              )}
            </div>
            <p className="text-[11px] text-berry-charcoal/60 flex items-center gap-1 font-medium">
              <Store className="w-3 h-3 text-berry-green" /> {shift.store_name || 'Central Jakarta Store'}
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
            <span>Shift Register ({shift.status})</span>
          </button>
        </div>
      </header>

      {/* Workspace Split */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left Column: PLU Quick-Keys & Catalog (7 cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col h-full overflow-hidden bg-white rounded-3xl p-4 border border-berry-blush/40 shadow-sm">
          <PLUGrid products={products} onSelectProduct={handleSelectProduct} />
        </div>

        {/* Right Column: Active Cart & Totals (5 cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden bg-white rounded-3xl p-4 border border-berry-blush/40 shadow-sm">
          <CartList
            items={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOpenPayment={() => setIsPaymentOpen(true)}
          />
        </div>
      </main>

      {/* Tender Payment Modal */}
      <PaymentModal
        totalAmountCents={total}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* ESC/POS Thermal Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={isReceiptOpen}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setActiveReceipt(null);
        }}
      />

      {/* Cashier Shift Modal */}
      <ShiftModal
        shift={shift}
        isOpen={isShiftOpen}
        onClose={() => setIsShiftOpen(false)}
        onCloseShift={handleCloseShift}
        onOpenShift={handleOpenShift}
      />
    </div>
  );
}
