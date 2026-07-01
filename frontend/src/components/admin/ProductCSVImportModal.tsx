import { useState, useRef } from 'react';
import type { ProductDraft } from './ProductFormModal';
import { downloadStoreProductTemplateExcel, parseStoreProductsFromFile } from '../../utils/storeExcelUtils';
import { useCategories } from '../../hooks/useCategories';
import { useRetailCategories } from '../../hooks/useRetailCategories';
import { supabase } from '../../lib/supabase';

interface ProductCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: ProductDraft[]) => Promise<void>;
  isImporting: boolean;
}

export function ProductCSVImportModal({
  isOpen,
  onClose,
  onImport,
  isImporting,
}: ProductCSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedProducts, setParsedProducts] = useState<ProductDraft[]>([]);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: categories } = useCategories();
  const { categories: retailCategories, createCategory } = useRetailCategories();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedProducts([]);
    setFileName(file.name);

    try {
      const products = await parseStoreProductsFromFile(file);
      setParsedProducts(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal parse file');
      setParsedProducts([]);
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;

    try {
      const drafts: ProductDraft[] = [];
      let currentRetailCategories = [...(retailCategories || [])];

      // Ambil daftar slug produk yang sudah ada untuk fitur UPSERT (Update/Insert)
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, slug')
        .is('deleted_at', null);
      
      const existingSlugMap = new Map(
        (existingProducts || []).map(p => [p.slug, p.id])
      );

      for (const p of parsedProducts) {
        let matchedCategoryId = p.category_id;
        if (!matchedCategoryId && p.category_name && categories) {
          const matched = categories.find(c => c.name.toLowerCase() === p.category_name!.toLowerCase());
          if (matched) {
            matchedCategoryId = matched.id;
          }
        }

        let matchedRetailCategoryId = p.retail_category_id;
        if (!matchedRetailCategoryId && p.retail_category_name) {
          const dept = p.category_name?.toLowerCase() || 'glam';
          const validDept = ['glam', 'charmbar', 'sparkclub', 'dressing'].includes(dept) ? (dept as 'glam' | 'charmbar' | 'sparkclub' | 'dressing') : 'glam';

          let matchedRetail = currentRetailCategories.find(c => 
            c.name.toLowerCase() === p.retail_category_name!.toLowerCase() &&
            c.parent_id === null &&
            c.department.toLowerCase() === validDept
          );

          if (!matchedRetail && createCategory) {
            // Auto-create category
            const newCategory = await createCategory({
              name: p.retail_category_name,
              department: validDept,
              slug: `${validDept}-${p.retail_category_name.toLowerCase().replace(/\s+/g, '-')}`,
              parent_id: null,
              is_active: true
            });
            currentRetailCategories.push(newCategory);
            matchedRetail = newCategory;
          }

          if (matchedRetail) {
            matchedRetailCategoryId = matchedRetail.id;
          }
        }

        let matchedRetailSubcategoryId = p.retail_subcategory_id;
        if (!matchedRetailSubcategoryId && p.retail_subcategory_name && matchedRetailCategoryId) {
          const dept = p.category_name?.toLowerCase() || 'glam';
          const validDept = ['glam', 'charmbar', 'sparkclub', 'dressing'].includes(dept) ? (dept as 'glam' | 'charmbar' | 'sparkclub' | 'dressing') : 'glam';

          let matchedSub = currentRetailCategories.find(c => 
            c.name.toLowerCase() === p.retail_subcategory_name!.toLowerCase() &&
            c.parent_id === matchedRetailCategoryId
          );

          if (!matchedSub && createCategory) {
            // Auto-create subcategory
            const newSub = await createCategory({
              name: p.retail_subcategory_name,
              department: validDept,
              slug: `${validDept}-${p.retail_category_name?.toLowerCase().replace(/\s+/g, '-')}-${p.retail_subcategory_name.toLowerCase().replace(/\s+/g, '-')}`,
              parent_id: matchedRetailCategoryId,
              is_active: true
            });
            currentRetailCategories.push(newSub);
            matchedSub = newSub;
          }

          if (matchedSub) {
            matchedRetailSubcategoryId = matchedSub.id;
          }
        }

        const productId = existingSlugMap.get(p.slug) || undefined;

        drafts.push({
          id: productId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          category_id: matchedCategoryId,
          category_name: p.category_name,
          retail_category_id: matchedRetailCategoryId,
          retail_category_name: p.retail_category_name,
          retail_subcategory_id: matchedRetailSubcategoryId,
          retail_subcategory_name: p.retail_subcategory_name,
          sku: p.sku,
          is_active: p.is_active,
          variants: p.variants,
        });
      }

      await onImport(drafts);
      setParsedProducts([]);
      setFileName('');
      setError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal import produk');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Produk Excel</h2>
            <p className="text-sm text-gray-500">Upload file .xls atau .xlsx untuk menambahkan produk secara batch.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm text-blue-900 font-bold mb-2">Panduan Import & Export Excel</p>
              <ul className="text-xs text-blue-800 space-y-2 list-disc pl-4">
                <li>
                  <strong className="font-semibold">Sistem Aman (Update & Insert):</strong> Sistem hanya akan memproses data yang ada di file Excel. Produk lama yang <strong>tidak disertakan</strong> di dalam file Excel <strong>TIDAK AKAN terhapus atau terganggu</strong>.
                </li>
                <li>
                  <strong className="font-semibold">Template Kosong:</strong> Unduh ini jika Anda ingin menginput banyak produk baru dari nol. Hanya berisi kolom format dan daftar nama kategori.
                </li>
                <li>
                  <strong className="font-semibold">Export Data Excel:</strong> Unduh ini jika Anda ingin melakukan <em>update massal</em> (contoh: ubah harga/stok). File akan berisi semua data produk di toko saat ini.
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
              <button
                type="button"
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true);
                  await downloadStoreProductTemplateExcel(categories || [], retailCategories || [], false);
                  setIsDownloading(false);
                }}
                className="flex-1 sm:flex-none justify-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDownloading && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />}
                <span className="material-symbols-outlined text-[16px]">description</span>
                Template Kosong
              </button>
              <button
                type="button"
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true);
                  await downloadStoreProductTemplateExcel(categories || [], retailCategories || [], true);
                  setIsDownloading(false);
                }}
                className="flex-1 sm:flex-none justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isDownloading && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export Data Excel
              </button>
            </div>
          </div>
        </div>

        {/* File input */}
        <div className="mb-6">
          <label className="flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-white">
            <span className="material-symbols-outlined text-4xl text-gray-500">upload_file</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Klik untuk pilih file Excel</p>
              <p className="text-xs text-gray-500">Format: .xlsx, .xls</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              disabled={isImporting}
              className="hidden"
            />
          </label>
          {fileName && (
            <p className="mt-3 text-xs text-gray-600">File yang dipilih: <strong>{fileName}</strong></p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Preview */}
        {parsedProducts.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Preview ({parsedProducts.length} produk akan ditambahkan)
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nama</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Harga</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{p.name}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs font-mono">{p.sku}</td>
                      <td className="px-4 py-2 text-gray-600">Rp {p.variants[0].price}</td>
                      <td className="px-4 py-2 text-gray-600">{p.variants[0].stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={parsedProducts.length === 0 || isImporting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {isImporting ? 'Importing...' : `Import ${parsedProducts.length} Produk`}
          </button>
        </div>
      </div>
    </div>
  );
}
