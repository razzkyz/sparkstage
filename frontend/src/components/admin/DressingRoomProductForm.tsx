import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { uploadPublicAssetToImageKit } from '@/lib/publicImagekitUpload';
import { useDressingRoomSubcategories } from '@/hooks/useDressingRoomCatalog';

interface DressingRoomProductFormProps {
  productId?: string;
  onSuccess?: () => void;
}

interface Variant {
  id?: string;
  name: string;
  sku: string;
  size_label: string;
  color: string;
  price: number;
  daily_rental_fee: number;
  total_quantity: number;
}

export function DressingRoomProductForm({ productId, onSuccess }: DressingRoomProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    category: 'clothing',
    dressing_room_category_id: null as number | null,
    is_active: true,
  });

  const { data: categories = [] } = useDressingRoomSubcategories(1);

  const [variants, setVariants] = useState<Variant[]>([
    {
      name: '',
      sku: '',
      size_label: '',
      color: '',
      price: 0,
      daily_rental_fee: 15000,
      total_quantity: 0,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch existing product if editing
  const { isLoading: isLoadingProduct } = useQuery({
    queryKey: ['dressing-room-product', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('dressing_room_products')
        .select('*, dressing_room_product_variants(*)')
        .eq('id', productId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        slug: data.slug || '',
        image_url: data.image_url || '',
        category: data.category || 'clothing',
        dressing_room_category_id: data.dressing_room_category_id || null,
        is_active: data.is_active !== false,
      });

      if (data.dressing_room_product_variants && data.dressing_room_product_variants.length > 0) {
        setVariants(data.dressing_room_product_variants);
      }

      return data;
    },
    enabled: !!productId,
  });

  // Save product mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upsert product
      const { data: productData, error: productError } = await supabase
        .from('dressing_room_products')
        .upsert(
          {
            id: productId ? parseInt(productId) : undefined,
            ...formData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (productError) throw productError;

      // Save variants
      for (const variant of variants) {
        if (!variant.sku) continue;

        const { error: variantError } = await supabase
          .from('dressing_room_product_variants')
          .upsert(
            {
              id: variant.id ? parseInt(variant.id) : undefined,
              dressing_room_product_id: productData.id,
              ...variant,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

        if (variantError) throw variantError;
      }

      return productData;
    },
    onSuccess: () => {
      setError(null);
      onSuccess?.();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save product');
    },
  });

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        name: '',
        sku: '',
        size_label: '',
        color: '',
        price: 0,
        daily_rental_fee: 15000,
        total_quantity: 0,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const fileName = `dressing-room-product-${Date.now()}-${file.name}`;
      const imageUrl = await uploadPublicAssetToImageKit({
        file,
        fileName,
        folderPath: 'dressing-room-products',
      });
      setFormData({ ...formData, image_url: imageUrl });
    } catch (err: any) {
      setError(err.message || 'Gagal upload gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    };
    setVariants(newVariants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      setError('Name and slug are required');
      return;
    }

    if (!formData.dressing_room_category_id) {
      setError('Category selection is required');
      return;
    }

    if (variants.some(v => !v.sku)) {
      setError('All variants must have a SKU');
      return;
    }

    saveMutation.mutate();
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4 border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900">Informasi Produk</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Produk *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Gaun Pengantin Putih"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug (URL) *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
              })
            }
            placeholder="gaun-pengantin-putih"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deskripsi detail produk..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori *
          </label>
          <select
            value={formData.dressing_room_category_id || ''}
            onChange={(e) => setFormData({
              ...formData,
              dressing_room_category_id: e.target.value ? parseInt(e.target.value) : null,
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          
          {formData.image_url ? (
            <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center mb-3">
              <img
                src={formData.image_url}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image_url: '' })}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Hapus gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            } ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              id="image-upload"
              disabled={uploadingImage}
            />
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {uploadingImage ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-600">Upload sedang berlangsung...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">Drag gambar atau klik untuk upload</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (Max 5MB)</p>
                </>
              )}
            </label>
          </div>

          <p className="text-xs text-gray-500 mt-2">Atau masukkan URL gambar secara manual:</p>
          <input
            type="text"
            value={formData.image_url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500 mt-2"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Aktif</span>
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Varian Produk</h3>
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-2 px-3 py-2 bg-main-100 text-main-700 rounded-lg text-sm font-medium hover:bg-main-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Varian
          </button>
        </div>

        {variants.map((variant, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg bg-gray-50 space-y-3"
          >
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900">Varian {index + 1}</h4>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Varian
                </label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'name', e.target.value)}
                  placeholder="Contoh: Size S"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'sku', e.target.value)}
                  placeholder="SKU123"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ukuran
                </label>
                <input
                  type="text"
                  value={variant.size_label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'size_label', e.target.value)}
                  placeholder="S, M, L"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Warna
                </label>
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'color', e.target.value)}
                  placeholder="Putih, Biru, dll"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                  placeholder="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Biaya Sewa/Hari (Rp)
                </label>
                <input
                  type="number"
                  value={variant.daily_rental_fee}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleVariantChange(index, 'daily_rental_fee', parseFloat(e.target.value))
                  }
                  placeholder="15000"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Total Stok
                </label>
                <input
                  type="number"
                  value={variant.total_quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleVariantChange(index, 'total_quantity', parseInt(e.target.value))
                  }
                  placeholder="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-main-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saveMutation.isPending || uploadingImage}
          className="px-4 py-2 bg-main-600 text-white rounded-lg font-medium hover:bg-main-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {productId ? 'Update Produk' : 'Buat Produk'}
        </button>
      </div>
    </form>
  );
}
