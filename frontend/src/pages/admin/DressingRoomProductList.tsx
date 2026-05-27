import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { ADMIN_MENU_ITEMS } from '@/constants/adminMenu';
import { useAdminMenuSections } from '@/hooks/useAdminMenuSections';
import { useAuth } from '@/contexts/AuthContext';

function DressingRoomProductList() {
  const queryClient = useQueryClient();
  const menuSections = useAdminMenuSections();
  const { signOut } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Fetch products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['dressing-room-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dressing_room_products')
        .select(`
          id,
          name,
          slug,
          category,
          image_url,
          is_active,
          created_at,
          dressing_room_product_variants(id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { error } = await supabase
        .from('dressing_room_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['dressing-room-products'] });
    },
  });

  if (error) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={menuSections}
        defaultActiveMenuId="dressing-room-products"
        title="Produk Dressing Room"
        onLogout={signOut}
      >
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error loading products</h3>
            <p className="text-sm text-red-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dressing-room-products"
      title="Produk Dressing Room"
      subtitle="Kelola katalog produk sewa pakaian"
      onLogout={signOut}
      headerActions={
        <Link to="/admin/dressing-room-products/create">
          <button className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#ff4b86] px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a] sm:px-4">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="sm:hidden">Tambah</span>
            <span className="hidden sm:inline">Tambah Produk</span>
          </button>
        </Link>
      }
    >
      <section className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Daftar Produk Sewa Pakaian</p>
            <p className="mt-1 text-xs text-gray-500">{products?.length || 0} produk tersedia</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <tbody>
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : products && products.length > 0 ? (
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Produk</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Kategori</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Varian</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product: any) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-sm text-gray-700">{product.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {product.dressing_room_product_variants?.length || 0} varian
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          product.is_active
                            ? 'bg-green-100/80 text-green-700'
                            : 'bg-gray-100/80 text-gray-600'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/admin/dressing-room-products/${product.id}/edit`}>
                          <button
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {deleteConfirm === product.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-200 bg-white shadow-lg p-3">
                            <p className="text-sm font-semibold text-gray-900 mb-3">Hapus produk?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(product.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {deleteMutation.isPending ? 'Hapus...' : 'Ya, Hapus'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <Plus className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Produk Dressing Room</h3>
            <p className="text-sm text-gray-600 mb-6">Mulai dengan membuat produk sewa pakaian pertama Anda</p>
            <Link to="/admin/dressing-room-products/create">
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#ff4b86] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a]">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Buat Produk Pertama
              </button>
            </Link>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}

export default DressingRoomProductList;
