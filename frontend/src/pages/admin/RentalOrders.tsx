import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Clock, User, Phone, Mail, ArrowRight, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';

type RentalOrderStatus = 'awaiting_payment' | 'paid' | 'active' | 'overdue' | 'returned' | 'cancelled' | 'refunded';

interface RentalOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  rental_start_time: string;
  rental_end_time: string;
  duration_days: number;
  subtotal: number;
  deposit_amount: number;
  total: number;
  status: RentalOrderStatus;
  payment_status: string;
  return_time: string | null;
  late_fee_amount: number;
  damage_fee_amount: number;
  refund_amount: number | null;
  refund_processed: boolean;
  payment_url: string | null;
  payment_expired_at: string | null;
  created_at: string;
}

interface RentalOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  daily_rate: number;
  item_deposit_amount: number;
  total_rental_cost: number;
  initial_condition: Record<string, unknown>;
  return_condition: Record<string, unknown>;
}

export default function RentalOrders() {
  const { signOut } = useAuth();
  const menuSections = useAdminMenuSections();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
  const [orderItems, setOrderItems] = useState<RentalOrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RentalOrderStatus | 'all'>('all');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [customerFormErrors, setCustomerFormErrors] = useState<Record<string, string>>({});

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
    setCustomerFormData({
      fullName: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.customer_address || '',
    });
    setIsEditingCustomer(false);
    fetchOrderItems(order.id);
  };

  const handleReturn = async (returnTime: Date, conditions: Record<number, string>) => {
    if (!selectedOrder) return;

    try {
      // Calculate late fee
      const lateFee = await calculateLateFee(selectedOrder.rental_end_time, returnTime.toISOString());

      // Update order
      const { error: orderError } = await supabase
        .from('rental_orders')
        .update({
          return_time: returnTime.toISOString(),
          late_fee_amount: lateFee,
          status: 'returned',
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // Update items with conditions
      for (const [itemId, condition] of Object.entries(conditions)) {
        await supabase
          .from('rental_order_items')
          .update({
            return_condition: { condition },
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
          damage_fee_amount: totalDamageDeduction,
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

  const handleRefund = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('rental_orders')
        .update({
          refund_processed: true,
          refund_amount: selectedOrder.deposit_amount - selectedOrder.late_fee_amount - selectedOrder.damage_fee_amount,
          status: 'refunded',
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

  const validateCustomerForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerFormData.fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
    if (!customerFormData.email.trim()) newErrors.email = 'Email wajib diisi';
    if (!customerFormData.email.includes('@')) newErrors.email = 'Email tidak valid';
    if (!customerFormData.phone.trim()) newErrors.phone = 'No HP wajib diisi';
    if (!customerFormData.phone.startsWith('08')) newErrors.phone = 'No HP harus dimulai dengan 08';
    if (!customerFormData.address.trim()) newErrors.address = 'Alamat wajib diisi';

    setCustomerFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCustomerInfo = async () => {
    if (!selectedOrder || !validateCustomerForm()) return;

    try {
      const { error } = await supabase
        .from('rental_orders')
        .update({
          customer_name: customerFormData.fullName,
          customer_email: customerFormData.email,
          customer_phone: customerFormData.phone,
          customer_address: customerFormData.address,
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      setSelectedOrder({
        ...selectedOrder,
        customer_name: customerFormData.fullName,
        customer_email: customerFormData.email,
        customer_phone: customerFormData.phone,
        customer_address: customerFormData.address,
      });

      setIsEditingCustomer(false);
      alert('Data customer berhasil diperbarui');
      fetchOrders();
    } catch (error) {
      console.error('Failed to save customer info:', error);
      alert('Gagal menyimpan data customer');
    }
  };

  const handleCustomerFieldChange = (field: string, value: string) => {
    setCustomerFormData(prev => ({ ...prev, [field]: value }));
    if (customerFormErrors[field]) {
      setCustomerFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusColor = (status: RentalOrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RentalOrderStatus) => {
    switch (status) {
      case 'awaiting_payment':
        return 'Menunggu Pembayaran';
      case 'paid':
        return 'Sudah Bayar';
      case 'active':
        return 'Aktif';
      case 'overdue':
        return 'Telat';
      case 'returned':
        return 'Dikembalikan';
      case 'cancelled':
        return 'Dibatalkan';
      case 'refunded':
        return 'Refund';
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
        menuSections={menuSections}
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
      menuSections={menuSections}
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
          <option value="awaiting_payment">Menunggu Pembayaran</option>
          <option value="paid">Sudah Bayar</option>
          <option value="active">Aktif</option>
          <option value="overdue">Telat</option>
          <option value="returned">Dikembalikan</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="refunded">Refund</option>
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
                    {new Date(order.rental_start_time).toLocaleDateString('id-ID')}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {order.duration_days} hari
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {formatCurrency(order.total)}
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
              {/* Customer Info - with Edit Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">👤 Informasi Customer</h3>
                  <button
                    onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      isEditingCustomer
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-main-100 text-main-700 hover:bg-main-200'
                    }`}
                  >
                    {isEditingCustomer ? 'Batal Edit' : 'Edit'}
                  </button>
                </div>

                {isEditingCustomer ? (
                  // Edit Form
                  <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={customerFormData.fullName}
                        onChange={(e) => handleCustomerFieldChange('fullName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                          customerFormErrors.fullName
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-main-500'
                        }`}
                      />
                      {customerFormErrors.fullName && (
                        <p className="text-xs text-red-600 mt-1">{customerFormErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerFormData.email}
                        onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                          customerFormErrors.email
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-main-500'
                        }`}
                      />
                      {customerFormErrors.email && (
                        <p className="text-xs text-red-600 mt-1">{customerFormErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        No HP / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="62812xxxxx"
                        value={customerFormData.phone}
                        onChange={(e) => handleCustomerFieldChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                          customerFormErrors.phone
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-main-500'
                        }`}
                      />
                      {customerFormErrors.phone && (
                        <p className="text-xs text-red-600 mt-1">{customerFormErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Alamat Pengiriman
                      </label>
                      <textarea
                        value={customerFormData.address}
                        onChange={(e) => handleCustomerFieldChange('address', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                          customerFormErrors.address
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-main-500'
                        }`}
                      />
                      {customerFormErrors.address && (
                        <p className="text-xs text-red-600 mt-1">{customerFormErrors.address}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveCustomerInfo}
                        className="flex-1 px-3 py-2 bg-main-600 text-white rounded-lg text-sm font-medium hover:bg-main-700 transition-colors"
                      >
                        💾 Simpan
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingCustomer(false);
                          setCustomerFormErrors({});
                        }}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
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
                        <span>Mulai: {new Date(selectedOrder.rental_start_time).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Kembali: {new Date(selectedOrder.rental_end_time).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>Durasi: {selectedOrder.duration_days} hari</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Item yang Disewa</h3>
                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} x {formatCurrency(item.daily_rate)}/hari</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total_rental_cost)}</p>
                        <p className="text-xs text-gray-600">Deposit: {formatCurrency(item.item_deposit_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Deposit</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Bayar</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedOrder.total)}</span>
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
                      <span className="font-semibold">{formatCurrency(selectedOrder.late_fee_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potongan Kerusakan:</span>
                      <span className="font-semibold">{formatCurrency(selectedOrder.damage_fee_amount)}</span>
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
                {selectedOrder.status === 'awaiting_payment' && selectedOrder.payment_url ? (
                  <a
                    href={selectedOrder.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
                  >
                    Link Pembayaran
                  </a>
                ) : null}
                {selectedOrder.status === 'paid' ? (
                  <button
                    onClick={() => {
                      supabase
                        .from('rental_orders')
                        .update({ status: 'active' })
                        .eq('id', selectedOrder.id)
                        .then(() => {
                          fetchOrders();
                          setSelectedOrder(null);
                        });
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Mulai Sewa
                  </button>
                ) : null}
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
  onSubmit: () => void;
}) {
  const refundAmount = order.deposit_amount - order.late_fee_amount - order.damage_fee_amount;

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
                {formatCurrency(refundAmount)}
              </span>
            </div>
            <div className="mt-2 text-xs text-green-700">
              Deposit: {formatCurrency(order.deposit_amount)} - Denda: {formatCurrency(order.late_fee_amount)} - Kerusakan: {formatCurrency(order.damage_fee_amount)}
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
              onClick={onSubmit}
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
