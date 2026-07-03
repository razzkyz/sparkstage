import { formatCurrency } from '../../../utils/formatters';
import type { OrderSummaryRow } from '../../../hooks/useProductOrders';
import {
  getEmptyStateCopy,
  getOrderTimingLabel,
  getPickupStatusClass,
  getPickupStatusLabel,
} from './productOrdersHelpers';
import type { ProductOrdersTab } from './productOrdersTypes';

type ProductOrdersListSectionProps = {
  activeTab: ProductOrdersTab;
  pendingPickupCount: number;
  pendingPaymentCount: number;
  todayCount: number;
  completedCount: number;
  isLoading: boolean;
  isFetching: boolean;
  ordersError: string | null;
  displayOrders: OrderSummaryRow[];
  selectedBatchCodes?: Set<string>;
  isBatchSubmitting?: boolean;
  onChangeTab: (tab: ProductOrdersTab) => void;
  onRefresh: () => void;
  onSelectOrder: (pickupCode: string | null) => void;
  onToggleBatchCode?: (pickupCode: string) => void;
  onBatchComplete?: () => void;
};

export function ProductOrdersListSection({
  activeTab,
  pendingPickupCount,
  pendingPaymentCount,
  todayCount,
  completedCount,
  isLoading,
  isFetching,
  ordersError,
  displayOrders,
  selectedBatchCodes = new Set(),
  isBatchSubmitting = false,
  onChangeTab,
  onRefresh,
  onSelectOrder,
  onToggleBatchCode,
  onBatchComplete,
}: ProductOrdersListSectionProps) {
  const emptyState = getEmptyStateCopy(activeTab);
  const loadingRows = ['loading-row-1', 'loading-row-2', 'loading-row-3', 'loading-row-4', 'loading-row-5', 'loading-row-6'];

  const canBatchConfirm = activeTab === 'pending_pickup' && onToggleBatchCode && onBatchComplete;
  const hasSelection = selectedBatchCodes.size > 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
      <div className={`p-6 ${hasSelection ? 'pb-24' : ''}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
          <h3 className="text-xl font-bold text-neutral-900">Daftar Pesanan</h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => onChangeTab('pending_payment')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeTab === 'pending_payment' ? 'bg-primary text-gray-900' : 'text-gray-600 hover:bg-white'
                }`}
              >
                Pending Payment ({pendingPaymentCount})
              </button>
              <button
                onClick={() => onChangeTab('pending_pickup')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeTab === 'pending_pickup' ? 'bg-primary text-gray-900' : 'text-gray-600 hover:bg-white'
                }`}
              >
                Pending Pickup ({pendingPickupCount})
              </button>
              <button
                onClick={() => onChangeTab('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeTab === 'today' ? 'bg-primary text-gray-900' : 'text-gray-600 hover:bg-white'
                }`}
              >
                Hari Ini ({todayCount})
              </button>
              <button
                onClick={() => onChangeTab('completed')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                  activeTab === 'completed' ? 'bg-primary text-gray-900' : 'text-gray-600 hover:bg-white'
                }`}
              >
                Selesai ({completedCount})
              </button>
            </div>
            <button
              onClick={onRefresh}
              className="text-sm font-bold text-primary hover:underline"
              disabled={isFetching}
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Pending payment menampilkan reservasi kasir yang belum dibayar. Pending pickup hanya untuk pesanan paid yang belum diambil.
        </p>
        {ordersError && <div className="mb-4 text-sm text-red-600">{ordersError}</div>}

        {isLoading ? (
          <div className="space-y-2">
            {loadingRows.map((rowKey) => (
              <div
                key={rowKey}
                className="h-[64px] rounded-lg border border-gray-100 bg-gray-50/60 animate-pulse"
              />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-700 mb-2">{emptyState.icon}</span>
            <p className="text-sm text-gray-500">{emptyState.message}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayOrders.map((order) => {
              const timing = getOrderTimingLabel(order);
              const isSelected = order.pickup_code ? selectedBatchCodes.has(order.pickup_code) : false;

              return (
                <div
                  key={order.id}
                  className={`w-full flex items-stretch gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100'
                  }`}
                >
                  {canBatchConfirm && order.pickup_code && (
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleBatchCode?.(order.pickup_code!)}
                        className="w-5 h-5 rounded border-gray-300 text-[#ff4b86] focus:ring-[#ff4b86] cursor-pointer"
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={() => onSelectOrder(order.pickup_code)}
                    className="flex-1 flex flex-col gap-2 min-w-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-neutral-900 truncate">{order.pickup_code ?? '-'}</p>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono border border-gray-200">
                            {order.order_number}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {order.profiles?.name ?? order.profiles?.email ?? 'Customer'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500">
                          {formatCurrency(Number(order.total ?? 0))}
                        </span>
                        <span
                          className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${getPickupStatusClass(order.pickup_status)}`}
                        >
                          {getPickupStatusLabel(order.pickup_status)}
                        </span>
                      </div>
                    </div>

                    {timing && (
                      <div className="flex justify-end mt-1 mb-1">
                        <span className="text-[10px] text-gray-500 italic">
                          {timing.prefix} {timing.value}
                        </span>
                      </div>
                    )}

                    {order.order_product_items && order.order_product_items.length > 0 && (
                      <div className="pl-2 border-l-2 border-gray-200 space-y-2 mt-2 w-full">
                        {order.order_product_items.map((item) => {
                          const productName = item.product_variants?.products?.name ?? 'Product';
                          const variantName = item.product_variants?.name ?? 'Variant';
                          const category = item.product_variants?.products?.categories?.name ?? '';
                          const images = item.product_variants?.products?.product_images || [];
                          const primaryImage = images.find(img => img.is_primary)?.image_url || images[0]?.image_url;

                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 text-xs py-1">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {primaryImage ? (
                                  <img src={primaryImage} alt={productName} className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-md border border-gray-200">
                                    <span className="material-symbols-outlined text-gray-400 text-[18px]">inventory_2</span>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="text-gray-700 font-bold block truncate">{productName}</span>
                                  <span className="text-gray-500 truncate block mt-0.5">
                                    {category && `(${category}) `}{variantName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 text-gray-600 whitespace-nowrap pl-2">
                                <span className="font-medium text-gray-900">
                                  {item.quantity}× {formatCurrency(Number(item.price))}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between animate-fade-in z-10">
          <span className="text-sm font-bold text-gray-700">
            {selectedBatchCodes.size} pesanan terpilih
          </span>
          <button
            onClick={onBatchComplete}
            disabled={isBatchSubmitting}
            className="flex items-center gap-2 rounded-lg bg-[#ff4b86] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#ff6a9a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isBatchSubmitting ? (
              'Memproses...'
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Konfirmasi Terpilih
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
