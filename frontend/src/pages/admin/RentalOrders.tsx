import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Clock, User, Phone, Mail, ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS, ADMIN_MENU_SECTIONS } from '../../constants/adminMenu';
import { useAuth } from '../../contexts/AuthContext';

type RentalOrderStatus = 'active' | 'due_soon' | 'overdue' | 'returned' | 'refund_process' | 'completed';

interface RentalOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  start_time: string;
  end_time: string;
  duration_days: number;
  total_rental_cost: number;
  total_deposit: number;
  total_amount: number;
  status: RentalOrderStatus;
  return_time: string | null;
  late_fee: number;
  damage_deduction: number;
  refund_amount: number | null;
  refund_processed: boolean;
  refund_proof_url: string | null;
  created_at: string;
}

interface RentalOrderItem {
  id: number;
  product_name: string;
  variant_name: string | null;
  product_price: number;
  deposit_amount: number;
  rental_cost: number;
  total_item_cost: number;
  return_condition: string | null;
  damage_deduction: number;
  deposit_refunded: number;
}

export default function RentalOrders() {
  const { signOut } = useAuth();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
  const [orderItems, setOrderItems] = useState<RentalOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalOrderStatus | 'all'>('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rental_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: number) => {
    try {
      const { data, error } = await supabase
        .from('rental_order_items')
        .select('*')
        .eq('rental_order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Failed to fetch order items:', error);
    }
  };

  const handleOrderClick = (order: RentalOrder) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const handleReturn = async (returnTime: Date, conditions: Record<number, string>) => {
    if (!selectedOrder) return;

    try {
      // Calculate late fee
      const lateFee = await calculateLateFee(selectedOrder.end_time, returnTime.toISOString());

      // Update order
      const { error: orderError } = await supabase
        .from('rental_orders')
        .update({
          return_time: returnTime.toISOString(),
          late_fee: lateFee,
          status: 'returned',
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Update items with conditions
      for (const [itemId, condition] of Object.entries(conditions)) {
        const damageDeduction = getDamageDeduction(condition);
        await supabase
          .from('rental_order_items')
          .update({
            return_condition: condition,
            damage_deduction: damageDeduction,
          })
          .eq('id', parseInt(itemId));
      }

      // Calculate total damage deduction
      const totalDamageDeduction = Object.values(conditions).reduce(
        (sum, cond) => sum + getDamageDeduction(cond),
        0
      );

      // Update order with damage deduction
      await supabase
        .from('rental_orders')
        .update({
          damage_deduction: totalDamageDeduction,
        })
        .eq('id', selectedOrder.id);

      setShowReturnModal(false);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to process return:', error);
      alert('Gagal memproses pengembalian');
    }
  };

  const handleRefund = async (refundProofUrl: string) => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('rental_orders')
        .update({
          refund_processed: true,
          refund_processed_at: new Date().toISOString(),
          refund_proof_url: refundProofUrl,
          status: 'completed',
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      setShowRefundModal(false);
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('Gagal memproses refund');
    }
  };

  const calculateLateFee = async (endTime: string, returnTime: string): Promise<number> => {
    const { data, error } = await supabase.rpc('calculate_late_fee', {
      end_time: endTime,
      return_time: returnTime,
    });

    if (error) throw error;
    return data || 0;
  };

  const getDamageDeduction = (condition: string): number => {
    switch (condition) {
      case 'normal':
        return 0;
      case 'stained':
        return 10000;
      case 'button_missing':
        return 10000;
      case 'damaged':
        return 10000;
      case 'severely_damaged':
        return 0; // Deposit hangus, handled separately
      default:
        return 0;
    }
  };

  const getStatusColor = (status: RentalOrderStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      case 'refund_process':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RentalOrderStatus) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'due_soon':
        return 'Segera Kembali';
      case 'overdue':
        return 'Telat';
      case 'returned':
        return 'Dikembalikan';
      case 'refund_process':
        return 'Proses Refund';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={ADMIN_MENU_SECTIONS}
        defaultActiveMenuId="rental-orders"
        title="Sewa Dressing Room"
        onLogout={signOut}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={ADMIN_MENU_SECTIONS}
      defaultActiveMenuId="rental-orders"
      title="Sewa Dressing Room"
      onLogout={signOut}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sewa Dressing Room</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola pesanan sewa baju dan proses pengembalian</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-main-600 text-white rounded-lg hover:bg-main-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Sistem Sewa Baju – Flow & Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-1">💰 Harga Sewa:</p>
            <p>• Per item / per hari (15rb/hari)</p>
            <p>• Deposit: 75% dari harga produk</p>
          </div>
          <div>
            <p className="font-semibold mb-1">⏰ Denda Telat:</p>
            <p>• 5rb per jam</p>
            <p>• Bernoda: 10rb</p>
            <p>• Kancing copot: 10rb</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor order, nama, atau no HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RentalOrderStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="due_soon">Segera Kembali</option>
          <option value="overdue">Telat</option>
          <option value="returned">Dikembalikan</option>
          <option value="refund_process">Proses Refund</option>
          <option value="completed">Selesai</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOrderClick(order)}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{order.order_number}</div>
                  <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{order.customer_name}</div>
                  <div className="text-xs text-gray-500">{order.customer_phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.start_time).toLocaleDateString('id-ID')}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {order.duration_days} hari
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrderClick(order);
                    }}
                    className="text-main-600 hover:text-main-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedOrder.order_number}</h2>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{selectedOrder.customer_email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Mulai: {new Date(selectedOrder.start_time).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Kembali: {new Date(selectedOrder.end_time).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Durasi: {selectedOrder.duration_days} hari</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Item yang Disewa</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-600">{item.variant_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total_item_cost)}</p>
                        <p className="text-xs text-gray-600">Deposit: {formatCurrency(item.deposit_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Sewa</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.total_rental_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Deposit</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.total_deposit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Bayar</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Return/Refund Info */}
              {selectedOrder.status === 'returned' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Info Pengembalian</h3>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <div className="flex justify-between">
                      <span>Waktu Kembali:</span>
                      <span className="font-semibold">
                        {selectedOrder.return_time ? new Date(selectedOrder.return_time).toLocaleString('id-ID') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denda Telat:</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.late_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potongan Kerusakan:</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.damage_deduction)}</span>
                    </div>
                    <div className="flex justify-between border-t border-yellow-300 pt-2">
                      <span className="font-semibold">Refund:</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(selectedOrder.refund_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedOrder.status === 'active' || selectedOrder.status === 'overdue' ? (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="flex-1 px-4 py-3 bg-main-600 text-white rounded-lg hover:bg-main-700 transition-colors font-semibold"
                  >
                    Proses Pengembalian
                  </button>
                ) : null}
                {selectedOrder.status === 'returned' && !selectedOrder.refund_processed ? (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Proses Refund
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedOrder && (
        <ReturnModal
          order={selectedOrder}
          items={orderItems}
          onClose={() => setShowReturnModal(false)}
          onSubmit={handleReturn}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <RefundModal
          order={selectedOrder}
          onClose={() => setShowRefundModal(false)}
          onSubmit={handleRefund}
        />
      )}
      </div>
    </AdminLayout>
  );
}

