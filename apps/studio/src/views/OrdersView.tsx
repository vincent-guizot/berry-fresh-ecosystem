import React, { useState, useEffect } from 'react';
import { CORE_API_URL } from '../api';
import {
  ShoppingBag,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  ArrowRight,
} from 'lucide-react';

interface OrderItem {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_amount_cents: number;
  refund_amount_cents: number;
  refund_reason: string;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  item_count: number;
}

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<OrderItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundRestock, setRefundRestock] = useState(true);
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedStatus !== 'ALL') {
        queryParams.set('status', selectedStatus);
      }
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateFulfillment = async (orderId: string, nextStatus: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${orderId}/fulfillment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, notes: `Diperbarui via Studio Operations (${nextStatus})` }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOrders();
      } else {
        alert(json.message || 'Gagal memperbarui status fulfillment.');
      }
    } catch (err) {
      console.error('Fulfillment error:', err);
      alert('Terjadi kesalahan saat memproses status fulfillment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Batalkan pesanan ini dan lepaskan reservasi stok FEFO kembali ke gudang?')) {
      return;
    }
    try {
      setActionLoading(orderId);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dibatalkan oleh operator Studio' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOrders();
      } else {
        alert(json.message || 'Gagal membatalkan pesanan.');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Terjadi kesalahan jaringan saat membatalkan pesanan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRefundModal = (order: OrderItem) => {
    setRefundModalOrder(order);
    setRefundReason('Permintaan pengembalian dana pelanggan disetujui');
    setRefundRestock(true);
  };

  const handleSubmitRefund = async () => {
    if (!refundModalOrder) return;
    try {
      setRefundSubmitting(true);
      const res = await fetch(`${CORE_API_URL}/api/v1/commerce/orders/${refundModalOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason.trim() || 'Refund disetujui oleh Administrator Studio',
          restock: refundRestock,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRefundModalOrder(null);
        await fetchOrders();
      } else {
        alert(json.message || 'Gagal memproses refund.');
      }
    } catch (err) {
      console.error('Refund submit error:', err);
      alert('Gagal menghubungi server untuk refund.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Menunggu Pembayaran
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Terbayar (Siap Packing)
          </span>
        );
      case 'PACKING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3 h-3" /> Sedang Dikemas
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3" /> Kurir Pendingin (Dalam Perjalanan)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Selesai Terkirim
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw className="w-3 h-3" /> Di-Refund
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'Semua Pesanan' },
    { id: 'PENDING_PAYMENT', label: 'Belum Bayar' },
    { id: 'PAID', label: 'Terbayar' },
    { id: 'PACKING', label: 'Packing' },
    { id: 'IN_TRANSIT', label: 'Dalam Pengiriman' },
    { id: 'DELIVERED', label: 'Terkirim' },
    { id: 'REFUNDED', label: 'Refund' },
    { id: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-berry-red mb-1">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-xl font-extrabold text-berry-charcoal">E-Commerce Orders & Fulfillment</h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Manajemen siklus hidup pesanan toko online, reservasi lot panen FEFO, dan orkestrasi pengiriman rantai dingin.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-berry-cream border border-berry-beige hover:bg-berry-pastel text-berry-charcoal rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-berry-red' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition ${
                selectedStatus === tab.id
                  ? 'bg-berry-red text-white shadow-sm font-bold'
                  : 'bg-gray-50 text-gray-600 hover:bg-berry-cream hover:text-berry-red border border-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor pesanan (BF-ORD-...), nama pelanggan, atau nomor telepon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-berry-red/20 focus:border-berry-red transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-berry-charcoal hover:bg-black text-white rounded-xl text-xs font-bold transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
          <RefreshCw className="w-8 h-8 text-berry-red animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-600">Memuat data pesanan e-commerce...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-berry-cream rounded-2xl flex items-center justify-center mx-auto mb-3 text-berry-red">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-berry-charcoal text-base mb-1">Tidak Ada Pesanan Ditemukan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Belum ada pesanan dengan kriteria filter yang dipilih. Silakan ubah filter atau lakukan checkout dari web Shop.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isProcessing = actionLoading === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-gray-300 transition overflow-hidden"
              >
                {/* Order Header Banner */}
                <div className="bg-gray-50/80 px-6 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-berry-charcoal tracking-tight">
                      {order.order_number}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      {new Date(order.created_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[11px] font-bold text-berry-green bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {order.payment_method}
                    </span>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Order Body Details */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                      Penerima & Alamat
                    </span>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-berry-charcoal">{order.customer_name}</p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{order.customer_phone || '-'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="w-4 h-4 text-berry-red mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-600 leading-relaxed">{order.delivery_address}</p>
                    </div>
                  </div>

                  {/* Financial & Items Summary */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                      Rincian Pembayaran
                    </span>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Jumlah Komoditas:</span>
                        <span className="font-bold text-berry-charcoal">{order.item_count} Item</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Ongkir Rantai Dingin:</span>
                        <span className="font-semibold text-berry-charcoal">
                          Rp {order.delivery_fee_cents.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-berry-charcoal pt-1 border-t border-gray-200 font-extrabold text-sm">
                        <span>Grand Total:</span>
                        <span className="text-berry-red">Rp {order.total_amount_cents.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {order.refund_amount_cents > 0 && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <span className="font-bold block">Riwayat Refund:</span>
                        <span>
                          Rp {order.refund_amount_cents.toLocaleString('id-ID')} — {order.refund_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operational Fulfillment Actions */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">
                      Aksi Operasional
                    </span>

                    <div className="space-y-2">
                      {order.status === 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 rounded-xl text-xs font-bold transition border border-gray-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Batalkan Reservasi</span>
                        </button>
                      )}

                      {order.status === 'PAID' && (
                        <button
                          onClick={() => handleUpdateFulfillment(order.id, 'PACKING')}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Mulai Packing Buah</span>
                        </button>
                      )}

                      {order.status === 'PACKING' && (
                        <button
                          onClick={() => handleUpdateFulfillment(order.id, 'IN_TRANSIT')}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Kirim ke Kurir Dingin</span>
                        </button>
                      )}

                      {order.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleUpdateFulfillment(order.id, 'DELIVERED')}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tandai Terkirim Selesai</span>
                        </button>
                      )}

                      {/* Refund Trigger for Paid / Fulfillment stages */}
                      {['PAID', 'PACKING', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
                        <button
                          onClick={() => handleOpenRefundModal(order)}
                          disabled={isProcessing}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Proses Refund Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Refund Interaktif dengan Opsi Restock vs Spoilage */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-berry-charcoal">
                  Refund Pesanan {refundModalOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setRefundModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Pengembalian Dana: Rp {refundModalOrder.total_amount_cents.toLocaleString('id-ID')}</span>
              </div>
              <p>
                Dana senilai total pesanan akan dicatat sebagai transaksi pengembalian dana kepada pelanggan.
              </p>
            </div>

            {/* Restock vs Spoilage Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-berry-charcoal block">
                Perlakuan Stok Fisik Komoditas Buah:
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div
                  onClick={() => setRefundRestock(true)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    refundRestock
                      ? 'border-berry-green bg-emerald-50/50 text-emerald-950 font-bold shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block mb-1">📦 Restock ke Gudang</span>
                  <p className="text-[11px] font-normal text-gray-500 leading-tight">
                    Kembalikan saldo buah ke lot batch aktif gudang (gerakan stok <code>RETURN</code>).
                  </p>
                </div>

                <div
                  onClick={() => setRefundRestock(false)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    !refundRestock
                      ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block mb-1">🗑️ Tulis Buah Rusak (Spoilage)</span>
                  <p className="text-[11px] font-normal text-gray-500 leading-tight">
                    Buang buah rusak dan catat susut sanitasi pangan (gerakan stok <code>SPOILAGE</code>).
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-berry-charcoal block">Alasan Refund:</label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Tuliskan alasan pengembalian dana..."
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                disabled={refundSubmitting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitRefund}
                disabled={refundSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {refundSubmitting ? 'Memproses...' : 'Konfirmasi Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
