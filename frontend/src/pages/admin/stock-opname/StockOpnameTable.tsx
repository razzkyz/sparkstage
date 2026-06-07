import type { StockOpname } from '../../../types';

interface StockOpnameTableProps {
  data: StockOpname[];
  onViewDetail: (opnameId: number) => void;
  onEdit: (opnameId: number) => void;
  onDelete: (opnameId: number) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

const transactionTypeLabels: Record<string, string> = {
  stock_in: 'Stok Masuk',
  stock_out: 'Stok Keluar',
  adjustment: 'Adjustment',
};

const transactionTypeColors: Record<string, string> = {
  stock_in: 'bg-green-100 text-green-800',
  stock_out: 'bg-red-100 text-red-800',
  adjustment: 'bg-blue-100 text-blue-800',
};

export const StockOpnameTable = ({ data, onViewDetail, onEdit, onDelete, canDelete = true, canEdit = true }: StockOpnameTableProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Nomor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Jenis
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Lokasi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Alasan
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Dibuat Oleh
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                  {item.opname_number}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {formatDate(item.transaction_date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      transactionTypeColors[item.transaction_type] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {transactionTypeLabels[item.transaction_type] || item.transaction_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.location}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.reason || '-'}
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                  {item.items_count || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.created_by_email || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetail(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Detail
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => onEdit(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                        title="Edit stock opname"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                        title="Hapus stock opname"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
