import { useState } from 'react';
import { useInventory } from '../../../hooks/useInventory';
import { VariantSelector } from './VariantSelector';

interface StockOpnameItem {
  variant_id: number;
  quantity_change: number;
  unit: string;
  cost_per_unit?: number;
}

interface StockOpnameItemSelectorProps {
  items: StockOpnameItem[];
  onAddItem: (item: StockOpnameItem) => void;
  onRemoveItem: (index: number) => void;
  transactionType: 'stock_in' | 'stock_out' | 'adjustment';
}

export const StockOpnameItemSelector = ({
  items,
  onAddItem,
  onRemoveItem,
  transactionType,
}: StockOpnameItemSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantityChange, setQuantityChange] = useState<string>('');
  const [unit, setUnit] = useState('pcs');
  const [costPerUnit, setCostPerUnit] = useState<string>('');

  const { data } = useInventory({
    page: 1,
    pageSize: 50,
    searchQuery,
    categoryFilter: '',
    stockFilter: '',
    activeFilter: 'active',
  });

  const products = data?.products ?? [];

  // Flatten product variants for selection
  const variants = products.flatMap((product) =>
    product.product_variants?.map((variant) => ({
      variant_id: variant.id,
      product_name: product.name,
      variant_name: variant.name,
      variant_sku: variant.sku,
      current_stock: variant.stock ?? 0,
      price: typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price,
    })) ?? []
  );

  const selectedVariant = variants.find((v) => v.variant_id === selectedVariantId);

  const handleAddItem = () => {
    if (!selectedVariantId || !quantityChange) {
      return;
    }

    const qty = parseInt(quantityChange, 10);
    if (isNaN(qty) || qty === 0) {
      return;
    }

    onAddItem({
      variant_id: selectedVariantId,
      quantity_change: transactionType === 'stock_out' ? -Math.abs(qty) : qty,
      unit,
      cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : undefined,
    });

    // Reset form
    setSelectedVariantId(null);
    setQuantityChange('');
    setCostPerUnit('');
  };

  const getItemDisplay = (item: StockOpnameItem) => {
    const variant = variants.find((v) => v.variant_id === item.variant_id);
    if (!variant) return 'Unknown product';
    
    return `${variant.product_name} - ${variant.variant_name} (${variant.variant_sku})`;
  };

  return (
    <div className="space-y-4">
      {/* Product Search & Selection */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cari Produk
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pilih Varian
          </label>
          <VariantSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelectVariant={setSelectedVariantId}
            searchQuery={searchQuery}
            placeholder="-- Pilih varian --"
          />
        </div>

        {selectedVariant && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
            <p className="font-semibold text-blue-900">Stok saat ini: {selectedVariant.current_stock} {unit}</p>
            <p className="text-blue-700 text-xs mt-1">Harga: Rp {selectedVariant.price?.toLocaleString('id-ID') ?? 'N/A'}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah {transactionType === 'stock_out' ? 'Keluar' : 'Masuk'}
            </label>
            <input
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="0"
              min="1"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Satuan
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
            >
              <option value="pcs">Pcs</option>
              <option value="gr">Gram</option>
              <option value="kg">Kg</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Biaya per Unit (Opsional)
          </label>
          <input
            type="number"
            value={costPerUnit}
            onChange={(e) => setCostPerUnit(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#ff4b86] focus:outline-none focus:ring-2 focus:ring-[#ff4b86]/20"
          />
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          disabled={!selectedVariantId || !quantityChange}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#ff4b86] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff6a9a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Produk
        </button>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Produk Terpilih ({items.length})
            </h4>
          </div>
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {getItemDisplay(item)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.quantity_change > 0 ? '+' : ''}{item.quantity_change} {item.unit}
                    {item.cost_per_unit && ` @ Rp ${item.cost_per_unit.toLocaleString('id-ID')}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="ml-4 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
