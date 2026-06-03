import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCode from 'react-qr-code';

export default function RentalSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) return;
      try {
        const { data, error } = await supabase
          .from('rental_orders')
          .select('id, order_number, status, payment_status, total, deposit_amount, customer_name, rental_start_time, rental_end_time')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Order not found');
        
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
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

  const isPaid = order.payment_status === 'paid' || order.status === 'paid';
  const qrValue = `${window.location.origin}/admin/rental-scanner?order_number=${order.order_number}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`p-6 text-center ${isPaid ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
            <span className="material-symbols-outlined text-5xl mb-2">
              {isPaid ? 'check_circle' : 'hourglass_empty'}
            </span>
            <h1 className="text-2xl font-black mb-1">
              {isPaid ? 'Pembayaran Berhasil!' : 'Menunggu Pembayaran'}
            </h1>
            <p className="text-white/80 font-medium">Order: {order.order_number}</p>
          </div>

          <div className="p-8">
            <p className="text-center text-gray-600 mb-6">
              Hai <strong className="text-gray-900">{order.customer_name}</strong>,{' '}
              {isPaid 
                ? 'Terima kasih! Pesanan sewa Anda sudah kami terima.' 
                : 'Selesaikan pembayaran Anda menggunakan link DOKU sebelumnya.'}
            </p>

            {/* QR Code */}
            {isPaid && (
              <div className="flex flex-col items-center mb-8">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Pickup QR</p>
                <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 inline-block">
                  <QRCode value={qrValue} size={200} />
                </div>
                <p className="text-xs text-gray-500 text-center mt-4 px-4">
                  Tunjukkan kode QR ini kepada admin studio saat Anda mengambil baju sewaan.
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Tanggal Mulai</span>
                <span className="font-semibold text-gray-900">
                  {new Date(order.rental_start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-3">
                <span className="text-gray-500">Deposit (Refundable)</span>
                <span className="font-semibold text-yellow-700">Rp {order.deposit_amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-gray-900">Total Pembayaran</span>
                <span className="text-main-600">Rp {order.total.toLocaleString('id-ID')}</span>
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
