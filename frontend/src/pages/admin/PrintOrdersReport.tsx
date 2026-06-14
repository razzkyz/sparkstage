import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS, PRINT_MENU_SECTIONS } from '../../constants/adminMenu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';

type PrintOrder = {
  id: string;
  doku_order_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  queue_number: string | null;
  amount: number | null;
  qty: number | null;
  status: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export default function PrintOrdersReport() {
  const { signOut } = useAuth();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch all paid print orders
  const { data: printOrders = [], isLoading } = useQuery({
    queryKey: ['print-orders-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('print_orders')
        .select('id, doku_order_id, customer_name, customer_email, queue_number, amount, qty, status, paid_at, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching print orders:', error);
        throw error;
      }
      
      console.log('Print orders fetched:', data?.length || 0);
      return (data || []) as PrintOrder[];
    },
  });

  // Filter orders berdasarkan date range
  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) {
      return printOrders;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return printOrders.filter((order) => {
      // Use created_at as fallback if paid_at is not available
      const dateStr = order.paid_at || order.created_at;
      if (!dateStr) return false;
      
      try {
        const orderDate = new Date(dateStr);
        return orderDate >= start && orderDate <= end;
      } catch (e) {
        console.error('Invalid date:', dateStr, e);
        return false;
      }
    });
  }, [printOrders, startDate, endDate]);

  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + (o.qty || 0), 0);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Hitung jumlah hari
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) {
      if (printOrders.length === 0) return 0;
      // if all time, calculate days between first and last order
      const sorted = [...printOrders].sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
      const first = new Date(sorted[0].created_at || '');
      const last = new Date(sorted[sorted.length - 1].created_at || '');
      const diffTime = Math.abs(last.getTime() - first.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [printOrders, startDate, endDate]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={PRINT_MENU_SECTIONS}
      defaultActiveMenuId="print-orders"
      title="Laporan Print"
      subtitle="Laporan penjualan cetak foto"
      onLogout={signOut}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Form Input Tanggal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[24px]">calendar_month</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Pilih Periode Laporan</h3>
              <p className="text-sm text-gray-500">Pilih tanggal untuk melihat laporan cetak foto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {(startDate || endDate) && (
              <button
                onClick={handleReset}
                className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Laporan Hasil */}
        <div className="space-y-6">
          <>
            {/* Summary Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[24px]">print</span>
                  <h3 className="text-xl font-black text-blue-900 uppercase">Total Keseluruhan</h3>
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  {startDate && endDate ? (
                    <>
                      Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} 
                      {' s/d '}
                      {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </>
                  ) : (
                    'Semua Periode (Dari awal s/d sekarang)'
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center bg-white rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Hari</p>
                  <p className="text-2xl font-black text-blue-900">{totalDays}</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Order</p>
                  <p className="text-2xl font-black text-blue-900">{totalOrders}</p>
                </div>
                <div className="text-center bg-white rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Foto</p>
                  <p className="text-2xl font-black text-blue-900">{totalQty}</p>
                </div>
                <div className="text-center bg-blue-600 rounded-xl p-4">
                  <p className="text-xs text-white font-semibold uppercase mb-1">Total</p>
                  <p className="text-xl font-black text-white">Rp {formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Tabel Orders */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">
                  Rincian Print Orders ({totalOrders} Transaksi)
                </h3>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Print
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <span className="material-symbols-outlined text-4xl text-gray-400">print_disabled</span>
                  </div>
                  <p className="text-gray-500 font-medium">Tidak ada print order dalam periode ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['No', 'Doku Order ID', 'Nama Customer', 'Email', 'Amount', 'Status', 'Tanggal Bayar', 'Dibuat'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredOrders.map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{p.doku_order_id ?? '-'}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-xs">{p.customer_name ?? '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{p.customer_email ?? '-'}</td>
                          <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">Rp {formatCurrency(p.amount || 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              p.status === 'paid' ? 'bg-green-100 text-green-700' :
                              p.status === 'PRINTED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>{p.status ?? '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {p.paid_at ? new Date(p.paid_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {p.created_at ? new Date(p.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900 text-xs uppercase">
                          Total
                        </td>
                        <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap text-sm" colSpan={4}>
                          Rp {formatCurrency(totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        </div>
      </div>
    </AdminLayout>
  );
}
