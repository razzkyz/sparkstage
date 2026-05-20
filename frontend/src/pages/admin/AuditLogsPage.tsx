import { useState, useMemo } from 'react'
import { useAuditLogs, useExportAuditLogs, type AuditAction } from '@/hooks/useAuditLogs'
import { Download, RotateCcw, Eye } from 'lucide-react'
import './AuditLogsPage.css'

const ACTION_LABELS: Record<AuditAction, string> = {
  admin_role_assigned: 'Role Assigned',
  payment_refunded: 'Payment Refunded',
  voucher_modified: 'Voucher Modified',
  stock_adjusted: 'Stock Adjusted',
  order_cancelled: 'Order Cancelled',
  loyalty_points_redeemed: 'Loyalty Points Redeemed',
  customer_data_exported: 'Customer Data Exported',
  admin_division_assigned: 'Division Assigned',
  price_modified: 'Price Modified',
  order_status_changed: 'Order Status Changed',
}

const TABLE_LABELS: Record<string, string> = {
  user_role_assignments: 'User Roles',
  payments: 'Payments',
  vouchers: 'Vouchers',
  product_inventory: 'Inventory',
  orders: 'Orders',
  customer_loyalty_points: 'Loyalty Points',
  admin_divisions: 'Admin Divisions',
  products: 'Products',
  product_orders: 'Product Orders',
}

export function AuditLogsPage() {
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const pageSize = 25

  // Build filters
  const filters = useMemo(() => {
    const f: any = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }

    if (selectedAction) f.action = selectedAction
    if (selectedTable) f.table_name = selectedTable
    if (startDate) f.startDate = new Date(startDate)
    if (endDate) f.endDate = new Date(endDate)

    return f
  }, [selectedAction, selectedTable, startDate, endDate, page])

  const { logs, isLoading } = useAuditLogs(filters)
  const { exportToCSV } = useExportAuditLogs()

  const handleReset = () => {
    setSelectedAction('')
    setSelectedTable('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const handleExport = () => {
    exportToCSV({
      action: selectedAction || undefined,
      table_name: selectedTable || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })
  }

  return (
    <div className="audit-logs-page">
      {/* Header */}
      <div className="audit-header">
        <h1>Audit Logs</h1>
        <p className="text-gray-600">Track all admin activities and system changes</p>
      </div>

      {/* Filters */}
      <div className="audit-filters">
        <div className="filter-grid">
          <div className="filter-group">
            <label>Action Type</label>
            <select value={selectedAction} onChange={(e) => { setSelectedAction((e.target.value as AuditAction) || ''); setPage(1) }}>
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Table</label>
            <select value={selectedTable} onChange={(e) => { setSelectedTable(e.target.value); setPage(1) }}>
              <option value="">All Tables</option>
              {Object.entries(TABLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleReset} className="btn-secondary" title="Reset filters">
            <RotateCcw size={18} />
            Reset
          </button>
          <button onClick={handleExport} className="btn-primary" title="Export to CSV">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="audit-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit logs found</p>
          </div>
        ) : (
          <>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record ID</th>
                  <th>Description</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="audit-row">
                    <td className="time-cell">
                      <div className="time-value">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <span className="action-badge">{ACTION_LABELS[log.action] || log.action}</span>
                    </td>
                    <td>
                      <span className="table-badge">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                    </td>
                    <td className="record-id">
                      <code>{log.record_id.substring(0, 8)}...</code>
                    </td>
                    <td className="description">{log.description || '-'}</td>
                    <td className="expand-cell">
                      <button
                        className="btn-expand"
                        onClick={() => toggleExpand(log.id)}
                        title={expandedRows.has(log.id) ? 'Hide details' : 'Show details'}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Expanded Details */}
            {expandedRows.size > 0 && (
              <div className="expanded-details">
                {logs.map((log) =>
                  expandedRows.has(log.id) ? (
                    <div key={`${log.id}-details`} className="detail-panel">
                      <h3>Details: {log.description || log.action}</h3>

                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>User ID</label>
                          <code>{log.user_id}</code>
                        </div>

                        <div className="detail-item">
                          <label>Record ID</label>
                          <code>{log.record_id}</code>
                        </div>

                        {log.ip_address && (
                          <div className="detail-item">
                            <label>IP Address</label>
                            <code>{log.ip_address}</code>
                          </div>
                        )}
                      </div>

                      {log.old_values && (
                        <div className="detail-section">
                          <label>Previous Values</label>
                          <pre className="json-display">{JSON.stringify(log.old_values, null, 2)}</pre>
                        </div>
                      )}

                      {log.new_values && (
                        <div className="detail-section">
                          <label>New Values</label>
                          <pre className="json-display">{JSON.stringify(log.new_values, null, 2)}</pre>
                        </div>
                      )}

                      <button className="btn-collapse" onClick={() => toggleExpand(log.id)}>
                        Hide Details
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* Pagination */}
            <div className="audit-pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={logs.length < pageSize}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AuditLogsPage
