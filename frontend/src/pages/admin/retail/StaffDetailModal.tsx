import { formatCurrency } from '../../../utils/formatters';
import type { StaffReport } from './ReportTab';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';

type StaffDetailModalProps = {
  staffReport: StaffReport;
  onClose: () => void;
};

type ProductSummary = {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export default function StaffDetailModal({ staffReport, onClose }: StaffDetailModalProps) {
  // Agregasi produk dari semua transaksi
  const productSummaries = useMemo(() => {
    const productMap = new Map<string, ProductSummary>();

    staffReport.orders.forEach((order) => {
      order.order_product_items?.forEach((item) => {
        const productName = item.product_variants?.products?.name ?? 'Produk Tidak Diketahui';
        const variantName = item.product_variants?.name ?? '-';
        const unitPrice = item.price ?? 0;

        // Buat key unik berdasarkan product + variant + unit_price
        const key = `${productName}|${variantName}|${unitPrice}`;

        const existing = productMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          existing.subtotal += item.quantity * unitPrice;
        } else {
          productMap.set(key, {
            productName,
            variantName,
            quantity: item.quantity,
            unitPrice,
            subtotal: item.quantity * unitPrice,
          });
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.subtotal - a.subtotal);
  }, [staffReport.orders]);

  const totalQuantity = productSummaries.reduce((sum, p) => sum + p.quantity, 0);
  const totalRevenue = productSummaries.reduce((sum, p) => sum + p.subtotal, 0);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#ff4b86] to-[#ff6b3d] text-white p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-3xl">{staffReport.staffName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black mb-1">Detail Penjualan</h2>
                <p className="text-sm font-medium text-white/90">{staffReport.staffName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-black">{staffReport.totalOrders}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-white/80">Transaksi</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-black">{totalQuantity}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-white/80">Item Terjual</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-black">Rp {formatCurrency(totalRevenue)}</p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-white/80">Total Penjualan</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Rincian Produk ({productSummaries.length} Item)
            </h3>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print
            </button>
          </div>

          {productSummaries.length === 0 ? (
            <div className="bg-gray-50 rounded-xl py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-400">inventory_2</span>
              </div>
              <p className="text-gray-500 font-medium">Tidak ada produk yang terjual</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">No</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Produk</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">Variant</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600">Harga Satuan</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {productSummaries.map((product, index) => (
                    <tr key={`${product.productName}-${product.variantName}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-4 font-semibold text-gray-900">{product.productName}</td>
                      <td className="px-4 py-4 text-gray-700">{product.variantName}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#ff4b86]/10 text-[#ff4b86] font-black">
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-700">
                        Rp {formatCurrency(product.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-right font-black text-gray-900">
                        Rp {formatCurrency(product.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right font-bold uppercase tracking-wider text-gray-600">
                      Total
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#ff4b86] text-white font-black text-sm">
                        {totalQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4 text-right font-black text-xl text-[#ff4b86]">
                      Rp {formatCurrency(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Data ini dapat di-screenshot untuk keperluan dokumentasi atau pelaporan
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ff4b86] to-[#ff6b3d] text-white font-bold text-sm hover:shadow-lg transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal menggunakan Portal agar muncul di root level (di luar AdminLayout)
  return createPortal(modalContent, document.body);
}
