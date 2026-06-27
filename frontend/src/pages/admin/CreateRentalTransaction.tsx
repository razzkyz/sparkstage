import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeSupabaseFunction } from '../../lib/supabaseFunctionInvoke';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ROLLERBLADE_MENU_SECTIONS, ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useToast } from '../../components/Toast';
import { LazyMotion, m } from 'framer-motion';
import { loadDokuCheckoutScript, openDokuCheckout, resetDokuCheckoutState, storePaymentContext } from '../../utils/dokuCheckout';

interface CreateRentalRequest {
  customerName: string;
  customerPhone?: string;
  rentalDate: string;
  shoeSize: string;
  durationHours: number;
}

interface CreateRentalResponse {
  payment_provider: string;
  payment_url: string;
  payment_sdk_url: string;
  payment_due_date: string | null;
  order_number: string;
  order_id: number;
}

const PRICE_PER_HOUR = 85000;
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

const formatRupiah = (amount: number) =>
  `Rp ${amount.toLocaleString('id-ID')}`;

export default function CreateRentalTransaction() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const menuSections = useAdminMenuSections();

  const effectiveMenuSections = menuSections.length > 0 ? menuSections : ROLLERBLADE_MENU_SECTIONS;

  // Load DOKU script on mount
  useEffect(() => {
    loadDokuCheckoutScript();
  }, []);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const getTodayWIB = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const [rentalDate, setRentalDate] = useState(getTodayWIB());
  const [shoeSize, setShoeSize] = useState('');
  const [durationHours, setDurationHours] = useState(1);

  const createRentalMutation = useMutation({
    mutationFn: async (request: CreateRentalRequest) => {
      const response = await invokeSupabaseFunction<CreateRentalResponse>({
        functionName: 'create-doku-rental-checkout',
        body: request,
        fallbackMessage: 'Gagal membuat transaksi rental',
      });
      return response;
    },
    onSuccess: (data) => {
      // Setup DOKU - same flow as ticket checkout
      resetDokuCheckoutState();
      storePaymentContext('rental', data.order_number, data.payment_url);
      
      // Open DOKU popup (QRIS, VA, GoPay, etc.)
      openDokuCheckout(data.payment_url, data.order_number);
      
      queryClient.invalidateQueries({ queryKey: ['rentals-list'] });
      queryClient.invalidateQueries({ queryKey: ['rental-stats-today'] });
      showToast('success', `Transaksi ${data.order_number} berhasil. Selesaikan pembayaran!`);
      
      // Redirect to list so admin can monitor
      navigate('/admin/rental-transactions');
    },
    onError: (err) => {
      showToast('error', err instanceof Error ? err.message : 'Gagal membuat transaksi');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !shoeSize || durationHours <= 0) {
      showToast('error', 'Harap isi semua field yang wajib diisi');
      return;
    }
    createRentalMutation.mutate({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      rentalDate,
      shoeSize,
      durationHours,
    });
  };

  // Load DOKU checkout SDK
  useEffect(() => {
    if (paymentData && showPaymentModal) {
      const script = document.createElement('script');
      script.src = paymentData.checkoutSdkUrl;
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.doku && paymentData.paymentUrl) {
          // @ts-ignore
          window.doku.loadCheckout({ url: paymentData.paymentUrl });
        }
      };
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [paymentData, showPaymentModal]);

  const totalPrice = PRICE_PER_HOUR * durationHours;

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={effectiveMenuSections}
      defaultActiveMenuId="rental-order"
      title="Buat Transaksi Rental"
      subtitle="Input data pelanggan untuk mulai rental"
      onLogout={signOut}
    >
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/admin/rental-transactions')}
          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-bold mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali ke Daftar Transaksi
        </button>

        <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>
          <m.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] border border-pink-100/60 overflow-hidden"
          >
            <div className="px-6 py-8 md:px-10 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 text-white relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl text-white drop-shadow-md">roller_skating</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight drop-shadow-md">Form Rental Rollerblade</h2>
                  <p className="text-sm font-medium text-pink-100 mt-1">Isi data customer & durasi sewa dengan lengkap</p>
                </div>
              </div>
            </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Nama Customer <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">person</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50/50"
                    placeholder="Masukkan nama lengkap"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  No. Telepon <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">phone</span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50/50"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-gray-700">
                      Tanggal Rental <span className="text-pink-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setRentalDate(getTodayWIB())}
                      className="text-[11px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded transition-colors border border-pink-200"
                    >
                      Hari Ini
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">calendar_today</span>
                    <input
                      type="date"
                      value={rentalDate}
                      onChange={(e) => setRentalDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Ukuran Sepatu <span className="text-pink-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">straighten</span>
                    <select
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none bg-gray-50/50"
                      required
                    >
                      <option value="">Pilih ukuran</option>
                      {SHOE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Durasi Sewa <span className="text-pink-500">*</span>
                  <span className="ml-1 text-gray-400 font-normal">({formatRupiah(PRICE_PER_HOUR)}/jam)</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DURATION_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-3 rounded-xl text-sm font-black transition-all duration-300 border-2 ${
                        durationHours === h
                          ? 'border-pink-500 bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50 scale-105'
                          : 'border-pink-100/80 bg-white/50 text-gray-500 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600'
                      }`}
                    >
                      {h} Jam
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-pink-200 shadow-sm mt-8">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-pink-800 uppercase tracking-wider mb-1">Total Tagihan</p>
                    <p className="text-sm text-pink-600 font-medium">{durationHours} jam × {formatRupiah(PRICE_PER_HOUR)}</p>
                  </div>
                  <p className="text-3xl font-black text-pink-700">{formatRupiah(totalPrice)}</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createRentalMutation.isPending}
              className="w-full py-4 mt-6 rounded-2xl text-lg font-black text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-300/40 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(236,72,153,0.25)] relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e, #d946ef)', backgroundSize: '200% auto' }}
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -translate-x-full skew-x-12" />
              {createRentalMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  Sedang Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">qr_code</span>
                  Lanjutkan Pembayaran QRIS
                </>
              )}
            </button>
          </form>
          </m.div>
        </LazyMotion>
      </div>

    </AdminLayout>
  );
}
