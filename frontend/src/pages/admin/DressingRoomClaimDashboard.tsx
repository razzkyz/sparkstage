import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS, DRESSING_ROOM_ADMIN_MENU_SECTIONS, OWNER_MENU_SECTIONS, PRINT_MENU_SECTIONS, ADMIN_MENU_SECTIONS } from '../../constants/adminMenu';
import { useProductOrders } from '../../hooks/useProductOrders';

import { lookupUserRole } from '../../auth/adminRole';

import ClaimTab from './retail/ClaimTab';
import ReportTab from './retail/ReportTab';

export default function DressingRoomClaimDashboard() {
  const { signOut, user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'claim' | 'report'>('claim');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get user role
  useEffect(() => {
    (async () => {
      const result = await lookupUserRole(user?.id);
      if (result.ok) {
        setUserRole(result.role ?? null);
        // Auto-redirect owner/print to report tab
        if (result.role === 'owner' || result.role === 'print') {
          setActiveTab('report');
        }
      }
    })();
  }, [user?.id]);
  
  // Ambil data pesanan selesai dari hook useProductOrders
  // Sama persis dengan RetailDashboard — SEMUA pesanan, tidak difilter per kategori
  const { data: orderData, isLoading: isLoadingOrders } = useProductOrders();
  // Untuk tab Klaim: pesanan retail yang sudah dibayar (paid) dan sudah dikonfirmasi (completed)
  // Pesanan yang masih pending_pickup TIDAK dimunculkan sebelum dikonfirmasi di halaman Product Orders
  const completedOrders = useMemo(() => {
    if (!orderData?.orders) return [];
    return orderData.orders.filter(o =>
      o.payment_status === 'paid' && 
      o.pickup_status === 'completed'
    );
  }, [orderData]);

  // Untuk tab Laporan: hanya order yang sudah paid DAN ada nama staffnya khusus dari Dressing Room
  const reportOrders = useMemo(() => {
    if (!orderData?.orders) return [];
    return orderData.orders.filter(o =>
      o.payment_status === 'paid' && !!o.sales_staff_name && o.sales_staff_name.endsWith(' (Dressing)')
    );
  }, [orderData]);

  // Hitung badge (unclaimed count) - completed orders without staff name
  const unclaimedCount = useMemo(() => {
    return completedOrders.filter(o => !o.sales_staff_name).length;
  }, [completedOrders]);

  const menuSections = 
    userRole === 'owner' ? OWNER_MENU_SECTIONS : 
    userRole === 'print' ? PRINT_MENU_SECTIONS : 
    (userRole === 'admin' || userRole === 'super_admin' || userRole === 'devops') ? ADMIN_MENU_SECTIONS :
    DRESSING_ROOM_ADMIN_MENU_SECTIONS;

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dressing-room-claim"
      title="Dressing Room Sales Back Office"
      subtitle="Klaim dan buat laporan riwayat transaksi produk dressing room"
      onLogout={signOut}
    >
      <div className="mb-6 flex flex-col sm:flex-row gap-2 border-b border-gray-200 pb-4">
        {userRole !== 'owner' && userRole !== 'print' && (
          <button
            onClick={() => setActiveTab('claim')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
              activeTab === 'claim' 
                ? 'bg-[#ff4b86] text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            Klaim Penjualan
            {unclaimedCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {unclaimedCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'report' 
              ? 'bg-[#ff4b86] text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">leaderboard</span>
          Laporan Staff
        </button>

        <div className="ml-auto w-full sm:w-auto mt-3 sm:mt-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk terjual..."
            className="pl-3 pr-3 py-2 w-full sm:w-64 rounded-2xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#ff4b86] transition-colors"
          />
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'claim' && <ClaimTab orders={completedOrders} isLoading={isLoadingOrders} searchQuery={searchQuery} setSearchQuery={setSearchQuery} allowedStatuses={['completed']} claimSuffix=" (Dressing)" />}
        {activeTab === 'report' && <ReportTab orders={reportOrders} isLoading={isLoadingOrders} />}
      </div>
    </AdminLayout>
  );
}
