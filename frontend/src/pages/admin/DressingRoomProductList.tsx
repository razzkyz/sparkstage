import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Link } from 'react-router-dom';
import { Loader2, Edit2, Trash2, AlertCircle, Upload, Search, ChevronRight } from 'lucide-react';
import { ADMIN_MENU_ITEMS } from '@/constants/adminMenu';
import { useAdminMenuSections } from '@/hooks/useAdminMenuSections';
import { useAuth } from '@/contexts/AuthContext';
import { DressingRoomCSVImportModal, type DressingRoomProductDraft } from '@/components/admin/DressingRoomCSVImportModal';

function DressingRoomProductList() {
  const queryClient = useQueryClient();
  const menuSections = useAdminMenuSections();
  const { signOut } = useAuth();
  
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  // Filter and sort products
  const filteredProducts = products?.filter((product: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term);
  }).sort((a: any, b: any) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  // Single Delete mutation
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

  // Bulk Delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const { error } = await supabase
        .from('dressing_room_products')
        .delete()
        .in('id', productIds);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['dressing-room-products'] });
    },
  });

  // Bulk Toggle mutation
  const bulkToggleMutation = useMutation({
    mutationFn: async ({ productIds, isActive }: { productIds: number[], isActive: boolean }) => {
      const { error } = await supabase
        .from('dressing_room_products')
        .update({ is_active: isActive })
        .in('id', productIds);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['dressing-room-products'] });
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && filteredProducts) {
      setSelectedRows(filteredProducts.map((p: any) => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (productId: number) => {
    setSelectedRows(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleImport = async (drafts: DressingRoomProductDraft[]) => {
    setIsImporting(true);
    try {
      for (const draft of drafts) {
        // Insert product
        const { data: productData, error: productError } = await supabase
          .from('dressing_room_products')
          .insert({
            name: draft.name,
            slug: draft.slug,
            description: draft.description,
            category: draft.category,
            image_url: draft.image_url,
            is_active: draft.is_active,
          })
          .select()
          .single();

        if (productError) {
          console.error('Failed to import product:', productError);
          continue; 
        }

        // Insert variants
        for (const variant of draft.variants) {
          await supabase
            .from('dressing_room_product_variants')
            .insert({
              dressing_room_product_id: productData.id,
              name: variant.name,
              sku: variant.sku,
              size_label: variant.size_label,
              color: variant.color,
              price: variant.price,
              daily_rental_fee: variant.daily_rental_fee,
              total_quantity: variant.total_quantity,
              is_active: true,
            });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dressing-room-products'] });
    } catch (err) {
      console.error('Error importing:', err);
    } finally {
      setIsImporting(false);
      setShowImportModal(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:px-4"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <Link to="/admin/dressing-room-products/create">
            <button className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#ff4b86] px-3 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a] sm:px-4">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="sm:hidden">Tambah</span>
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
          </Link>
        </div>
      }
    >
      <section className="space-y-6">
        {/* Quick Links */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/admin/dressing-room-dashboard" className="hover:text-[#ff4b86] transition-colors">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-gray-900">Produk Dressing Room</span>
        </div>

        {/* Search, Filter, and Bulk Actions Bar */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          {selectedRows.length > 0 ? (
            <div className="flex items-center gap-4 bg-pink-50 px-4 py-2 rounded-lg border border-pink-100 flex-1">
              <span className="text-sm font-bold text-pink-900">{selectedRows.length} produk terpilih</span>
              <div className="flex items-center gap-2 border-l border-pink-200 pl-4">
                <button
                  onClick={() => bulkToggleMutation.mutate({ productIds: selectedRows, isActive: true })}
                  disabled={bulkToggleMutation.isPending}
                  className="text-xs font-semibold px-3 py-1.5 bg-white border border-pink-200 rounded-md text-pink-700 hover:bg-pink-100 transition-colors"
                >
                  Aktifkan
                </button>
                <button
                  onClick={() => bulkToggleMutation.mutate({ productIds: selectedRows, isActive: false })}
                  disabled={bulkToggleMutation.isPending}
                  className="text-xs font-semibold px-3 py-1.5 bg-white border border-pink-200 rounded-md text-pink-700 hover:bg-pink-100 transition-colors"
                >
                  Nonaktifkan
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Hapus ${selectedRows.length} produk?`)) {
                      bulkDeleteMutation.mutate(selectedRows);
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                  className="text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {bulkDeleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all appearance-none bg-white"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                </select>
              </div>
            </div>
          )}
          <div className="text-xs font-semibold text-gray-500 shrink-0">
            {filteredProducts?.length || 0} produk
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <tbody>
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedRows.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Produk</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Kategori</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Varian</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Status</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product: any) => (
                  <tr 
                    key={product.id} 
                    className={`transition-colors hover:bg-gray-50 ${selectedRows.includes(product.id) ? 'bg-pink-50/50' : ''}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(product.id)}
                        onChange={() => handleSelectRow(product.id)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block text-sm text-gray-700 capitalize">{product.category}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {product.dressing_room_product_variants?.length || 0} varian
                      </span>
                    </td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
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
                          <div className="absolute right-8 mt-1 z-50 w-48 rounded-lg border border-gray-200 bg-white shadow-lg p-3">
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
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada produk ditemukan</h3>
            <p className="text-sm text-gray-600 mb-6">Coba sesuaikan kata kunci pencarian Anda atau tambahkan produk baru.</p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hapus Pencarian
                </button>
              )}
              <Link to="/admin/dressing-room-products/create">
                <button className="inline-flex items-center gap-2 rounded-lg bg-[#ff4b86] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#ff6a9a]">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Buat Produk Baru
                </button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Import CSV Modal */}
      <DressingRoomCSVImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        isImporting={isImporting}
      />
    </AdminLayout>
  );
}

export default DressingRoomProductList;
