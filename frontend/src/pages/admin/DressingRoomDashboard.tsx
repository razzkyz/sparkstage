import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from '../../components/AdminLayout'
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu'
import { useAdminMenuSections } from '../../hooks/useAdminMenuSections'
import { supabase } from '../../lib/supabase'

interface DressingRoomStats {
  totalCollections: number
  totalLooks: number
  activeRentals: number
  pendingOrders: number
}

export const DressingRoomDashboard = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const menuSections = useAdminMenuSections()
  const [stats, setStats] = useState<DressingRoomStats>({
    totalCollections: 0,
    totalLooks: 0,
    activeRentals: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)



  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: collections, error: collectionsError } = await supabase
          .from('dressing_room_collections')
          .select('id')
          .eq('is_active', true)

        if (collectionsError) throw collectionsError

        const { data: looks, error: looksError } = await supabase
          .from('dressing_room_looks')
          .select('id')

        if (looksError) throw looksError

        const { data: rentals, error: rentalsError } = await supabase
          .from('rental_orders')
          .select('id, status')
          .in('status', ['awaiting_payment', 'paid', 'active'])

        if (rentalsError) throw rentalsError

        setStats({
          totalCollections: collections?.length ?? 0,
          totalLooks: looks?.length ?? 0,
          activeRentals: rentals?.filter((r: any) => r.status === 'active').length ?? 0,
          pendingOrders: rentals?.filter((r: any) => ['awaiting_payment', 'paid'].includes(r.status)).length ?? 0,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load stats'
        setError(message)
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      loadStats()
    }
  }, [user])

  const statCards = [
    {
      label: 'Total Koleksi',
      value: stats.totalCollections,
      icon: 'styler',
      color: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-700',
    },
    {
      label: 'Total Lookbook',
      value: stats.totalLooks,
      icon: 'photo_library',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      label: 'Sewa Aktif',
      value: stats.activeRentals,
      icon: 'checkroom',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      label: 'Pesanan Pending',
      value: stats.pendingOrders,
      icon: 'pending_actions',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
    },
  ]

  const quickActions = [
    {
      title: 'Kelola Koleksi',
      description: 'Tambah atau edit koleksi dressing room',
      icon: 'styler',
      action: () => navigate('/admin/dressing-room'),
    },
    {
      title: 'Pesanan Sewa',
      description: 'Lihat dan kelola pesanan sewa',
      icon: 'checkroom',
      action: () => navigate('/admin/rental-orders'),
    },
    {
      title: 'Scan QR Customer',
      description: 'Scan QR code customer dressing room',
      icon: 'qr_code_scanner',
      action: () => navigate('/admin/dressing-room-scan'),
    },
  ]

  return (
    <AdminLayout
      title="Dressing Room Dashboard"
      subtitle="Overview koleksi dan pesanan sewa"
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="dressing-room-dashboard"
      onLogout={signOut}
    >
      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-xl border ${card.color} p-5 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">{card.label}</p>
                <p className={`text-3xl font-black ${card.textColor}`}>
                  {loading ? '...' : card.value}
                </p>
              </div>
              <span className={`material-symbols-outlined text-3xl ${card.textColor} opacity-70`}>
                {card.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <h3 className="text-lg font-black text-gray-900 mb-4">Akses Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 hover:shadow-sm transition-all group"
            >
              <div className="h-12 w-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl text-main-600">
                  {action.icon}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-gray-900 truncate">{action.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Rental Orders placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-900">Pesanan Sewa Terbaru</h3>
          <button
            onClick={() => navigate('/admin/rental-orders')}
            className="text-sm font-bold text-main-600 hover:text-main-700 transition-colors"
          >
            Lihat Semua →
          </button>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">checkroom</span>
          <p className="text-gray-400 text-sm">
            Klik <span className="font-bold">Lihat Semua</span> untuk melihat daftar pesanan sewa dressing room.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default DressingRoomDashboard
