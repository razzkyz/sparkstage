import { useState, useRef } from 'react';

export interface DressingRoomProductDraft {
  id?: number;
  name: string;
  slug: string;
  description: string;
  dressing_room_category_id: number | null;
  category: string;
  image_url: string;
  is_active: boolean;
  variants: Array<{
    name: string;
    sku: string;
    size_label: string;
    color: string;
    price: number;
    daily_rental_fee: number;
    total_quantity: number;
  }>;
}

interface CSVProductRow {
  name: string;
  sku: string;
  description?: string;
  price?: string;
  daily_rental_fee?: string;
  stock?: string;
  variant_name?: string;
  color?: string;
  size?: string;
}

interface DressingRoomCSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: DressingRoomProductDraft[]) => Promise<void>;
  isImporting: boolean;
}

export function DressingRoomCSVImportModal({
  isOpen,
  onClose,
  onImport,
  isImporting,
}: DressingRoomCSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedProducts, setParsedProducts] = useState<DressingRoomProductDraft[]>([]);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setParsedProducts([]);
    setFileName(file.name);

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      
      if (lines.length < 2) {
        throw new Error('CSV harus memiliki header dan minimal 1 data row');
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredCols = ['name', 'sku'];
      const missingCols = requiredCols.filter(col => !headers.includes(col));
      
      if (missingCols.length > 0) {
        throw new Error(`Kolom wajib tidak ada: ${missingCols.join(', ')}`);
      }

      // Parse rows
      const products: DressingRoomProductDraft[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Partial<CSVProductRow> = {};
        
        headers.forEach((header, idx) => {
          row[header as keyof CSVProductRow] = values[idx] || '';
        });

        if (!row.name || !row.sku) continue;

        const price = parseFloat(row.price || '0');
        const dailyRentalFee = parseFloat(row.daily_rental_fee || '15000');
        const stock = parseInt(row.stock || '1', 10) || 1;

        products.push({
          name: row.name,
          slug: row.name.toLowerCase().replace(/\s+/g, '-'),
          description: row.description || '',
          category: 'clothing',
          dressing_room_category_id: null,
          image_url: '',
          is_active: true,
          variants: [
            {
              name: row.variant_name || 'Default',
              sku: row.sku,
              price: price,
              daily_rental_fee: dailyRentalFee,
              total_quantity: stock,
              color: row.color || '',
              size_label: row.size || '',
            },
          ],
        });
      }

      if (products.length === 0) {
        throw new Error('Tidak ada produk yang valid di CSV');
      }

      setParsedProducts(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal parse CSV');
      setParsedProducts([]);
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) return;

    try {
      await onImport(parsedProducts);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Import Katalog Dressing Room</h2>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-6 rounded-lg bg-pink-50 border border-pink-200 p-4">
          <p className="text-sm text-pink-900 font-medium mb-2">Format CSV:</p>
          <p className="text-xs text-pink-800 font-mono mb-2">
            name, sku, description, price, daily_rental_fee, stock, variant_name, color, size
          </p>
          <p className="text-xs text-pink-800">
            Wajib: name, sku | Opsional: yang lainnya
          </p>
        </div>

        {/* File input */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isImporting}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
          />
          {fileName && (
            <p className="mt-2 text-xs text-gray-600">File: <strong>{fileName}</strong></p>
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
              Preview ({parsedProducts.length} produk akan ditambahkan ke kategori Dressing Room)
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nama</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">SKU</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Biaya Sewa</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{p.name}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs font-mono">{p.variants[0].sku}</td>
                      <td className="px-4 py-2 text-gray-600">Rp {p.variants[0].daily_rental_fee}</td>
                      <td className="px-4 py-2 text-gray-600">{p.variants[0].total_quantity}</td>
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
            className="px-4 py-2 rounded-lg bg-pink-600 text-sm font-semibold text-white hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {isImporting ? 'Importing...' : `Import ${parsedProducts.length} Katalog`}
          </button>
        </div>
      </div>
    </div>
  );
}
