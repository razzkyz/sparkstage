import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../../components/Toast';

type PurchasedTicketStatus = 'active' | 'used' | 'cancelled' | 'expired';

interface PurchasedTicket {
  id: number;
  ticket_id: number;
  ticket_code: string | null;
  ticket_name: string | null;
  user_id: string;
  valid_date: string;
  time_slot: string | null;
  queue_number: number | null;
  status: PurchasedTicketStatus;
  used_at: string | null;
  created_at: string;
  order_item_id: number | null;
}

export default function EventBookings() {
  const { signOut, isAdmin } = useAuth();
  const { showToast } = useToast();
  const menuSections = useAdminMenuSections();
  const [bookings, setBookings] = useState<PurchasedTicket[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<PurchasedTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [timeSlotFilter, setTimeSlotFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<PurchasedTicket | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase
        .from('purchased_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PurchasedTicketStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: PurchasedTicketStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'used':
        return 'Used';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      (booking.ticket_code && booking.ticket_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (booking.ticket_name && booking.ticket_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      booking.user_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !dateFilter || booking.valid_date === dateFilter;
    
    const matchesTimeSlot = !timeSlotFilter || booking.time_slot === timeSlotFilter;
    
    return matchesSearch && matchesDate && matchesTimeSlot;
  });

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    used: bookings.filter(b => b.status === 'used').length,
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', `Kode "${text}" sudah di-copy!`);
    }).catch(() => {
      showToast('error', 'Gagal copy ke clipboard');
    });
  }, [showToast]);

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newTimeSlot) {
      showToast('error', 'Pilih sesi baru terlebih dahulu');
      return;
    }

    setRescheduling(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      console.log('Rescheduling ticket:', rescheduleBooking.id, 'to time_slot:', newTimeSlot);

      const { error } = await supabase
        .from('purchased_tickets')
        .update({ time_slot: newTimeSlot })
        .eq('id', rescheduleBooking.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      showToast('success', 'Jadwal sesi berhasil diubah');
      setRescheduleModalOpen(false);
      setRescheduleBooking(null);
      setNewTimeSlot('');
      fetchBookings();
    } catch (error) {
      console.error('Failed to reschedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengubah jadwal sesi';
      showToast('error', errorMessage);
    } finally {
      setRescheduling(false);
    }
  };

  const openRescheduleModal = (booking: PurchasedTicket) => {
    setRescheduleBooking(booking);
    setNewTimeSlot(booking.time_slot || '');
    setRescheduleModalOpen(true);
  };

  const closeRescheduleModal = () => {
    setRescheduleModalOpen(false);
    setRescheduleBooking(null);
    setNewTimeSlot('');
  };

  if (loading) {
    return (
      <AdminLayout
        menuItems={ADMIN_MENU_ITEMS}
        menuSections={menuSections}
        defaultActiveMenuId="event-bookings"
        title="Event Bookings"
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
      defaultActiveMenuId="event-bookings"
      title="Event Bookings"
      onLogout={signOut}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Bookings</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola pesanan tiket event</p>
          </div>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-4 py-2 bg-main-600 text-white rounded-lg hover:bg-main-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Used</p>
            <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Cari ticket code, ticket name, atau user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
          />
          <select
            value={timeSlotFilter}
            onChange={(e) => setTimeSlotFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
          >
            <option value="">Semua Sesi</option>
            <option value="09:00:00">09:00</option>
            <option value="12:00:00">12:00</option>
            <option value="15:00:00">15:00</option>
            <option value="18:00:00">18:00</option>
          </select>
          {(dateFilter || timeSlotFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setTimeSlotFilter('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Bookings Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Valid Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nomor Antrian</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Used At</th>
                  {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{index + 1}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{booking.ticket_code || '-'}</span>
                        {booking.ticket_code && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(booking.ticket_code!);
                            }}
                            className="p-1 text-gray-400 hover:text-main-600 hover:bg-gray-100 rounded transition-colors"
                            title="Copy kode tiket"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{booking.ticket_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{new Date(booking.valid_date).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{booking.time_slot || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{booking.queue_number || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {booking.used_at ? new Date(booking.used_at).toLocaleString('id-ID') : '-'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRescheduleModal(booking);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                            booking.status === 'active'
                              ? 'bg-main-600 text-white hover:bg-main-700'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                          disabled={booking.status !== 'active'}
                          title={booking.status === 'active' ? 'Reschedule ticket' : `Cannot reschedule ${booking.status} ticket`}
                        >
                          Reschedule
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada booking yang ditemukan
            </div>
          )}
        </div>

        {/* Booking Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Detail Booking</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Ticket Code</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.ticket_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ticket Name</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.ticket_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedBooking.valid_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Slot</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.time_slot || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nomor Antrian</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.queue_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Used At</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.used_at ? new Date(selectedBooking.used_at).toLocaleString('id-ID') : 'Not used yet'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedBooking.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleModalOpen && rescheduleBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Reschedule Sesi</h2>
                  <button
                    onClick={closeRescheduleModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Ticket Code</p>
                    <p className="font-semibold text-gray-900">{rescheduleBooking.ticket_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ticket Name</p>
                    <p className="font-semibold text-gray-900">{rescheduleBooking.ticket_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid Date</p>
                    <p className="font-semibold text-gray-900">{new Date(rescheduleBooking.valid_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sesi Saat Ini</p>
                    <p className="font-semibold text-gray-900">{rescheduleBooking.time_slot || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Sesi Baru</label>
                    <select
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500"
                    >
                      <option value="">Pilih sesi</option>
                      <option value="09:00:00">09:00</option>
                      <option value="12:00:00">12:00</option>
                      <option value="15:00:00">15:00</option>
                      <option value="18:00:00">18:00</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={closeRescheduleModal}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleReschedule}
                      disabled={!newTimeSlot || newTimeSlot === rescheduleBooking.time_slot || rescheduling}
                      className="flex-1 px-4 py-2 bg-main-600 text-white rounded-lg hover:bg-main-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rescheduling ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
