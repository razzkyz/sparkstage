import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS, CASHIER_MENU_SECTIONS } from '../../constants/adminMenu';
import { getMenuSectionsByRole } from '../../utils/auth';
import { useCashierSalesStats } from '../../hooks/useCashierSalesStats';
import DashboardStatSkeleton from '../../components/skeletons/DashboardStatSkeleton';
import { useToast } from '../../components/Toast';
import { LazyMotion, m } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import type { AdminMenuSection } from '../../components/AdminLayout';

const CashierDashboard = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { data: stats, error, isLoading } = useCashierSalesStats();
  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>(CASHIER_MENU_SECTIONS);

  useEffect(() => {
    const loadMenuSections = async () => {
      const sections = await getMenuSectionsByRole(user?.id);
      setMenuSections(sections);
    };
    loadMenuSections();
  }, [user?.id]);

  useEffect(() => {
    if (error) {
      showToast('error', error instanceof Error ? error.message : 'Gagal memuat data penjualan');
    }
  }, [error, showToast]);

  const getUserInitials = () => {
    if (!user?.email) return 'K';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="cashier-dashboard"
      title="Dashboard Penjualan"
      subtitle="Lihat total penjualan tiket dan produk"
      onLogout={signOut}
    >
      {/* Welcome Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-full bg-[#ff4b86] flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
            {getUserInitials()}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-gray-900 truncate">Selamat Datang, Kasir</h3>
            <p className="text-sm text-gray-500 truncate">Panel Penjualan Spark</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-sm text-gray-700">logout</span>
          Keluar
        </button>
      </div>

      <LazyMotion features={() => import('framer-motion').then((mod) => mod.domAnimation)}>
        {/* Tiket Sales Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-900">Penjualan Tiket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <DashboardStatSkeleton key={`ticket-${index}`} />)
              : [
                {
                  label: 'Tiket Terjual Hari Ini',
                  value: stats?.ticketSalesToday ?? 0,
                  subtext: `Rp ${formatCurrency(stats?.ticketRevenueToday ?? 0)}`,
                },
                {
                  label: 'Revenue Tiket Hari Ini',
                  value: `Rp ${formatCurrency(stats?.ticketRevenueToday ?? 0)}`,
                  subtext: `${stats?.ticketSalesToday ?? 0} tiket`,
                },
                {
                  label: 'Tiket Terjual Bulan Ini',
                  value: stats?.ticketSalesMonth ?? 0,
                  subtext: `Rp ${formatCurrency(stats?.ticketRevenueMonth ?? 0)}`,
                },
                {
                  label: 'Revenue Tiket Bulan Ini',
                  value: `Rp ${formatCurrency(stats?.ticketRevenueMonth ?? 0)}`,
                  subtext: `${stats?.ticketSalesMonth ?? 0} tiket`,
                },
              ].map((item, index) => (
                <m.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{item.subtext}</p>
                </m.div>
              ))}
          </div>
        </div>

        {/* Product Sales Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-900">Penjualan Produk</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <DashboardStatSkeleton key={`product-${index}`} />)
              : [
                {
                  label: 'Produk Terjual Hari Ini',
                  value: stats?.productSalesToday ?? 0,
                  subtext: `Rp ${formatCurrency(stats?.productRevenueToday ?? 0)}`,
                },
                {
                  label: 'Revenue Produk Hari Ini',
                  value: `Rp ${formatCurrency(stats?.productRevenueToday ?? 0)}`,
                  subtext: `${stats?.productSalesToday ?? 0} produk`,
                },
                {
                  label: 'Produk Terjual Bulan Ini',
                  value: stats?.productSalesMonth ?? 0,
                  subtext: `Rp ${formatCurrency(stats?.productRevenueMonth ?? 0)}`,
                },
                {
                  label: 'Revenue Produk Bulan Ini',
                  value: `Rp ${formatCurrency(stats?.productRevenueMonth ?? 0)}`,
                  subtext: `${stats?.productSalesMonth ?? 0} produk`,
                },
              ].map((item, index) => (
                <m.div
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (index + 4) * 0.05 }}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                  <p className="text-2xl md:text-3xl font-black text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{item.subtext}</p>
                </m.div>
              ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-black text-gray-900 mb-6">Ringkasan Total Penjualan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700">Hari Ini</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Tiket:</span>
                  <span className="font-black text-gray-900">{stats?.ticketSalesToday ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Revenue Tiket:</span>
                  <span className="font-black text-gray-900">Rp {formatCurrency(stats?.ticketRevenueToday ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Produk:</span>
                  <span className="font-black text-gray-900">{stats?.productSalesToday ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Revenue Produk:</span>
                  <span className="font-black text-gray-900">Rp {formatCurrency(stats?.productRevenueToday ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-gray-700">Total Revenue:</span>
                  <span className="text-xl font-black text-[#ff4b86]">
                    Rp {formatCurrency((stats?.ticketRevenueToday ?? 0) + (stats?.productRevenueToday ?? 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700">Bulan Ini</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Tiket:</span>
                  <span className="font-black text-gray-900">{stats?.ticketSalesMonth ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Revenue Tiket:</span>
                  <span className="font-black text-gray-900">Rp {formatCurrency(stats?.ticketRevenueMonth ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Produk:</span>
                  <span className="font-black text-gray-900">{stats?.productSalesMonth ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Revenue Produk:</span>
                  <span className="font-black text-gray-900">Rp {formatCurrency(stats?.productRevenueMonth ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-gray-700">Total Revenue:</span>
                  <span className="text-xl font-black text-[#ff4b86]">
                    Rp {formatCurrency((stats?.ticketRevenueMonth ?? 0) + (stats?.productRevenueMonth ?? 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LazyMotion>
    </AdminLayout>
  );
};

export default CashierDashboard;
