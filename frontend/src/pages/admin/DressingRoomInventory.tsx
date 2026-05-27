import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import DressingRoomInventoryManager from '../../components/admin/DressingRoomInventoryManager';
import { useDressingRoomInventorySummary } from '../../hooks/useDressingRoomInventory';

export function DressingRoomInventory() {
  const { user, signOut } = useAuth();
  const menuSections = useAdminMenuSections();
  const [isAuthorized, setIsAuthorized] = useState(true);

  const { data: inventory, isLoading: inventoryLoading } = useDressingRoomInventorySummary();

  // Aggregate totals
  const totalStok = inventory?.reduce((sum, item) => sum + (item.total_quantity ?? 0), 0) ?? 0;
  const totalTersedia = inventory?.reduce((sum, item) => sum + (item.available_quantity ?? 0), 0) ?? 0;
  const totalDisewa = inventory?.reduce((sum, item) => sum + (item.reserved_quantity ?? 0), 0) ?? 0;
  const totalLaundry = inventory?.reduce((sum, item) => sum + (item.in_laundry_quantity ?? 0), 0) ?? 0;

  useEffect(() => {
    if (!user) {
      setIsAuthorized(false);
    }
  }, [user]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dressing-room-inventory"
      title="Dressing Room Inventory"
      subtitle="Kelola stok dan produk dressing room"
      onLogout={signOut}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Inventory</h1>
          <p className="text-gray-600 mt-1">
            Update stok, availability, dan tracking barang dressing room Anda
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Total Stok"
            icon="inventory_2"
            color="bg-blue-50 text-blue-700"
            value={inventoryLoading ? null : totalStok}
          />
          <InfoCard
            title="Tersedia"
            icon="check_circle"
            color="bg-green-50 text-green-700"
            value={inventoryLoading ? null : totalTersedia}
          />
          <InfoCard
            title="Sedang Disewa"
            icon="shopping_bag"
            color="bg-yellow-50 text-yellow-700"
            value={inventoryLoading ? null : totalDisewa}
          />
          <InfoCard
            title="Dalam Laundry"
            icon="local_laundry_service"
            color="bg-orange-50 text-orange-700"
            value={inventoryLoading ? null : totalLaundry}
          />
        </div>

        {/* Inventory Manager */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daftar Produk</h2>
          <DressingRoomInventoryManager />
        </div>

        {/* Legend & Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Catatan Penting</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Total:</strong> Jumlah barang fisik yang ada</li>
            <li>• <strong>Available:</strong> Barang yang siap disewa</li>
            <li>• <strong>Reserved:</strong> Barang yang sudah dipesanan/sedang disewa</li>
            <li>• <strong>In Laundry:</strong> Barang dalam proses pembersihan</li>
            <li>• <strong>Damaged:</strong> Barang rusak/cacat</li>
            <li>• Klik tombol edit untuk mengubah stok barang</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

interface InfoCardProps {
  title: string;
  icon: string;
  color: string;
  value: number | null;
}

function InfoCard({ title, icon, color, value }: InfoCardProps) {
  return (
    <div className={`rounded-lg p-4 border border-gray-200 ${color}`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">
            {value === null ? (
              <span className="inline-block h-6 w-10 animate-pulse rounded bg-current opacity-20" />
            ) : (
              value
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DressingRoomInventory;
