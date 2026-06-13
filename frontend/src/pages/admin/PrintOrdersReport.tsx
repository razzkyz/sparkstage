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
  const [showReport, setShowReport] = useState(false);

  // Fetch all paid print orders
  const { data: printOrders = [], isLoading } = useQuery({
    queryKey: ['print-orders-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('print_orders')
        .select('id, doku_order_id, customer_name, customer_email, queue_number, amount, qty, status, paid_at, created_at')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []) as PrintOrder[];
    },
  });

  // Filter orders berdasarkan date range
  const filteredOrders = useMemo(() => {
    if (!showReport || !startDate || !endDate) {
      return [];
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return printOrders.filter((order) => {
      const orderDate = new Date(order.paid_at || order.created_at || '');
      return orderDate >= start && orderDate <= end;
    });
  }, [printOrders, startDate, endDate, showReport]);

  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((sum, o) => sum + (o.qty || 0), 0);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Hitung jumlah hari
  const totalDays = useMemo(() => {
    if (!showReport || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [startDate, endDate, showReport]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      alert('Mohon pilih tanggal mulai dan tanggal akhir');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }
    setShowReport(true);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setShowReport(false);
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
            <button
              onClick={handleGenerateReport}
              disabled={!startDate || !endDate || isLoading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Lihat Laporan'}
            </button>
            {showReport && (
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Laporan Hasil */}
        {showReport && (
          <>
            {/* Summary Box */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[24px]">print</span>
                  <h3 className="text-xl font-black text-blue-900 uppercase">Total Keseluruhan</h3>
                </div>
                <p className="text-sm text-blue-700 font-medium">
                  Periode: {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} 
                  {' s/d '}
                  {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 w-20">No</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 w-28">Queue</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-24">Foto</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-600 w-40">Amount</th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-40">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredOrders.map((order, index) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-500 font-medium">{index + 1}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-900">{order.doku_order_id || '-'}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{order.customer_name || '-'}</p>
                            <p className="text-xs text-gray-500">{order.customer_email || '-'}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-600">{order.queue_number || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-black">
                              {order.qty || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            Rp {formatCurrency(order.amount || 0)}
                          </td>
                          <td className="px-6 py-4 text-center text-xs text-gray-600">
                            {order.paid_at 
                              ? new Date(order.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                              : order.created_at
                              ? new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50 border-t-2 border-blue-300">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-right font-bold uppercase tracking-wider text-blue-900">
                          Total
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-600 text-white font-black text-base">
                            {totalQty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-2xl text-blue-600" colSpan={2}>
                          Rp {formatCurrency(totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
