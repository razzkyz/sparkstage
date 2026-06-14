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

type DailySummary = {
  date: string;         // 'YYYY-MM-DD'
  displayDate: string;  // formatted for display
  orders: number;
  qty: number;
  revenue: number;
};

export default function PrintOrdersReport() {
  const { signOut } = useAuth();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // === Laporan Harian Modal state ===
  const [showLaporanModal, setShowLaporanModal] = useState(false);
  const [laporanStart, setLaporanStart] = useState<string>('');
  const [laporanEnd, setLaporanEnd] = useState<string>('');
  const [laporanSubmitted, setLaporanSubmitted] = useState(false);
  const [laporanError, setLaporanError] = useState('');

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

      return (data || []) as PrintOrder[];
    },
  });

  // ---- Main table filter ----
  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) return printOrders;
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return printOrders.filter((o) => {
      const d = new Date(o.paid_at || o.created_at || '');
      return d >= start && d <= end;
    });
  }, [printOrders, startDate, endDate]);

  const totalOrders = filteredOrders.length;
  const totalQty = filteredOrders.reduce((s, o) => s + (o.qty || 0), 0);
  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.amount || 0), 0);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) {
      if (printOrders.length === 0) return 0;
      const sorted = [...printOrders].sort((a, b) =>
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );
      const diff = new Date(sorted[sorted.length - 1].created_at || '').getTime() - new Date(sorted[0].created_at || '').getTime();
      return Math.ceil(diff / 86400000) + 1;
    }
    return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  }, [printOrders, startDate, endDate]);

  // ---- Laporan Harian (modal) ----
  const dailySummary = useMemo<DailySummary[]>(() => {
    if (!laporanSubmitted || !laporanStart || !laporanEnd) return [];

    const start = new Date(laporanStart); start.setHours(0, 0, 0, 0);
    const end = new Date(laporanEnd); end.setHours(23, 59, 59, 999);

    const inRange = printOrders.filter((o) => {
      const d = new Date(o.paid_at || o.created_at || '');
      return d >= start && d <= end;
    });

    // Group by date (WIB = UTC+7)
    const byDate: Record<string, DailySummary> = {};
    inRange.forEach((o) => {
      const raw = new Date(o.paid_at || o.created_at || '');
      // offset to WIB
      const wib = new Date(raw.getTime() + 7 * 3600 * 1000);
      const key = wib.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!byDate[key]) {
        byDate[key] = {
          date: key,
          displayDate: raw.toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            timeZone: 'Asia/Jakarta',
          }),
          orders: 0, qty: 0, revenue: 0,
        };
      }
      byDate[key].orders += 1;
      byDate[key].qty += o.qty || 0;
      byDate[key].revenue += o.amount || 0;
    });

    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [printOrders, laporanStart, laporanEnd, laporanSubmitted]);

  const laporanTotal = useMemo(() => ({
    orders: dailySummary.reduce((s, d) => s + d.orders, 0),
    qty: dailySummary.reduce((s, d) => s + d.qty, 0),
    revenue: dailySummary.reduce((s, d) => s + d.revenue, 0),
  }), [dailySummary]);

  const handleLaporanSubmit = () => {
    setLaporanError('');
    if (!laporanStart || !laporanEnd) {
      setLaporanError('Mohon pilih tanggal mulai dan tanggal akhir.');
      return;
    }
    if (new Date(laporanStart) > new Date(laporanEnd)) {
      setLaporanError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
    setLaporanSubmitted(true);
  };

  const handleLaporanClose = () => {
    setShowLaporanModal(false);
    setLaporanStart('');
    setLaporanEnd('');
    setLaporanSubmitted(false);
    setLaporanError('');
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

        {/* Top bar: filter + tombol laporan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px]">calendar_month</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Filter Transaksi</h3>
                <p className="text-sm text-gray-500">Kosongkan untuk tampilkan semua data</p>
              </div>
            </div>
            {/* Tombol Data Laporan */}
            <button
              onClick={() => setShowLaporanModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              Data Laporan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }}
              className="w-full px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">
              Reset Filter
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[24px]">print</span>
              <h3 className="text-xl font-black text-blue-900 uppercase">Total Keseluruhan</h3>
            </div>
            <p className="text-sm text-blue-700 font-medium">
              {startDate && endDate
                ? `Periode: ${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Semua Periode (Dari awal s/d sekarang)'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Hari', value: totalDays },
              { label: 'Order', value: totalOrders },
              { label: 'Foto', value: totalQty },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-white rounded-xl p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">{label}</p>
                <p className="text-2xl font-black text-blue-900">{value}</p>
              </div>
            ))}
            <div className="text-center bg-blue-600 rounded-xl p-4">
              <p className="text-xs text-white font-semibold uppercase mb-1">Total</p>
              <p className="text-xl font-black text-white">Rp {formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* Tabel transaksi */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">
              Rincian Print Orders ({totalOrders} Transaksi)
            </h3>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all">
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">print_disabled</span>
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
                      <td className="px-4 py-3"><p className="font-medium text-gray-900 text-xs">{p.customer_name ?? '-'}</p></td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.customer_email ?? '-'}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">Rp {formatCurrency(p.amount || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'paid' ? 'bg-green-100 text-green-700' :
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
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900 text-xs uppercase">Total</td>
                    <td className="px-4 py-3 font-black text-gray-900 whitespace-nowrap text-sm" colSpan={4}>
                      Rp {formatCurrency(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======= MODAL DATA LAPORAN ======= */}
      {showLaporanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleLaporanClose} />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-t-3xl px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white text-[28px]">bar_chart</span>
                <div>
                  <h2 className="text-xl font-black text-white">Data Laporan Harian</h2>
                  <p className="text-violet-200 text-sm">Rekap penjualan cetak per hari</p>
                </div>
              </div>
              <button onClick={handleLaporanClose}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-white text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form Tanggal */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                <h3 className="font-bold text-violet-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">date_range</span>
                  Pilih Periode Laporan
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dari Tanggal</label>
                    <input type="date" value={laporanStart}
                      onChange={(e) => { setLaporanStart(e.target.value); setLaporanSubmitted(false); setLaporanError(''); }}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sampai Tanggal</label>
                    <input type="date" value={laporanEnd}
                      onChange={(e) => { setLaporanEnd(e.target.value); setLaporanSubmitted(false); setLaporanError(''); }}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                  </div>
                </div>
                {laporanError && (
                  <p className="text-red-600 text-sm font-medium mb-3">{laporanError}</p>
                )}
                <button onClick={handleLaporanSubmit}
                  disabled={!laporanStart || !laporanEnd}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Tampilkan Laporan
                </button>
              </div>

              {/* Hasil Laporan */}
              {laporanSubmitted && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-violet-50 rounded-xl p-4 text-center border border-violet-200">
                      <p className="text-xs text-violet-600 font-semibold uppercase mb-1">Total Order</p>
                      <p className="text-2xl font-black text-violet-900">{laporanTotal.orders}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4 text-center border border-violet-200">
                      <p className="text-xs text-violet-600 font-semibold uppercase mb-1">Total Foto</p>
                      <p className="text-2xl font-black text-violet-900">{laporanTotal.qty}</p>
                    </div>
                    <div className="bg-violet-600 rounded-xl p-4 text-center">
                      <p className="text-xs text-white font-semibold uppercase mb-1">Total Pendapatan</p>
                      <p className="text-lg font-black text-white">Rp {formatCurrency(laporanTotal.revenue)}</p>
                    </div>
                  </div>

                  {/* Tabel per hari */}
                  {dailySummary.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">search_off</span>
                      <p className="text-gray-500">Tidak ada data dalam periode ini</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-gray-200">
                      <div className="bg-violet-600 px-4 py-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-white text-[18px]">table_chart</span>
                        <span className="font-bold text-white text-sm">
                          Rekap Per Hari ({dailySummary.length} hari)
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Transaksi</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Foto</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pendapatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {dailySummary.map((d) => (
                            <tr key={d.date} className="hover:bg-violet-50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-800 text-xs">{d.displayDate}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-black text-sm">
                                  {d.orders}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-sm">
                                  {d.qty}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                Rp {formatCurrency(d.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-violet-50 border-t-2 border-violet-300">
                          <tr>
                            <td className="px-4 py-3 font-black text-violet-900 uppercase text-xs">Total</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-violet-600 text-white font-black text-sm">
                                {laporanTotal.orders}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-600 text-white font-black text-sm">
                                {laporanTotal.qty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-violet-600 text-base whitespace-nowrap">
                              Rp {formatCurrency(laporanTotal.revenue)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
