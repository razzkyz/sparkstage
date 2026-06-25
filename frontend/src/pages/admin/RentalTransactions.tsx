import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { invokeSupabaseFunction } from '../../lib/supabaseFunctionInvoke';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ROLLERBLADE_MENU_SECTIONS, ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useToast } from '../../components/Toast';
import { LazyMotion, m } from 'framer-motion';

interface RentalStats {
  total_revenue: number;
  total_transactions: number;
  active_rentals: number;
  pending_payments: number;
  date: string;
}

interface Rental {
  id: number;
  invoice_number: string;
  customer_name: string;
  rental_date: string;
  shoe_size: string;
  duration_hours: number;
  price_per_hour: number;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'expired' | 'failed';
  rental_status: 'waiting_payment' | 'rental_active' | 'completed';
  paid_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const formatRupiah = (amount: number) =>
  `Rp ${amount.toLocaleString('id-ID')}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RentalTransactions() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const menuSections = useAdminMenuSections();

  const effectiveMenuSections = menuSections.length > 0 ? menuSections : ROLLERBLADE_MENU_SECTIONS;

  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<RentalStats>({
    queryKey: ['rental-stats-today'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_rental_stats_today');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch rentals list
  const { data: rentals, isLoading: rentalsLoading } = useQuery<Rental[]>({
    queryKey: ['rentals-list'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_rentals', {
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  // Start rental mutation
  const startRentalMutation = useMutation({
    mutationFn: async (rentalId: number) => {
      const { data, error } = await supabase.rpc('start_rental', { p_rental_id: rentalId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showToast('success', 'Rental dimulai! ⛸️');
      queryClient.invalidateQueries({ queryKey: ['rentals-list'] });
      queryClient.invalidateQueries({ queryKey: ['rental-stats-today'] });
    },
    onError: (err) => {
      showToast('error', err instanceof Error ? err.message : 'Gagal memulai rental');
    },
  });

  // Complete rental mutation
  const completeRentalMutation = useMutation({
    mutationFn: async (rentalId: number) => {
      const { data, error } = await supabase.rpc('complete_rental', { p_rental_id: rentalId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showToast('success', 'Rental selesai! Terima kasih sudah bermain 🎉');
      queryClient.invalidateQueries({ queryKey: ['rentals-list'] });
      queryClient.invalidateQueries({ queryKey: ['rental-stats-today'] });
    },
    onError: (err) => {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyelesaikan rental');
    },
  });

  // Sync payment mutation
  const syncPaymentMutation = useMutation({
    mutationFn: async (rentalId: number) => {
      const response = await invokeSupabaseFunction({
        functionName: 'sync-doku-rental-status',
        body: { rentalId },
        fallbackMessage: 'Gagal sinkronisasi status pembayaran',
      });
      return response;
    },
    onSuccess: () => {
      showToast('success', 'Status pembayaran diperbarui');
      queryClient.invalidateQueries({ queryKey: ['rentals-list'] });
      queryClient.invalidateQueries({ queryKey: ['rental-stats-today'] });
    },
    onError: () => {
      showToast('error', 'Gagal sinkronisasi status pembayaran');
    },
  });

  const filteredRentals = rentals?.filter((r) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return r.rental_status === 'rental_active';
    if (filterStatus === 'pending') return r.payment_status === 'pending';
    if (filterStatus === 'completed') return r.rental_status === 'completed';
    return true;
  }) ?? [];

  const getPaymentBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Menunggu' },
      paid: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Lunas' },
      expired: { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Kedaluwarsa' },
      failed: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500', label: 'Gagal' },
    };
    const c = config[status] ?? config.failed;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  const getRentalBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      waiting_payment: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Menunggu Bayar' },
      rental_active: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500 animate-pulse', label: 'Aktif Bermain' },
      completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Selesai' },
    };
    const c = config[status] ?? config.waiting_payment;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    );
  };

  const statCards = [
    {
      label: 'Pendapatan Hari Ini',
      value: statsLoading ? '...' : formatRupiah(stats?.total_revenue ?? 0),
      icon: 'payments',
      gradient: 'from-pink-500 to-rose-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Total Transaksi',
      value: statsLoading ? '...' : String(stats?.total_transactions ?? 0),
      icon: 'receipt_long',
      gradient: 'from-fuchsia-500 to-pink-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Rental Aktif',
      value: statsLoading ? '...' : String(stats?.active_rentals ?? 0),
      icon: 'roller_skating',
      gradient: 'from-rose-400 to-red-500',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Menunggu Pembayaran',
      value: statsLoading ? '...' : String(stats?.pending_payments ?? 0),
      icon: 'pending_actions',
      gradient: 'from-orange-400 to-amber-500',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={effectiveMenuSections}
      defaultActiveMenuId="rental-transactions"
      title="Transaksi Rental"
      subtitle="Kelola penyewaan rollerblade & status pembayaran"
      onLogout={signOut}
      headerActions={
        <button
          onClick={() => navigate('/admin/rental-order')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-transform hover:scale-[1.02] shadow-md shadow-pink-200"
          style={{ background: 'linear-gradient(135deg, #ec4899, #e11d48)' }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Buat Transaksi Baru
        </button>
      }
    >
      {/* Stats Grid */}
      <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          {statCards.map((card, idx) => (
            <m.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-5 md:p-6 bg-gradient-to-br ${card.gradient} text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 backdrop-blur-md group hover:-translate-y-1 transition-transform duration-300`}
            >
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-2xl text-white">{card.icon}</span>
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-black tracking-tight relative z-10 drop-shadow-md">{card.value}</div>
              <div className="text-xs md:text-sm text-white/90 mt-1 font-semibold relative z-10">{card.label}</div>
              {/* Decorative circles */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-lg" />
            </m.div>
          ))}
        </div>
      </LazyMotion>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap mb-6 p-2 bg-white/50 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-sm">
        {[
          { key: 'all', label: 'Semua', icon: 'list' },
          { key: 'active', label: 'Aktif', icon: 'roller_skating' },
          { key: 'pending', label: 'Pending Bayar', icon: 'pending_actions' },
          { key: 'completed', label: 'Selesai', icon: 'check_circle' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filterStatus === f.key
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 border-transparent scale-105'
                : 'bg-transparent text-gray-500 hover:bg-pink-50 hover:text-pink-600 border-transparent'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${filterStatus === f.key ? 'text-white' : ''}`}>{f.icon}</span>
            {f.label}
            {f.key !== 'all' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                filterStatus === f.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {f.key === 'active' ? rentals?.filter(r => r.rental_status === 'rental_active').length ?? 0
                  : f.key === 'pending' ? rentals?.filter(r => r.payment_status === 'pending').length ?? 0
                  : rentals?.filter(r => r.rental_status === 'completed').length ?? 0}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto px-4 py-1.5 bg-gray-100/80 rounded-lg text-xs font-bold text-gray-600 border border-gray-200/50">
          Total: {filteredRentals.length} Transaksi
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-pink-100/50 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {rentalsLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-pink-400 animate-spin">progress_activity</span>
            <span className="text-gray-500 text-sm font-medium">Memuat transaksi...</span>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-pink-500">roller_skating</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700">Belum ada transaksi</p>
              <p className="text-sm text-gray-400 mt-1">Buat transaksi rental pertama hari ini</p>
            </div>
            <button
              onClick={() => navigate('/admin/rental-order')}
              className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 transition-colors shadow-md shadow-pink-200"
            >
              + Buat Transaksi Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-pink-100/50 bg-gradient-to-r from-pink-50/50 to-transparent backdrop-blur-sm">
                  {['Invoice', 'Customer', 'Tanggal', 'Ukuran', 'Durasi', 'Total', 'Bayar', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-black text-pink-800 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50">
                {filteredRentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className={`hover:bg-gradient-to-r hover:from-pink-50/80 hover:to-transparent transition-all duration-300 group ${
                      rental.rental_status === 'rental_active' ? 'bg-blue-50/40 backdrop-blur-sm' : ''
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-pink-700 bg-white border border-pink-200 shadow-sm px-2.5 py-1 rounded-lg">
                        {rental.invoice_number}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md shadow-pink-200 group-hover:scale-110 transition-transform duration-300">
                          {rental.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{rental.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                      {formatDate(rental.rental_date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-700 bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-lg">
                        {rental.shoe_size}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-500">
                      {rental.duration_hours} jam
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-black text-pink-700">
                      {formatRupiah(rental.total_price)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getPaymentBadge(rental.payment_status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getRentalBadge(rental.rental_status)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {rental.payment_status === 'pending' && (
                          <button
                            onClick={() => syncPaymentMutation.mutate(rental.id)}
                            disabled={syncPaymentMutation.isPending}
                            title="Cek Status Pembayaran"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                          >
                            <span className={`material-symbols-outlined text-xs ${syncPaymentMutation.isPending ? 'animate-spin' : ''}`}>refresh</span>
                            Cek
                          </button>
                        )}
                        {rental.payment_status === 'paid' && rental.rental_status === 'waiting_payment' && (
                          <button
                            onClick={() => startRentalMutation.mutate(rental.id)}
                            disabled={startRentalMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">play_arrow</span>
                            Mulai
                          </button>
                        )}
                        {rental.rental_status === 'rental_active' && (
                          <button
                            onClick={() => completeRentalMutation.mutate(rental.id)}
                            disabled={completeRentalMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">check</span>
                            Selesai
                          </button>
                        )}
                        {rental.rental_status === 'completed' && (
                          <span className="text-xs text-gray-400 font-medium">
                            {formatTime(rental.completed_at)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
