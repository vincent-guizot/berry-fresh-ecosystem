'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CORE_API_URL } from '../../lib/api';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ThermometerSnowflake,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface OrderDetail {
  order_id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  payment_method: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_amount_cents: number;
  refund_amount_cents?: number;
  refund_reason?: string;
  created_at: string;
  paid_at?: string;
  refunded_at?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    batch_code: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }>;
  items_count: number;
}

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') || '';
  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const lookupOrder = async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
      } else {
        setOrder(null);
        setErrorMsg(json.message || 'Nomor pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.');
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setErrorMsg('Gagal terhubung ke server pelacakan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder) {
      lookupOrder(initialOrder);
    }
  }, [initialOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupOrder(orderQuery);
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Alokasi stok reservasi buah akan dibebaskan.')) {
      return;
    }
    try {
      setCancelling(true);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${order.order_id || order.order_number}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dibatalkan oleh pelanggan di halaman pelacakan' }),
      });
      const json = await res.json();
      if (json.success) {
        await lookupOrder(order.order_number);
      } else {
        alert(json.message || 'Gagal membatalkan pesanan.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('Terjadi kesalahan saat membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  const getFulfillmentSteps = (status: string) => {
    const steps = [
      { key: 'PENDING_PAYMENT', label: 'Reservasi FEFO Dibuat', icon: Clock },
      { key: 'PAID', label: 'Pembayaran Dikonfirmasi', icon: CheckCircle2 },
      { key: 'PACKING', label: 'Pengemasan Rantai Dingin (2°C)', icon: Package },
      { key: 'IN_TRANSIT', label: 'Kurir Pendingin Dikirim', icon: Truck },
      { key: 'DELIVERED', label: 'Pesanan Diterima', icon: CheckCircle2 },
    ];

    const orderHierarchy: Record<string, number> = {
      PENDING_PAYMENT: 0,
      PAID: 1,
      PACKING: 2,
      IN_TRANSIT: 3,
      DELIVERED: 4,
    };

    const currentLevel = orderHierarchy[status] ?? -1;

    return (
      <div className="py-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-berry-green z-0 transition-all duration-500"
            style={{ width: `${Math.max(0, (currentLevel / 4) * 100)}%` }}
          />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentLevel >= idx;
            const isCurrent = currentLevel === idx;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 text-center px-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-berry-green text-white shadow-md'
                      : isCurrent
                      ? 'bg-berry-red text-white ring-4 ring-berry-pastel shadow-md'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] mt-2 font-bold max-w-[80px] sm:max-w-[100px] leading-tight ${
                    isCompleted ? 'text-berry-charcoal' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-berry-red mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Buah Segar</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-berry-blush/60 shadow-sm mb-8">
        <div className="flex items-center gap-2 text-berry-red mb-2">
          <Truck className="w-6 h-6" />
          <h1 className="text-2xl font-black text-berry-charcoal">Pelacakan Pesanan Buah Segar</h1>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Masukkan nomor pesanan e-commerce Anda (contoh: <code>BF-ORD-20261122-XXXX</code>) untuk memantau status cold-chain dan alokasi FEFO secara real-time.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Contoh: BF-ORD-20261122-0001"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-berry-red/20 focus:border-berry-red transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-berry-red hover:bg-berry-red/90 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lacak</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-berry-blush/60 shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-gray-100">
            <div>
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Nomor Pesanan
              </span>
              <span className="text-xl font-mono font-black text-berry-charcoal">{order.order_number}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              <span className="px-3 py-1 bg-berry-pastel text-berry-red font-bold text-xs rounded-full border border-berry-blush">
                {order.status}
              </span>
            </div>
          </div>

          {/* Special Terminal States: Cancelled or Refunded */}
          {order.status === 'CANCELLED' && (
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-2xl text-xs text-gray-800 flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Pesanan Dibatalkan</span>
                <p className="mt-0.5 text-gray-600">
                  Alokasi lot panen FEFO telah dibebaskan kembali ke gudang central. Alasan: {order.refund_reason || 'Dibatalkan oleh sistem/pelanggan'}.
                </p>
              </div>
            </div>
          )}

          {order.status === 'REFUNDED' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
              <RotateCcw className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Pesanan Di-Refund</span>
                <p className="mt-0.5 text-rose-700">
                  Dana senilai Rp {order.refund_amount_cents?.toLocaleString('id-ID')} telah dikembalikan. Alasan: {order.refund_reason || 'Permintaan pengembalian dana disetujui'}.
                </p>
              </div>
            </div>
          )}

          {/* Cold-Chain Fulfillment Progress Timeline */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-berry-charcoal flex items-center gap-1.5">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-600" />
                  <span>Alur Pengiriman Rantai Dingin Terjamin (2°C - 4°C)</span>
                </span>
                <span className="text-[11px] font-bold text-berry-green">FEFO Lot Verified</span>
              </div>
              {getFulfillmentSteps(order.status)}
            </div>
          )}

          {/* Delivery & Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* Customer & Address */}
            <div className="space-y-3 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Alamat Tujuan Pengiriman
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-berry-charcoal font-bold">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{order.customer_name}</span>
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{order.customer_phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-gray-600 pt-1">
                  <MapPin className="w-4 h-4 text-berry-red shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </div>
              </div>
            </div>

            {/* Order Items Breakdown */}
            <div className="space-y-3 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Komoditas Buah yang Dipesan
              </span>
              <div className="space-y-2 text-xs">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-700">
                      <div>
                        <span className="font-bold text-berry-charcoal">{it.product_name}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">Lot: {it.batch_code}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{it.quantity}x</span>
                        <span className="text-berry-charcoal font-bold ml-2">
                          Rp {it.line_total_cents.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">{order.items_count} Item Buah Segar</p>
                )}

                <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-extrabold text-sm text-berry-charcoal">
                  <span>Grand Total (Termasuk Ongkir):</span>
                  <span className="text-berry-red">Rp {order.total_amount_cents.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Option for Pending Orders */}
          {order.status === 'PENDING_PAYMENT' && (
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
              <div className="text-xs text-amber-900">
                <span className="font-bold block">Pesanan Belum Dibayar:</span>
                <span>Reservasi stok akan otomatis kadaluwarsa dalam 30 menit jika tidak dibayar.</span>
              </div>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan Ini'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500 font-bold">Memuat pelacakan...</div>}>
      <OrderTrackerContent />
    </Suspense>
  );
}
