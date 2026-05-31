import { formatCurrency } from '../../../utils/formatters';
import type { OrderSummaryRow } from '../../../hooks/useProductOrders';
import { useMemo } from 'react';

type ReportTabProps = {
  orders: OrderSummaryRow[];
  isLoading: boolean;
};

type StaffReport = {
  staffName: string;
  totalOrders: number;
  totalItems: number;
  totalRevenue: number;
  orders: OrderSummaryRow[];
};

// Warna avatar berdasarkan inisial nama
const AVATAR_COLORS = [
  'from-[#ff4b86] to-[#ff6b3d]',
  'from-[#6366f1] to-[#8b5cf6]',
  'from-[#0ea5e9] to-[#06b6d4]',
  'from-[#10b981] to-[#059669]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#ec4899] to-[#a855f7]',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ReportTab({ orders, isLoading }: ReportTabProps) {
  const staffReports = useMemo(() => {
    const claimedOrders = orders.filter((o) => o.sales_staff_name);
    const reportMap = new Map<string, StaffReport>();

    claimedOrders.forEach((order) => {
      const staffName = order.sales_staff_name!;
      const existing = reportMap.get(staffName) || {
        staffName,
        totalOrders: 0,
        totalItems: 0,
        totalRevenue: 0,
        orders: [],
      };

      existing.totalOrders += 1;
      existing.totalRevenue += order.total;

      let itemsInOrder = 0;
      order.order_product_items?.forEach((item) => {
        itemsInOrder += item.quantity;
      });
      existing.totalItems += itemsInOrder;
      existing.orders.push(order);
      reportMap.set(staffName, existing);
    });

    return Array.from(reportMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-28" />
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (staffReports.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-50 mb-4">
          <span className="material-symbols-outlined text-4xl text-[#ff4b86]">assignment_ind</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">Belum Ada Data Penjualan</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Belum ada staff yang mengklaim atau menginput penjualan produk.
        </p>
      </div>
    );
  }

  // Hitung total keseluruhan untuk leaderboard
  const grandTotal = staffReports.reduce((s, r) => s + r.totalRevenue, 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* === SUMMARY STRIP === */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-[#ff4b86]">{staffReports.length}</p>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Staff Aktif</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-gray-900">{staffReports.reduce((s, r) => s + r.totalOrders, 0)}</p>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Total Transaksi</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-gray-900">Rp {formatCurrency(grandTotal)}</p>
          <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Total Penjualan</p>
        </div>
      </div>

      {/* === STAFF CARDS === */}
      {staffReports.map((report, rank) => {
        const avatarColor = getAvatarColor(report.staffName);
        const sharePercent = grandTotal > 0 ? (report.totalRevenue / grandTotal) * 100 : 0;

        return (
          <div key={report.staffName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header Staff */}
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Rank + Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center shadow-md`}>
                      <span className="text-white font-black text-2xl">{report.staffName.charAt(0).toUpperCase()}</span>
                    </div>
                    {/* Rank badge */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${
                      rank === 0 ? 'bg-yellow-400 text-yellow-900' :
                      rank === 1 ? 'bg-gray-300 text-gray-700' :
                      rank === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {rank + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{report.staffName}</h3>
                    <p className="text-xs font-medium text-gray-500">
                      {report.totalOrders} Transaksi &bull; {report.totalItems} Item Terjual
                    </p>
                  </div>
                </div>

                {/* Revenue + Share */}
                <div className="sm:ml-auto text-left sm:text-right">
                  <p className="text-xl font-black text-[#ff4b86]">Rp {formatCurrency(report.totalRevenue)}</p>
                  <p className="text-xs text-gray-400 font-medium">{sharePercent.toFixed(1)}% dari total penjualan</p>
                </div>
              </div>

              {/* Revenue bar */}
              <div className="mt-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${avatarColor} rounded-full transition-all duration-500`}
                    style={{ width: `${sharePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Transaksi */}
            <div className="p-5 sm:p-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Rincian Transaksi</p>
              {report.orders.map((order) => {
                const items = order.order_product_items ?? [];

                const paidDate = order.paid_at
                  ? new Date(order.paid_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : order.updated_at
                  ? new Date(order.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short',
                    })
                  : null;

                return (
                  <div key={order.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-colors">

                    {/* Product images stack */}
                    <div className="flex-shrink-0 flex -space-x-2">
                      {items.slice(0, 3).map((item, idx) => {
                        const img = item.product_variants?.products?.product_images?.find(i => i.is_primary)?.image_url
                          ?? item.product_variants?.products?.product_images?.[0]?.image_url;
                        return img ? (
                          <img
                            key={item.id}
                            src={img}
                            alt={item.product_variants?.products?.name ?? ''}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm"
                            style={{ zIndex: 3 - idx }}
                          />
                        ) : (
                          <div
                            key={item.id}
                            className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center shadow-sm"
                            style={{ zIndex: 3 - idx }}
                          >
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">inventory_2</span>
                          </div>
                        );
                      })}
                      {items.length > 3 && (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-[11px] font-black text-gray-500 shadow-sm">
                          +{items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                          {order.order_number}
                        </span>
                        {paidDate && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            {paidDate}
                          </span>
                        )}
                      </div>

                      {/* Item chips */}
                      <div className="flex flex-wrap gap-1">
                        {items.map((item) => (
                          <span key={item.id} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                            <span className="font-black">{item.quantity}×</span>
                            {item.product_variants?.products?.name ?? 'Produk'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-black text-gray-900">Rp {formatCurrency(order.total)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {order.profiles?.name || order.profiles?.email || 'Customer'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
