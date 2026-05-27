import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { DressingRoomProductForm } from '@/components/admin/DressingRoomProductForm';
import { ArrowLeft } from 'lucide-react';
import { ADMIN_MENU_ITEMS } from '@/constants/adminMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMenuSections } from '@/hooks/useAdminMenuSections';

function DressingRoomProductCreate() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dressing-room-products"
      title="Buat Produk Baru"
      subtitle="Tambahkan produk sewa pakaian ke katalog"
      onLogout={signOut}
    >
      <section className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-600 transition-all hover:border-gray-300 hover:bg-white"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">Buat Produk Sewa Pakaian Baru</h2>
            <p className="text-sm text-gray-500">Isi form untuk menambahkan produk ke katalog</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <DressingRoomProductForm
            onSuccess={() => {
              navigate('/admin/dressing-room-products');
            }}
          />
        </div>
      </section>
    </AdminLayout>
  );
}export default DressingRoomProductCreate;
