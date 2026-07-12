import { formatCurrency } from '../../../utils/formatters';
import { formatDateTimeWIB } from '../../../utils/timezone';
import type { ProductOrderDetails } from './productOrdersTypes';

type ProductOrderDetailsModalProps = {
  details: ProductOrderDetails | null;
  submitting: boolean;
  actionError: string | null;
  onClose: () => void;
  onCompletePickup: () => void;
  isConnected?: boolean;
  isPrinting?: boolean;
  onPrintReceipt?: () => void;
};

export function ProductOrderDetailsModal({
  details,
  submitting,
  actionError,
  onClose,
  onCompletePickup,
  isConnected = false,
  isPrinting = false,
  onPrintReceipt,
}: ProductOrderDetailsModalProps) {
  if (!details) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose}></div>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white border border-gray-200 shadow-xl animate-fade-in-scale"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-gray-500">Pickup Code</p>
            <h3 className="text-2xl font-bold text-neutral-900 truncate">{details.order.pickup_code}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {details.order.profiles?.name ?? details.order.profiles?.email ?? 'Customer'}
            </p>
          </div>
          <button className="text-gray-600 hover:text-gray-900" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0">
          {actionError && <div className="mb-4 text-sm text-red-600 flex-shrink-0">{actionError}</div>}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {details.order.sales_staff_name && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Sales Staff</p>
                  <p className="font-medium text-gray-900">{details.order.sales_staff_name}</p>
                </div>
              )}
              {details.order.paid_at && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Waktu Pembayaran</p>
                  <p className="font-medium text-gray-900">{formatDateTimeWIB(details.order.paid_at)}</p>
                </div>
              )}
              {details.order.created_at && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Waktu Order</p>
                  <p className="font-medium text-gray-900">{formatDateTimeWIB(details.order.created_at)}</p>
                </div>
              )}
              {details.order.pickup_status === 'completed' && details.order.updated_at && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Waktu Selesai</p>
                  <p className="font-medium text-gray-900">{formatDateTimeWIB(details.order.updated_at)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {details.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.variantName} · {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 flex items-center justify-between flex-shrink-0">
            <span className="text-xs uppercase tracking-widest text-gray-500">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(Number(details.order.total ?? 0))}</span>
          </div>

          {details.order.pickup_status !== 'completed' ? (
            <button
              onClick={onCompletePickup}
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-[#ff4b86] px-6 py-3 text-sm font-bold text-white hover:bg-[#ff6a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center gap-2"
            >
              {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran & Serah Barang'}
            </button>
          ) : (
            <div className="mt-4 w-full rounded-lg bg-gray-100 px-6 py-3 text-sm font-bold text-gray-500 text-center border border-gray-200 flex-shrink-0">
              Pesanan Sudah Diserahkan (Selesai)
            </div>
          )}

          {details.order.pickup_status === 'completed' && isConnected && (
            <button
              onClick={onPrintReceipt}
              disabled={isPrinting}
              className="mt-2 w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              {isPrinting ? 'Mencetak...' : 'Cetak Struk Transaksi'}
            </button>
          )}
          
          {details.order.pickup_status === 'completed' && !isConnected && (
            <div className="mt-2 text-center text-xs text-amber-600">
              Hubungkan printer di menu atas untuk mencetak struk.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
