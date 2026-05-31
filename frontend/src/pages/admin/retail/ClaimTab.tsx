import { useState } from 'react';
import { useToast } from '../../../components/Toast';
import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../utils/formatters';
import type { OrderSummaryRow } from '../../../hooks/useProductOrders';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';

type ClaimTabProps = {
  orders: OrderSummaryRow[];
  isLoading: boolean;
};

export default function ClaimTab({ orders, isLoading }: ClaimTabProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const unclaimedOrders = orders.filter(
    (o) => o.pickup_status === 'completed' && !o.sales_staff_name
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [staffName, setStaffName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = selectedIds.size === unclaimedOrders.length && unclaimedOrders.length > 0;

  const selectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unclaimedOrders.map((o) => o.id)));
    }
  };

  const handleClaim = async () => {
    if (selectedIds.size === 0) {
      showToast('warning', 'Pilih minimal satu pesanan untuk diklaim');
      return;
    }
    if (!staffName.trim()) {
      showToast('warning', 'Nama Staff harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('order_products')
        .update({ sales_staff_name: staffName.trim() })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      showToast('success', `${selectedIds.size} pesanan berhasil diklaim oleh ${staffName}!`);
      setSelectedIds(new Set());
      setStaffName('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.productOrders() });
    } catch (err) {
      console.error('Claim error:', err);
      showToast('error', 'Terjadi kesalahan saat mengklaim pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 animate-pulse">
            <div className="h-16 w-16 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (unclaimedOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
          <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-1">Semua Sudah Diklaim!</h3>
        <p className="text-gray-500 text-sm">Tidak ada pesanan selesai yang belum memiliki nama staff.</p>
      </div>
    );
  }

  const selectedCount = selectedIds.size;
  const selectedTotal = unclaimedOrders
    .filter((o) => selectedIds.has(o.id))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* === STICKY CLAIM PANEL === */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-4 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left: Info */}
          <div className="flex-1">
            <h3 className="text-base font-black text-gray-900 mb-0.5">
              {selectedCount === 0
                ? 'Pilih Pesanan untuk Diklaim'
                : `${selectedCount} Pesanan Dipilih`}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedCount === 0
                ? 'Centang transaksi yang Anda bantu jual di bawah ini'
                : `Total: Rp ${formatCurrency(selectedTotal)}`}
            </p>
          </div>

          {/* Right: Form + Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                badge
              </span>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Nama Staff Anda..."
                className="pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium focus:outline-none focus:border-[#ff4b86] transition-colors w-52"
              />
            </div>
            <button
              onClick={handleClaim}
              disabled={isSubmitting || selectedCount === 0 || !staffName.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4b86] to-[#ff6b3d] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
              )}
              {isSubmitting ? 'Memproses...' : 'Klaim Sekarang'}
            </button>
          </div>
        </div>

        {/* Progress bar indicator saat ada yang dipilih */}
        {selectedCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{selectedCount} dari {unclaimedOrders.length} transaksi dipilih</span>
              <button onClick={selectAll} className="text-[#ff4b86] font-bold hover:underline">
                {isAllSelected ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff4b86] to-[#ff6b3d] rounded-full transition-all duration-300"
                style={{ width: `${(selectedCount / unclaimedOrders.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* === SELECT ALL HEADER === */}
      <div className="flex items-center gap-3 px-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={selectAll}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
              isAllSelected
                ? 'bg-[#ff4b86] border-[#ff4b86]'
                : 'border-gray-300 group-hover:border-[#ff4b86]'
            }`}
          >
            {isAllSelected && (
              <span className="material-symbols-outlined text-white text-[14px]">check</span>
            )}
          </div>
          <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">
            Pilih Semua ({unclaimedOrders.length} transaksi)
          </span>
        </label>
      </div>

      {/* === ORDER CARDS === */}
      <div className="space-y-3">
        {unclaimedOrders.map((order) => {
          const isSelected = selectedIds.has(order.id);
          const items = order.order_product_items ?? [];
          const firstImage = items[0]?.product_variants?.products?.product_images?.find(
            (img) => img.is_primary
          )?.image_url ?? items[0]?.product_variants?.products?.product_images?.[0]?.image_url;

          const paidDate = order.paid_at
            ? new Date(order.paid_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })
            : null;

          return (
            <div
              key={order.id}
              onClick={() => toggleSelect(order.id)}
              className={`group relative bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-[#ff4b86] shadow-lg shadow-pink-100/60'
                  : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selected indicator bar */}
              {isSelected && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#ff4b86] rounded-r-full" />
              )}

              <div className="flex items-start gap-4 pl-1">
                {/* Custom Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#ff4b86] border-[#ff4b86]'
                        : 'border-gray-300 group-hover:border-[#ff4b86]'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-white text-[14px]">check</span>
                    )}
                  </div>
                </div>

                {/* Product Images Strip */}
                <div className="flex-shrink-0">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt="product"
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 text-[24px]">inventory_2</span>
                    </div>
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      {/* Invoice + Date */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                          {order.order_number}
                        </span>
                        {paidDate && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                            {paidDate}
                          </span>
                        )}
                      </div>
                      {/* Customer */}
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {order.profiles?.name || order.profiles?.email || 'Customer'}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-black ${isSelected ? 'text-[#ff4b86]' : 'text-gray-900'}`}>
                        Rp {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Items chips */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {items.map((item) => (
                        <span
                          key={item.id}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-pink-50 border-pink-200 text-pink-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="font-black">{item.quantity}×</span>
                          {item.product_variants?.products?.name ?? 'Produk'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
