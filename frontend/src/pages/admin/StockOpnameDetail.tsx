import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../components/Toast';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useUserRole } from '../../hooks/useUserRole';
import { useStockOpnameDetail, useUpdateStockOpname } from '../../hooks/useStockOpname';
import TableRowSkeleton from '../../components/skeletons/TableRowSkeleton';

const transactionTypeLabels: Record<string, string> = {
  stock_in: 'Stok Masuk',
  stock_out: 'Stok Keluar',
  adjustment: 'Adjustment',
};

const transactionTypeColors: Record<string, string> = {
  stock_in: 'bg-green-100 text-green-800',
  stock_out: 'bg-red-100 text-red-800',
  adjustment: 'bg-blue-100 text-blue-800',
};

const StockOpnameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { role } = useUserRole();
  const menuSections = useAdminMenuSections();

  const isEditMode = searchParams.get('edit') === 'true';
  const isAdmin = role !== 'owner';
  const canEdit = isAdmin && isEditMode;

  // Edit form state
  const [editReason, setEditReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const opnameId = id ? parseInt(id, 10) : null;
  const { data: opname, isLoading, error } = useStockOpnameDetail(opnameId);
  const updateMutation = useUpdateStockOpname();

  // Initialize edit form when opname data loads
  if (opname && !isEditing && canEdit) {
    setEditReason(opname.reason || '');
    setEditNotes(opname.notes || '');
    setIsEditing(true);
  }

  const handleSaveEdit = async () => {
    if (!opnameId) return;

    try {
      await updateMutation.mutateAsync({
        opname_id: opnameId,
        reason: editReason,
        notes: editNotes,
      });
      showToast('success', 'Stock opname berhasil diperbarui');
      navigate(`/admin/stock-opname/${opnameId}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui stock opname');
    }
  };

  const handleCancelEdit = () => {
    navigate(`/admin/stock-opname/${opnameId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="stock-opname"
      title="Detail Stock Opname"
      subtitle={opname?.opname_number ?? 'Loading...'}
      headerActions={
        <div className="flex gap-2">
          {canEdit ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {updateMutation.isPending ? 'progress_activity' : 'check'}
                </span>
                {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/admin/stock-opname')}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali
              </button>
              {isAdmin && (
                <button
                  onClick={() => navigate(`?edit=true`)}
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      }
      onLogout={signOut}
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
          {error instanceof Error ? error.message : 'Gagal memuat detail stock opname'}
        </div>
      )}

      {isLoading ? (
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <tbody>
              <TableRowSkeleton columns={4} />
              <TableRowSkeleton columns={4} />
            </tbody>
          </table>
        </div>
      ) : opname ? (
        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Nomor Opname
                </h3>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {opname.opname_number}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Jenis Transaksi
                </h3>
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                    transactionTypeColors[opname.transaction_type] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {transactionTypeLabels[opname.transaction_type] || opname.transaction_type}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Lokasi
                </h3>
                <p className="text-lg font-semibold text-gray-900">{opname.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Tanggal Transaksi
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(opname.transaction_date)}
                </p>
              </div>

              {(opname.opname_start_date || opname.opname_end_date) && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Periode Perhitungan Penjualan
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Dari tanggal</p>
                      <p className="text-base font-semibold text-gray-900">
                        {opname.opname_start_date ? new Date(opname.opname_start_date).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Hingga tanggal</p>
                      <p className="text-base font-semibold text-gray-900">
                        {opname.opname_end_date ? new Date(opname.opname_end_date).toLocaleDateString('id-ID') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(opname.reason || canEdit) && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                    Alasan
                  </h3>
                  {canEdit ? (
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
                      placeholder="Alasan stock opname"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{opname.reason}</p>
                  )}
                </div>
              )}

              {(opname.notes || canEdit) && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                    Catatan
                  </h3>
                  {canEdit ? (
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
                      placeholder="Catatan tambahan"
                      rows={4}
                    />
                  ) : (
                    <p className="text-base text-gray-700">{opname.notes}</p>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Dibuat Oleh
                </h3>
                <p className="text-base text-gray-900">{opname.created_by_email || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                  Dibuat Pada
                </h3>
                <p className="text-base text-gray-900">{formatDate(opname.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                Detail Produk ({opname.items.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Produk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Varian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Stock Awal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Terjual
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Expected
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Stock Fisik
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Selisih
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Alasan Selisih
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Satuan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {opname.items.map((item) => {
                    const discrepancyClass = !item.quantity_discrepancy
                      ? 'text-green-700 font-semibold'
                      : item.quantity_discrepancy > 0
                      ? 'text-orange-700 font-semibold'
                      : 'text-red-700 font-semibold';

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.variant_name}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {item.variant_sku}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {item.quantity_before} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          {item.quantity_sold ?? '-'} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">
                          {item.quantity_expected ?? '-'} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {item.quantity_actual !== null && item.quantity_actual !== undefined
                            ? `${item.quantity_actual} ${item.unit}`
                            : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${discrepancyClass}`}>
                          {item.quantity_discrepancy !== null && item.quantity_discrepancy !== undefined
                            ? `${item.quantity_discrepancy > 0 ? '+' : ''}${item.quantity_discrepancy} ${item.unit}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.discrepancy_reason ? (
                            <span className="inline-block rounded-lg bg-amber-50 px-2.5 py-1 text-xs border border-amber-200">
                              {item.discrepancy_reason}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">Stock opname tidak ditemukan</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default StockOpnameDetail;
