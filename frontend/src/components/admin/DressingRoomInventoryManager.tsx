import { useState } from 'react';
import { Edit2, Save, X, Loader } from 'lucide-react';
import { useDressingRoomInventorySummary, useUpdateDressingRoomInventory } from '../../hooks/useDressingRoomInventory';
import type { DressingRoomInventorySummary } from '../../types/dressingRoom';

interface InventoryFormState {
  variantId: number;
  totalQty: number;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  inLaundryQty: number;
}

export function DressingRoomInventoryManager() {
  const { data: inventory, isLoading, error, refetch } = useDressingRoomInventorySummary();
  const updateInventory = useUpdateDressingRoomInventory();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<InventoryFormState | null>(null);
  const [filterProduct, setFilterProduct] = useState('');

  const products = inventory ? [...new Set(inventory.map((item) => item.product_name))] : [];

  const filteredInventory = inventory?.filter((item) =>
    !filterProduct || item.product_name === filterProduct
  );

  const handleEdit = (item: DressingRoomInventorySummary) => {
    setEditingId(item.variant_id);
    setFormState({
      variantId: item.variant_id,
      totalQty: item.total_quantity,
      availableQty: item.available_quantity,
      reservedQty: item.reserved_quantity,
      damagedQty: item.damaged_quantity,
      inLaundryQty: item.in_laundry_quantity,
    });
  };

  const handleSave = async () => {
    if (!formState) return;

    try {
      await updateInventory.mutateAsync({
        variantId: formState.variantId,
        totalQty: formState.totalQty,
        availableQty: formState.availableQty,
        reservedQty: formState.reservedQty,
        damagedQty: formState.damagedQty,
        inLaundryQty: formState.inLaundryQty,
      });

      setEditingId(null);
      setFormState(null);
    } catch (err) {
      console.error('Failed to update inventory:', err);
      alert('Gagal update inventory');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Error loading inventory</p>
        <p className="text-red-700 text-sm mt-1">{String(error)}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Produk</option>
          {products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
        {filterProduct && (
          <button
            onClick={() => setFilterProduct('')}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Produk</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Varian</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Available</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Reserved</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Laundry</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Damaged</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Harga</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInventory && filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.variant_id} className="hover:bg-gray-50">
                  {editingId === item.variant_id && formState ? (
                    <>
                      <td colSpan={10} className="px-4 py-3 bg-blue-50">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700">Total</label>
                              <input
                                type="number"
                                value={formState.totalQty}
                                onChange={(e) =>
                                  setFormState({ ...formState, totalQty: parseInt(e.target.value) || 0 })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Available</label>
                              <input
                                type="number"
                                value={formState.availableQty}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    availableQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Reserved</label>
                              <input
                                type="number"
                                value={formState.reservedQty}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    reservedQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">In Laundry</label>
                              <input
                                type="number"
                                value={formState.inLaundryQty}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    inLaundryQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700">Damaged</label>
                              <input
                                type="number"
                                value={formState.damagedQty}
                                onChange={(e) =>
                                  setFormState({
                                    ...formState,
                                    damagedQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleSave}
                              disabled={updateInventory.isPending}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {updateInventory.isPending ? (
                                <>
                                  <Loader className="h-4 w-4 animate-spin" />
                                  Menyimpan...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  Simpan
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setFormState(null);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm font-medium hover:bg-gray-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              Batal
                            </button>
                          </div>

                          {updateInventory.error && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                              Error: {String(updateInventory.error)}
                            </div>
                          )}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-900 font-medium">{item.product_name}</td>
                      <td className="px-4 py-3 text-gray-700">{item.variant_name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs bg-gray-50">{item.sku}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {item.total_quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-green-600 font-semibold bg-green-50/50">
                        {item.available_quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold bg-blue-50/50">
                        {item.reserved_quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-yellow-600 font-semibold bg-yellow-50/50">
                        {item.in_laundry_quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-red-600 font-semibold bg-red-50/50">
                        {item.damaged_quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        Rp {(item.price).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={editingId !== null}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title="Edit inventory"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-600">
                  Tidak ada inventory dressing room
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-green-200 rounded"></div>
          <span>Available (Tersedia)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-blue-200 rounded"></div>
          <span>Reserved (Disewa)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-yellow-200 rounded"></div>
          <span>In Laundry (Laundry)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-red-200 rounded"></div>
          <span>Damaged (Rusak)</span>
        </div>
      </div>
    </div>
  );
}

export default DressingRoomInventoryManager;
