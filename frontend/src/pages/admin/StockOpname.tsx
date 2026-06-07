import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../components/Toast';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { useUserRole } from '../../hooks/useUserRole';
import { useStockOpnameList, useDeleteStockOpname } from '../../hooks/useStockOpname';
import { StockOpnameFormModal } from './stock-opname/StockOpnameFormModal';
import { StockOpnameImportModal } from './stock-opname/StockOpnameImportModal';
import { StockOpnameTable } from './stock-opname/StockOpnameTable';
import TableRowSkeleton from '../../components/skeletons/TableRowSkeleton';

const ITEMS_PER_PAGE = 20;

const StockOpname = () => {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const { role } = useUserRole();
  const menuSections = useAdminMenuSections();
  const navigate = useNavigate();

  const isOwner = role === 'owner';

  const [currentPage, setCurrentPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; number: string } | null>(null);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { data, isLoading, error, refetch } = useStockOpnameList(ITEMS_PER_PAGE, offset);
  const deleteMutation = useDeleteStockOpname();

  const stockOpnameList = data?.data ?? [];
  const totalCount = data?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const handleViewDetail = (opnameId: number) => {
    navigate(`/admin/stock-opname/${opnameId}`);
  };

  const handleEdit = (opnameId: number) => {
    navigate(`/admin/stock-opname/${opnameId}?edit=true`);
  };

  const handleDeleteClick = (opnameId: number, opnameNumber: string) => {
    setDeleteConfirm({ id: opnameId, number: opnameNumber });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      showToast(
        'success',
        `Stock opname ${deleteConfirm.number} berhasil dihapus dan stock dikembalikan ke semula`
      );
      setDeleteConfirm(null);
      refetch();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus stock opname');
    }
  };

  const handleCreateSuccess = (opnameNumber: string) => {
    showToast('success', `Stock opname ${opnameNumber} berhasil dibuat!`);
    setShowFormModal(false);
    refetch();
  };

  const exportToXLSX = () => {
    if (stockOpnameList.length === 0) {
      showToast('warning', 'Tidak ada data untuk diekspor');
      return;
    }

    try {
      import('xlsx').then((XLSX) => {
        const exportData = stockOpnameList.map((item) => ({
          'Nomor Opname': item.opname_number,
          'Tanggal': new Date(item.transaction_date).toLocaleDateString('id-ID'),
          'Jenis': {
            stock_in: 'Stok Masuk',
            stock_out: 'Stok Keluar',
            adjustment: 'Adjustment',
          }[item.transaction_type] || item.transaction_type,
          'Lokasi': item.location,
          'Alasan': item.reason || '-',
          'Jumlah Item': item.items_count || 0,
          'Dibuat Oleh': item.created_by_email || '-',
          'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID'),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Opname');
        XLSX.writeFile(workbook, `stock-opname-${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('success', 'Data berhasil diekspor');
      });
    } catch (err) {
      showToast('error', 'Gagal mengekspor data');
    }
  };

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="stock-opname"
      title="Stock Opname"
      subtitle="Kelola stock in, stock out, dan adjustment inventory."
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={exportToXLSX}
            aria-label="Export to XLSX"
            className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-green-700 sm:px-4"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="hidden sm:inline">Export XLSX</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            aria-label="Import from XLSX"
            className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-600 px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-amber-700 sm:px-4"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
            <span className="hidden sm:inline">Import XLSX</span>
            <span className="sm:hidden">Import</span>
          </button>
          {!isOwner && (
            <button
              onClick={() => setShowFormModal(true)}
              aria-label="Create Stock Opname"
              className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#ff4b86] px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a] sm:px-4"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">Buat Stock Opname</span>
              <span className="sm:hidden">Buat</span>
            </button>
          )}
        </div>
      }
      onLogout={signOut}
    >
      <section className="flex flex-col gap-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error instanceof Error ? error.message : 'Gagal memuat data stock opname'}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Total: {totalCount} transaksi
          </h2>
        </div>

        {isLoading ? (
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <tbody>
                <TableRowSkeleton columns={6} />
                <TableRowSkeleton columns={6} />
                <TableRowSkeleton columns={6} />
              </tbody>
            </table>
          </div>
        ) : stockOpnameList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
            <span className="material-symbols-outlined mb-4 text-6xl text-gray-400">
              inventory_2
            </span>
            <h3 className="mb-2 text-lg font-bold text-gray-900">Belum ada stock opname</h3>
            <p className="mb-6 text-sm text-gray-500">
              {isOwner
                ? 'Gunakan fitur import untuk menambah stock opname'
                : 'Mulai dengan membuat stock opname pertama Anda'}
            </p>
            {!isOwner && (
              <button
                onClick={() => setShowFormModal(true)}
                className="rounded-lg bg-[#ff4b86] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a]"
              >
                Buat Stock Opname
              </button>
            )}
          </div>
        ) : (
          <>
            <StockOpnameTable
              data={stockOpnameList}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onDelete={(id) => {
                const item = stockOpnameList.find((x) => x.id === id);
                if (item) handleDeleteClick(id, item.opname_number);
              }}
              canDelete={!isOwner}
              canEdit={!isOwner}
            />

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-sm font-sans text-gray-500">
                  Halaman {currentPage} dari {totalPages} ({totalCount} transaksi)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#ff4b86] hover:text-[#ff4b86] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#ff4b86] hover:text-[#ff4b86] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <StockOpnameFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <StockOpnameImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(message) => {
          showToast('success', message);
          setShowImportModal(false);
          refetch();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="material-symbols-outlined text-2xl text-red-600">warning</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hapus Stock Opname?</h3>
            </div>

            <p className="mb-2 text-sm text-gray-600">
              Anda akan menghapus stock opname <strong>{deleteConfirm.number}</strong>
            </p>
            <p className="mb-6 text-sm text-gray-600">
              ⚠️ <strong>Penting:</strong> Stock produk akan dikembalikan ke nilai sebelumnya. Aksi ini tidak dapat dibatalkan.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default StockOpname;
