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
  date: string;
  displayDate: string;
  orders: number;
  qty: number;
  revenue: number;
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export default function PrintOrdersReport() {
  const { signOut } = useAuth();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal state
  const [showLaporanModal, setShowLaporanModal] = useState(false);
  const [laporanStart, setLaporanStart] = useState<string>('');
  const [laporanEnd, setLaporanEnd] = useState<string>('');
  const [laporanSubmitted, setLaporanSubmitted] = useState(false);
  const [laporanError, setLaporanError] = useState('');

  const { data: printOrders = [], isLoading } = useQuery({
    queryKey: ['print-orders-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('print_orders')
        .select('id, doku_order_id, customer_name, customer_email, queue_number, amount, qty, status, paid_at, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PrintOrder[];
    },
  });

  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) return printOrders;
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    return printOrders.filter((o) => {
      const d = new Date(o.paid_at || o.created_at || '');
      return d >= start && d <= end;
    });
  }, [printOrders, startDate, endDate]);

  const totalOrders  = filteredOrders.length;
  const totalQty     = filteredOrders.reduce((s, o) => s + (o.qty    || 0), 0);
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

  const dailySummary = useMemo<DailySummary[]>(() => {
    if (!laporanSubmitted || !laporanStart || !laporanEnd) return [];
    const start = new Date(laporanStart); start.setHours(0, 0, 0, 0);
    const end   = new Date(laporanEnd);   end.setHours(23, 59, 59, 999);
    const inRange = printOrders.filter((o) => {
      const d = new Date(o.paid_at || o.created_at || '');
      return d >= start && d <= end;
    });
    const byDate: Record<string, DailySummary> = {};
    inRange.forEach((o) => {
      const raw = new Date(o.paid_at || o.created_at || '');
      const wib = new Date(raw.getTime() + 7 * 3600 * 1000);
      const key = wib.toISOString().slice(0, 10);
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
      byDate[key].orders  += 1;
      byDate[key].qty     += o.qty    || 0;
      byDate[key].revenue += o.amount || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [printOrders, laporanStart, laporanEnd, laporanSubmitted]);

  const laporanTotal = useMemo(() => ({
    orders:  dailySummary.reduce((s, d) => s + d.orders,  0),
    qty:     dailySummary.reduce((s, d) => s + d.qty,     0),
    revenue: dailySummary.reduce((s, d) => s + d.revenue, 0),
  }), [dailySummary]);

  const handleLaporanSubmit = () => {
    setLaporanError('');
    if (!laporanStart || !laporanEnd) { setLaporanError('Pilih tanggal mulai dan akhir.'); return; }
    if (new Date(laporanStart) > new Date(laporanEnd)) { setLaporanError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'); return; }
    setLaporanSubmitted(true);
  };

  const handleLaporanClose = () => {
    setShowLaporanModal(false);
    setLaporanStart(''); setLaporanEnd('');
    setLaporanSubmitted(false); setLaporanError('');
  };

  const statusBadge = (s: string | null) => {
    if (s === 'paid')    return 'bg-green-100 text-green-700';
    if (s === 'PRINTED') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-500';
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
      <div className="space-y-4 sm:space-y-6 animate-fade-in">

        {/* ── Filter + Tombol Laporan ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          {/* Header row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[22px]">calendar_month</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">Filter Transaksi</h3>
                <p className="text-xs sm:text-sm text-gray-500">Kosongkan untuk tampilkan semua data</p>
              </div>
            </div>
            <button
              onClick={() => setShowLaporanModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-md hover:shadow-lg active:scale-95 transition-all text-sm w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              Data Laporan
            </button>
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-all">
              Reset Filter
            </button>
          )}
        </div>

        {/* ── Summary ── */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">print</span>
              <h3 className="text-base sm:text-xl font-black text-blue-900 uppercase">Total Keseluruhan</h3>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 font-medium">
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Semua Periode'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hari',  value: totalDays },
              { label: 'Order', value: totalOrders },
              { label: 'Foto',  value: totalQty },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-white rounded-xl p-3 sm:p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">{label}</p>
                <p className="text-xl sm:text-2xl font-black text-blue-900">{value}</p>
              </div>
            ))}
            <div className="text-center bg-blue-600 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-white font-semibold uppercase mb-1">Total</p>
              <p className="text-base sm:text-xl font-black text-white">Rp {formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        {/* ── Tabel / Cards Transaksi ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm sm:text-lg font-black text-gray-900">
              Rincian ({totalOrders} Transaksi)
            </h3>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-all">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">print</span>
              Print
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">print_disabled</span>
              <p className="text-gray-500 text-sm font-medium">Tidak ada data dalam periode ini</p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filteredOrders.map((p, i) => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-400 text-xs font-mono shrink-0">{i + 1}.</span>
                        <p className="font-semibold text-gray-900 text-sm truncate">{p.customer_name ?? '-'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${statusBadge(p.status)}`}>
                        {p.status ?? '-'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono truncate">{p.doku_order_id ?? '-'}</p>
                    <p className="text-xs text-gray-500">{p.customer_email ?? '-'}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">Bayar:</span> {fmtDate(p.paid_at)}
                      </div>
                      <p className="font-black text-gray-900 text-sm">Rp {formatCurrency(p.amount || 0)}</p>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Total</span>
                  <span className="font-black text-gray-900">Rp {formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(p.status)}`}>{p.status ?? '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(p.paid_at)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(p.created_at)}</td>
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
            </>
          )}
        </div>
      </div>

      {/* ======= MODAL DATA LAPORAN ======= */}
      {showLaporanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleLaporanClose} />

          {/* Sheet on mobile (slides from bottom), centered modal on desktop */}
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto">
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-4 sm:rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-white text-[24px]">bar_chart</span>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-white">Data Laporan Harian</h2>
                  <p className="text-violet-200 text-xs">Rekap penjualan cetak per hari</p>
                </div>
              </div>
              <button onClick={handleLaporanClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-white text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Form Tanggal */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                <h3 className="font-bold text-violet-900 mb-3 flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-[16px]">date_range</span>
                  Pilih Periode Laporan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dari Tanggal</label>
                    <input type="date" value={laporanStart}
                      onChange={(e) => { setLaporanStart(e.target.value); setLaporanSubmitted(false); setLaporanError(''); }}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Sampai Tanggal</label>
                    <input type="date" value={laporanEnd}
                      onChange={(e) => { setLaporanEnd(e.target.value); setLaporanSubmitted(false); setLaporanError(''); }}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                  </div>
                </div>
                {laporanError && <p className="text-red-600 text-xs font-medium mb-2">{laporanError}</p>}
                <button onClick={handleLaporanSubmit}
                  disabled={!laporanStart || !laporanEnd}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                  Tampilkan Laporan
                </button>
              </div>

              {/* Hasil Laporan */}
              {laporanSubmitted && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-200">
                      <p className="text-xs text-violet-600 font-semibold uppercase mb-1">Order</p>
                      <p className="text-xl sm:text-2xl font-black text-violet-900">{laporanTotal.orders}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-200">
                      <p className="text-xs text-violet-600 font-semibold uppercase mb-1">Foto</p>
                      <p className="text-xl sm:text-2xl font-black text-violet-900">{laporanTotal.qty}</p>
                    </div>
                    <div className="bg-violet-600 rounded-xl p-3 text-center">
                      <p className="text-xs text-white font-semibold uppercase mb-1">Total</p>
                      <p className="text-sm sm:text-base font-black text-white">Rp {formatCurrency(laporanTotal.revenue)}</p>
                    </div>
                  </div>

                  {/* List teks per hari */}
                  {dailySummary.length === 0 ? (
                    <div className="py-10 text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">search_off</span>
                      <p className="text-gray-500 text-sm">Tidak ada data dalam periode ini</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-3">Rekap Per Hari</p>
                      {dailySummary.map((d, idx) => (
                        <div key={d.date} className="flex items-start gap-2.5 py-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-400 text-xs font-mono w-5 text-right shrink-0 mt-0.5">{idx + 1}.</span>
                          <p className="text-gray-800 text-sm leading-relaxed flex-1">
                            <span className="font-bold">{d.displayDate}</span>
                            {' — '}
                            <span className="text-violet-700 font-semibold">{d.orders} transaksi</span>
                            {', '}
                            <span className="text-blue-700 font-semibold">{d.qty} print</span>
                            {' · '}
                            <span className="font-bold text-gray-900">Rp {formatCurrency(d.revenue)}</span>
                          </p>
                        </div>
                      ))}
                      {/* Total */}
                      <div className="mt-3 pt-3 border-t-2 border-violet-300 flex items-center justify-between gap-2">
                        <p className="font-black text-violet-900 uppercase text-sm">Total</p>
                        <div className="text-right">
                          <p className="text-violet-700 font-bold text-xs">{laporanTotal.orders} transaksi · {laporanTotal.qty} print</p>
                          <p className="font-black text-violet-600 text-base">Rp {formatCurrency(laporanTotal.revenue)}</p>
                        </div>
                      </div>
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
