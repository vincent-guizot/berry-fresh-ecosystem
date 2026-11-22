'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../lib/cartContext';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  QrCode,
  CheckCircle,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Copy,
  XCircle,
} from 'lucide-react';
import { CORE_API_URL } from '../../lib/api';

export default function CheckoutPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotalCents } = useCart();
  const deliveryFee = 25000; // Rp 25,000 cold-chain courier delivery
  const estimatedTotal = subtotalCents + (items.length > 0 ? deliveryFee : 0);

  const [form, setForm] = useState({
    name: 'Siti Rahma',
    phone: '081234567890',
    email: 'siti@example.com',
    address: 'Jl. Senopati No. 42, Kebayoran Baru',
    city: 'Jakarta Selatan',
    postalCode: '12190',
    paymentMethod: 'QRIS',
  });

  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderCancelled, setOrderCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!orderConfirmed) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Alokasi reservasi FEFO akan dibebaskan kembali.')) {
      return;
    }
    try {
      setCancelling(true);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${orderConfirmed.order_id || orderConfirmed.order_number}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dibatalkan oleh pelanggan di halaman checkout' }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderCancelled(true);
      } else {
        alert(data.message || 'Gagal membatalkan pesanan.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('Terjadi kesalahan jaringan saat membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email,
      delivery_address: form.address,
      city: form.city,
      postal_code: form.postalCode,
      payment_method: form.paymentMethod,
      items: items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Checkout failed with status ${res.status}`);
      }

      setOrderConfirmed(data.data);
      // Only clear cart after confirmed order creation!
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout connection error. Please verify backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderConfirmed) return;
    setPaying(true);
    try {
      const targetID = orderConfirmed.order_id || orderConfirmed.order_number;
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${targetID}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
      }
    } catch (e) {
      setPaymentSuccess(true);
    } finally {
      setPaying(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-berry-charcoal mb-1">
          {paymentSuccess ? 'Order Paid & Dispatched!' : 'Order Placed Successfully!'}
        </h2>
        <p className="text-xs text-gray-500 mb-6 font-mono">Order Number: {orderConfirmed.order_number}</p>

        <div className="bg-white p-6 rounded-3xl border border-berry-blush shadow-sm mb-6 space-y-4">
          {orderConfirmed.payment_method === 'QRIS' ? (
            <div className="text-center">
              <span className="text-xs text-gray-400 block mb-1">Scan Dynamic QRIS to Pay</span>
              <div className="w-48 h-48 mx-auto bg-berry-cream p-3 rounded-2xl border border-berry-beige flex items-center justify-center">
                <img src={orderConfirmed.qr_code_url} alt="QRIS Code" className="w-full h-full object-contain" />
              </div>
              <div className="text-2xl font-black text-berry-red font-mono mt-3">
                Rp {orderConfirmed.total_amount_cents.toLocaleString('id-ID')}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <span className="text-xs text-gray-400 block">Transfer to Bank Virtual Account</span>
              <div className="p-3 bg-berry-cream rounded-2xl border border-berry-beige flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500">{orderConfirmed.bank_name || 'BCA Virtual Account'}</div>
                  <div className="text-base font-black font-mono text-berry-charcoal">
                    {orderConfirmed.virtual_account}
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(orderConfirmed.virtual_account)}
                  className="p-2 hover:bg-white rounded-lg text-gray-500 transition"
                  title="Copy VA"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-black text-berry-red font-mono mt-2">
                Rp {orderConfirmed.total_amount_cents.toLocaleString('id-ID')}
              </div>
            </div>
          )}

          {/* Payment Status Pill */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                orderCancelled
                  ? 'bg-rose-100 text-rose-800'
                  : paymentSuccess
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              Status: {orderCancelled ? 'CANCELLED • RESERVATIONS RELEASED' : paymentSuccess ? 'PAID • RESERVATIONS COMMITTED' : 'PENDING PAYMENT (30 min)'}
            </span>
          </div>

          {!paymentSuccess && !orderCancelled && (
            <div className="space-y-2">
              <button
                onClick={handleConfirmPayment}
                disabled={paying || cancelling}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                {paying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>Simulate Instant Payment Confirmation</span>
              </button>

              <button
                onClick={handleCancelOrder}
                disabled={paying || cancelling}
                className="w-full py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-gray-200"
              >
                {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Batalkan Pesanan (Release Hold)</span>
              </button>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl text-left border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Your order has been allocated to Central Warehouse. The oldest active Grade A lot (FEFO) has been reserved and will be packed in 2°C cold-chain.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/track?order=${orderConfirmed.order_number}`}
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-berry-charcoal text-white text-xs font-bold rounded-xl shadow hover:bg-black transition"
          >
            <span>Lacak Status Pesanan</span>
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-berry-red text-white text-xs font-bold rounded-xl shadow hover:bg-berry-red/90 transition"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/catalog" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-berry-red mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </Link>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Customer Info Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-berry-blush/40 shadow-sm">
          <h2 className="text-xl font-extrabold text-berry-charcoal mb-4">Refrigerated Courier Delivery</h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-berry-charcoal block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
                />
              </div>
              <div>
                <label className="font-bold text-berry-charcoal block mb-1">WhatsApp / Phone</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-berry-charcoal block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
              />
            </div>

            <div>
              <label className="font-bold text-berry-charcoal block mb-1">Street Address</label>
              <textarea
                required
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-berry-charcoal block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
                />
              </div>
              <div>
                <label className="font-bold text-berry-charcoal block mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full p-2.5 bg-berry-cream/40 border border-gray-200 rounded-xl focus:outline-none focus:border-berry-red"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="font-bold text-berry-charcoal block mb-2">Payment Rail</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'QRIS' })}
                  className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs border-2 transition ${
                    form.paymentMethod === 'QRIS'
                      ? 'border-berry-red bg-berry-pastel text-berry-red shadow-sm'
                      : 'border-gray-200 text-berry-charcoal hover:bg-berry-cream'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Dynamic QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'BANK_TRANSFER' })}
                  className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs border-2 transition ${
                    form.paymentMethod === 'BANK_TRANSFER'
                      ? 'border-berry-red bg-berry-pastel text-berry-red shadow-sm'
                      : 'border-gray-200 text-berry-charcoal hover:bg-berry-cream'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bank Virtual Account</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full py-3.5 bg-berry-red text-white font-bold rounded-xl shadow-lg hover:bg-berry-red/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-4 text-xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reserving FEFO Lot & Generating Order...</span>
                </>
              ) : (
                <span>Confirm & Pay Rp {estimatedTotal.toLocaleString('id-ID')}</span>
              )}
            </button>
          </form>
        </div>

        {/* Right: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-berry-blush/40 shadow-sm">
            <h3 className="font-extrabold text-sm text-berry-charcoal mb-4">Cart Summary ({items.length} items)</h3>

            {items.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Your basket is empty</p>
            ) : (
              <div className="divide-y divide-gray-100 space-y-3">
                {items.map((i) => (
                  <div key={i.product.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                    <div className="flex-1 pr-3">
                      <div className="font-bold text-berry-charcoal truncate">{i.product.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {i.quantity} × Rp {i.product.price_cents.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(i.product.id, i.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-4 text-center">{i.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i.product.id, i.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(i.product.id)}
                        className="text-gray-300 hover:text-rose-500 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">Rp {subtotalCents.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>2°C Express Cold Delivery:</span>
                    <span className="font-mono font-bold">Rp {deliveryFee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-berry-red pt-2 border-t border-gray-100">
                    <span>Estimated Total:</span>
                    <span className="font-mono">Rp {estimatedTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
