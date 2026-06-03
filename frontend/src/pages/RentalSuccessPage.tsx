import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS  = 10 * 60 * 1000; // stop polling after 10 minutes

export default function RentalSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      const { data, err } = await supabase
        .from('rental_orders')
        .select('id, order_number, status, payment_status, total_amount, total_deposit, customer_name, customer_phone, start_time, end_time')
        .eq('order_number', orderNumber)
        .maybeSingle() as any;

      if (err) throw err;
      if (!data) throw new Error('Order tidak ditemukan');

      setOrder(data);

      // Stop polling once paid or active
      const paid = data.payment_status === 'paid' || ['paid', 'active'].includes(data.status);
      if (paid && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Start polling for payment status update
    pollRef.current = setInterval(async () => {
      // Stop polling after timeout
      if (Date.now() - startRef.current > POLL_TIMEOUT_MS) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        return;
      }
      await fetchOrder();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="text-red-500 mb-4 flex justify-center">
            <span className="material-symbols-outlined text-5xl">error</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-500 mb-6">{error || 'Pesanan tidak ditemukan'}</p>
          <button
            onClick={() => navigate('/dressing-room')}
            className="w-full py-3 bg-main-500 text-white rounded-xl font-bold"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isPaid   = order.payment_status === 'paid' || ['paid', 'active'].includes(order.status);
  const isActive = order.status === 'active';
  const qrValue  = `${window.location.origin}/admin/rental-scanner?order_number=${order.order_number}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className={`p-6 text-center ${isActive ? 'bg-blue-600' : isPaid ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
            <span className="material-symbols-outlined text-5xl mb-2">
              {isActive ? 'checkroom' : isPaid ? 'check_circle' : 'hourglass_empty'}
            </span>
            <h1 className="text-2xl font-black mb-1">
              {isActive
                ? 'Sedang Disewa!'
                : isPaid
                  ? 'Pembayaran Berhasil!'
                  : 'Menunggu Pembayaran'}
            </h1>
            <p className="text-white/80 font-medium">Order: {order.order_number}</p>
          </div>

          <div className="p-8">

            {/* Pending indicator */}
            {!isPaid && (
              <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-800 font-medium">
                  Menunggu konfirmasi pembayaran dari DOKU...
                </p>
              </div>
            )}

            <p className="text-center text-gray-600 mb-6">
              Hai <strong className="text-gray-900">{order.customer_name}</strong>,{' '}
              {isActive
                ? 'Barang sedang dalam masa sewa. Kembalikan tepat waktu ya!'
                : isPaid
                  ? 'Terima kasih! Tunjukkan QR di bawah kepada admin studio saat mengambil baju.'
                  : 'Selesaikan pembayaran Anda. QR pickup akan muncul setelah pembayaran berhasil.'}
            </p>

            {/* QR Code – only shown after payment confirmed */}
            {isPaid && !isActive && (
              <div className="flex flex-col items-center mb-8">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  QR Pickup
                </p>
                <p className="text-xs text-gray-400 mb-4 text-center">
                  Tunjukkan kepada admin saat mengambil baju sewaan
                </p>
                <div className="bg-white p-5 rounded-2xl shadow-md border-2 border-main-100 inline-block">
                  <QRCode value={qrValue} size={200} />
                </div>
                <div className="mt-4 bg-main-50 border border-main-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs font-bold text-main-700 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-semibold text-main-800">Menunggu Validasi Admin</p>
                </div>
              </div>
            )}

            {/* Active / Disewa state */}
            {isActive && (
              <div className="flex flex-col items-center mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center w-full">
                  <span className="material-symbols-outlined text-4xl text-blue-600 mb-2">checkroom</span>
                  <p className="text-lg font-black text-blue-800">Barang Sudah Diambil</p>
                  <p className="text-sm text-blue-600 mt-1">Status: <strong>DISEWA</strong></p>
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Nama</span>
                <span className="font-semibold text-gray-900">{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="flex justify-between border-b border-gray-200 pb-3">
                  <span className="text-gray-500">No HP</span>
                  <span className="font-semibold text-gray-900">{order.customer_phone}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Tanggal Mulai</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Tanggal Selesai</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.end_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Deposit (Refundable)</span>
                <span className="font-semibold text-yellow-700">Rp {(order.total_deposit ?? 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-900">Total Pembayaran</span>
                <span className="text-main-600">Rp {(order.total_amount ?? 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dressing-room')}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              Kembali ke Katalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
