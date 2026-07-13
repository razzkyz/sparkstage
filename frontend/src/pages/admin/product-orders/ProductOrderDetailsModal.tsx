import { formatCurrency } from '../../../utils/formatters';
import { formatDateTimeWIB } from '../../../utils/timezone';
import type { ProductOrderDetails } from './productOrdersTypes';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';

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
  const queryClient = useQueryClient();
  const [staffName, setStaffName] = useState('');
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [staffSaveError, setStaffSaveError] = useState<string | null>(null);

  const [department, setDepartment] = useState<string>('');
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [deptSaveError, setDeptSaveError] = useState<string | null>(null);

  if (!details) return null;

  // Sync department state from details if not yet set
  const currentDept = department || (details.order.order_department ?? '');

  const currentStaffName = details.order.sales_staff_name;

  const handleEditStaff = () => {
    setStaffName(currentStaffName ?? '');
    setIsEditingStaff(true);
    setStaffSaveError(null);
  };

  const handleSaveStaff = async () => {
    if (!staffName.trim()) {
      setStaffSaveError('Nama staff tidak boleh kosong');
      return;
    }
    setIsSavingStaff(true);
    setStaffSaveError(null);
    try {
      const { error } = await supabase
        .from('order_products')
        .update({ sales_staff_name: staffName.trim() })
        .eq('id', details.order.id);
      if (error) throw error;
      setIsEditingStaff(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrders() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrderDetails() }),
      ]);
    } catch (err: unknown) {
      setStaffSaveError(err instanceof Error ? err.message : 'Gagal menyimpan nama staff');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleClearStaff = async () => {
    setIsSavingStaff(true);
    setStaffSaveError(null);
    try {
      const { error } = await supabase
        .from('order_products')
        .update({ sales_staff_name: null })
        .eq('id', details.order.id);
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrders() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrderDetails() }),
      ]);
    } catch (err: unknown) {
      setStaffSaveError(err instanceof Error ? err.message : 'Gagal menghapus nama staff');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleSaveDepartment = async (newDept: string) => {
    setIsSavingDept(true);
    setDeptSaveError(null);
    try {
      const { error } = await supabase
        .from('order_products')
        .update({ order_department: newDept || null })
        .eq('id', details.order.id);
      if (error) throw error;
      setDepartment(newDept);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrders() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productOrderDetails() }),
      ]);
    } catch (err: unknown) {
      setDeptSaveError(err instanceof Error ? err.message : 'Gagal menyimpan departemen');
    } finally {
      setIsSavingDept(false);
    }
  };

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
              {/* EDITABLE: Sales Staff Name */}
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Yang Menjual</p>
                {isEditingStaff ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveStaff(); if (e.key === 'Escape') setIsEditingStaff(false); }}
                      placeholder="Nama staff yang menjual..."
                      autoFocus
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86]"
                    />
                    <button
                      onClick={() => void handleSaveStaff()}
                      disabled={isSavingStaff}
                      className="rounded-lg bg-[#ff4b86] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#ff6a9a] disabled:opacity-50 transition-colors"
                    >
                      {isSavingStaff ? 'Simpan...' : 'Simpan'}
                    </button>
                    <button
                      onClick={() => setIsEditingStaff(false)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${currentStaffName ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {currentStaffName
                        ? currentStaffName.replace(' (Dressing)', '')
                        : 'Belum ada nama staff'}
                    </p>
                    {currentStaffName?.endsWith(' (Dressing)') && (
                      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        Dressing Room
                      </span>
                    )}
                    <button
                      onClick={handleEditStaff}
                      className="ml-1 rounded-md p-1 text-gray-400 hover:text-[#ff4b86] hover:bg-pink-50 transition-colors"
                      title="Ubah nama staff"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    {currentStaffName && (
                      <button
                        onClick={() => { void handleClearStaff(); }}
                        disabled={isSavingStaff}
                        className="rounded-md p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Hapus nama staff"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                      </button>
                    )}
                  </div>
                )}
                {staffSaveError && <p className="mt-1 text-xs text-red-500">{staffSaveError}</p>}
              </div>

              {/* EDITABLE: Department / Divisi */}
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Divisi / Department</p>
                <div className="flex items-center gap-2">
                  <select
                    value={currentDept}
                    onChange={(e) => { void handleSaveDepartment(e.target.value); }}
                    disabled={isSavingDept}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#ff4b86] focus:ring-1 focus:ring-[#ff4b86] transition-colors ${
                      currentDept === 'shop'
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : currentDept === 'dressing'
                        ? 'border-purple-300 bg-purple-50 text-purple-800'
                        : currentDept === 'service'
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-gray-300 bg-white text-gray-500 italic'
                    }`}
                  >
                    <option value="">— Pilih divisi —</option>
                    <option value="shop">🛍️ Shop</option>
                    <option value="dressing">👗 Dressing</option>
                    <option value="service">✂️ Service</option>
                  </select>
                  {isSavingDept && <span className="text-xs text-gray-400 animate-pulse">Menyimpan...</span>}
                  {deptSaveError && <span className="text-xs text-red-500">{deptSaveError}</span>}
                </div>
              </div>

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
