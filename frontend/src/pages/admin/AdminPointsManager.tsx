import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_MENU_ITEMS } from '@/constants/adminMenu'
import { useAdminMenuSections } from '@/hooks/useAdminMenuSections'
import { useAdminLoyaltyPoints } from '@/hooks/useReferralCode'
import { Plus, Minus, AlertCircle, CheckCircle, Search } from 'lucide-react'

function getTierName(tier_level: number): string {
  const tiers = ['Stargazer', 'Moonwalker', 'Galaxian', 'Supernova']
  return tiers[tier_level] || 'Stargazer'
}

export function AdminPointsManager() {
  const { signOut } = useAuth()
  const menuSections = useAdminMenuSections()
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [pointsAmount, setPointsAmount] = useState('')
  const [reason, setReason] = useState('')
  const [operation, setOperation] = useState<'award' | 'deduct'>('award')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { customers, isLoading, awardPoints, deductPoints } = useAdminLoyaltyPoints()

  const filteredCustomers = customers.filter((c) => c.email.toLowerCase().includes(searchEmail.toLowerCase()))
  const selectedCustomer = customers.find((c) => c.user_id === selectedUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId || !pointsAmount || !reason) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    const points = parseInt(pointsAmount)
    if (isNaN(points) || points <= 0) {
      setMessage({ type: 'error', text: 'Points must be a positive number' })
      return
    }

    try {
      if (operation === 'award') {
        await awardPoints.mutateAsync({ userId: selectedUserId, points, reason })
        setMessage({ type: 'success', text: `Awarded ${points} points to ${selectedCustomer?.email}` })
      } else {
        await deductPoints.mutateAsync({ userId: selectedUserId, points, reason })
        setMessage({ type: 'success', text: `Deducted ${points} points from ${selectedCustomer?.email}` })
      }

      setPointsAmount('')
      setReason('')
      setSelectedUserId(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="loyalty-points"
      title="Kelola Poin Loyalty"
      subtitle="Award or deduct loyalty points to customers"
      onLogout={signOut}
    >
      <div className="points-manager">
        <div className="pm-header">
          <h1>Loyalty Points Manager</h1>
          <p className="text-gray-600">Manage customer loyalty points and tiers</p>
        </div>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="pm-grid">
        {/* Left: Customer List */}
        <div className="pm-section">
          <h2>Select Customer</h2>

          <div className="search-box">
            <Search size={20} />
            <input type="text" placeholder="Search by email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
          </div>

          {isLoading ? (
            <div className="loading">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty">No customers found</div>
          ) : (
            <div className="customer-list">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.user_id}
                  onClick={() => setSelectedUserId(customer.user_id)}
                  className={`customer-item ${selectedUserId === customer.user_id ? 'active' : ''}`}
                >
                  <div className="customer-info">
                    <div className="email">{customer.email}</div>
                    <div className="points">{customer.total_points} pts</div>
                  </div>
                  <div className="tier-badge">{getTierName(customer.tier_level)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operation Form */}
        <div className="pm-section">
          <h2>Adjust Points</h2>

          {selectedCustomer ? (
            <form onSubmit={handleSubmit} className="operation-form">
              <div className="customer-summary">
                <h3>{selectedCustomer.email}</h3>
                <p>
                  Current Points: <strong>{selectedCustomer.total_points}</strong>
                </p>
                <p>
                  Tier: <strong>{getTierName(selectedCustomer.tier_level)}</strong>
                </p>
              </div>

              <div className="form-group">
                <label>Operation</label>
                <div className="operation-buttons">
                  <button
                    type="button"
                    onClick={() => setOperation('award')}
                    className={`op-btn ${operation === 'award' ? 'active' : ''}`}
                  >
                    <Plus size={18} />
                    Award Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('deduct')}
                    className={`op-btn ${operation === 'deduct' ? 'active' : ''}`}
                  >
                    <Minus size={18} />
                    Deduct Points
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Points Amount</label>
                <input
                  type="number"
                  min="1"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                  placeholder="Enter points..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you adjusting points?..."
                  rows={3}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={awardPoints.isPending || deductPoints.isPending}>
                {awardPoints.isPending || deductPoints.isPending ? 'Processing...' : operation === 'award' ? 'Award Points' : 'Deduct Points'}
              </button>
            </form>
          ) : (
            <div className="empty">Select a customer to adjust points</div>
          )}
        </div>
      </div>

      <style>{`
        .points-manager {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pm-header {
          margin-bottom: 2rem;
        }

        .pm-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .pm-header p {
          color: #6b7280;
        }

        .message-banner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .message-banner.success {
          background: #dcfce7;
          color: #166534;
        }

        .message-banner.error {
          background: #fee2e2;
          color: #991b1b;
        }

        .pm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .pm-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .pm-section h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.75rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          background: #f9fafb;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 0.95rem;
        }

        .customer-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .customer-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .customer-item:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .customer-item.active {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .customer-info {
          flex: 1;
        }

        .customer-info .email {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .customer-info .points {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .tier-badge {
          background: #f3f4f6;
          color: #6b7280;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .loading,
        .empty {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .operation-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .customer-summary {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.375rem;
          padding: 1rem;
        }

        .customer-summary h3 {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 0.5rem;
        }

        .customer-summary p {
          font-size: 0.9rem;
          color: #1e40af;
          margin: 0.25rem 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .operation-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .op-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.375rem;
          background: white;
          color: #6b7280;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .op-btn:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .op-btn.active {
          border-color: #3b82f6;
          background: #dbeafe;
          color: #1e40af;
        }

        .submit-btn {
          padding: 0.875rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .pm-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </div>
    </AdminLayout>
  )
}

export default AdminPointsManager