// Return Modal Component
function ReturnModal({
  order,
  items,
  onClose,
  onSubmit,
}: {
  order: RentalOrder;
  items: RentalOrderItem[];
  onClose: () => void;
  onSubmit: (returnTime: Date, conditions: Record<number, string>) => void;
}) {
  const [returnTime, setReturnTime] = useState(new Date());
  const [conditions, setConditions] = useState<Record<number, string>>({});

  const handleSubmit = () => {
    onSubmit(returnTime, conditions);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Proses Pengembalian</h2>
          <p className="text-sm text-gray-600">{order.order_number}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Return Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Waktu Kembali</label>
            <input
              type="datetime-local"
              value={returnTime.toISOString().slice(0, 16)}
              onChange={(e) => setReturnTime(new Date(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
            />
          </div>

          {/* Item Conditions */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Kondisi Item</label>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">{item.product_name}</p>
                  <select
                    value={conditions[item.id] || 'normal'}
                    onChange={(e) => setConditions({ ...conditions, [item.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="stained">Bernoda (-10rb)</option>
                    <option value="button_missing">Kancing Copot (-10rb)</option>
                    <option value="damaged">Rusak Ringan (-10rb)</option>
                    <option value="severely_damaged">Rusak Parah (Deposit Hangus)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-main-600 text-white rounded-lg hover:bg-main-700 transition-colors font-semibold"
            >
              Proses
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Refund Modal Component
function RefundModal({
  order,
  onClose,
  onSubmit,
}: {
  order: RentalOrder;
  onClose: () => void;
  onSubmit: (refundProofUrl: string) => void;
}) {
  const [refundProofUrl, setRefundProofUrl] = useState('');

  const handleSubmit = () => {
    onSubmit(refundProofUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Proses Refund</h2>
          <p className="text-sm text-gray-600">{order.order_number}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Refund Amount */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-green-900 font-semibold">Total Refund</span>
              <span className="text-green-900 font-bold text-2xl">
                {formatCurrency(order.refund_amount || 0)}
              </span>
            </div>
          </div>

          {/* Proof URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">URL Bukti Transfer</label>
            <input
              type="url"
              value={refundProofUrl}
              onChange={(e) => setRefundProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Konfirmasi Refund
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
