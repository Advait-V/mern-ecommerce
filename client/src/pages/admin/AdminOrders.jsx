// src/pages/admin/AdminOrders.jsx
//
// All orders with status filter, pagination, and inline status update.
// Admin can change any order's status via a dropdown in the table row.

import { useState, useEffect, useCallback } from 'react';
import { Link }                             from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus }from '../../api/orderApi';
import AdminLayout                          from '../../components/AdminLayout';
import Spinner                              from '../../components/ui/Spinner';
import Message                              from '../../components/ui/Message';
import { formatCurrency }                   from '../../utils/formatCurrency';
import { toast }                            from 'react-toastify';

const STATUS_OPTIONS = ['pending','processing','shipped','delivered','cancelled'];

const STATUS_STYLES = {
  pending:    { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3' },
  delivered:  { bg: '#dcfce7', color: '#166534' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b' },
};

const AdminOrders = () => {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [totalRev,    setTotalRev]    = useState(0);

  // Filter + pagination state
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);

  // Track which order's status is being updated (shows a spinner in that row)
  const [updatingId,   setUpdatingId]   = useState(null);

  // ── Load orders ────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;

      const data = await fetchAllOrders(params);
      setOrders(data.orders);
      setTotalPages(data.pages);
      setTotalCount(data.total);
      setTotalRev(data.totalRevenue || 0);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Status update ─────────────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to "${newStatus}"`);
      // Update the local state so the UI reflects the change immediately
      // without a full reload
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  // When filter changes, reset to page 1
  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Orders">

      {/* ── Summary bar ─────────────────────────────────────────────────── */}
      <div style={styles.summaryBar}>
        <SummaryPill label="Total Orders"  value={totalCount} />
        <SummaryPill label="Total Revenue" value={formatCurrency(totalRev)} highlight />
        {STATUS_OPTIONS.map((s) => (
          <SummaryPill
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            value={orders.filter((o) => o.status === s).length}
            color={STATUS_STYLES[s]?.color}
            bg={STATUS_STYLES[s]?.bg}
          />
        ))}
      </div>

      {/* ── Filter + table ───────────────────────────────────────────────── */}
      <div style={styles.tableCard}>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <h2 style={styles.tableTitle}>
            All Orders
            <span style={styles.countBadge}>{totalCount}</span>
          </h2>

          {/* Status filter */}
          <div style={styles.filterRow}>
            <label style={styles.filterLabel}>Filter by status:</label>
            <div style={styles.filterBtns}>
              {/* "All" button */}
              <button
                onClick={() => handleFilterChange('')}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: statusFilter === '' ? '#3b82f6' : '#f1f5f9',
                  color:           statusFilter === '' ? '#fff'    : '#374151',
                }}
              >
                All
              </button>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterChange(s)}
                  style={{
                    ...styles.filterBtn,
                    backgroundColor: statusFilter === s
                      ? STATUS_STYLES[s].color   : STATUS_STYLES[s].bg,
                    color: statusFilter === s
                      ? '#fff'                   : STATUS_STYLES[s].color,
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <Message type="error">{error}</Message>}

        {loading ? <Spinner /> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Customer</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Payment</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Update Status</th>
                    <th style={styles.th} />
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No orders found for this filter.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const sc        = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                      const isUpdating = updatingId === order._id;
                      // Can't update delivered or cancelled orders
                      const isLocked  = ['delivered', 'cancelled'].includes(order.status);

                      return (
                        <tr key={order._id} style={styles.tr}>

                          {/* Order ID */}
                          <td style={styles.td}>
                            <span style={styles.orderId}>
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                          </td>

                          {/* Customer */}
                          <td style={styles.td}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                              {order.user?.name || 'N/A'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {order.user?.email}
                            </p>
                          </td>

                          {/* Date */}
                          <td style={styles.td}>
                            <span style={{ fontSize: '0.825rem', color: '#475569' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </span>
                          </td>

                          {/* Total */}
                          <td style={{ ...styles.td, fontWeight: 700, color: '#0f172a' }}>
                            {formatCurrency(order.totalPrice)}
                          </td>

                          {/* Payment */}
                          <td style={styles.td}>
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 700,
                              color: order.isPaid ? '#166534' : '#92400e',
                              backgroundColor: order.isPaid ? '#dcfce7' : '#fef3c7',
                              padding: '0.2rem 0.6rem', borderRadius: '999px',
                            }}>
                              {order.isPaid ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </td>

                          {/* Current status badge */}
                          <td style={styles.td}>
                            <span style={{
                              backgroundColor: sc.bg, color: sc.color,
                              padding: '0.2rem 0.6rem', borderRadius: '999px',
                              fontSize: '0.75rem', fontWeight: 700,
                            }}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>

                          {/* Status update dropdown */}
                          <td style={styles.td}>
                            {isLocked ? (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                Locked
                              </span>
                            ) : isUpdating ? (
                              <span style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
                                Updating…
                              </span>
                            ) : (
                              // Dropdown lets admin pick the next status
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusChange(order._id, e.target.value)
                                }
                                style={styles.statusSelect}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>

                          {/* View link */}
                          <td style={styles.td}>
                            <Link
                              to={`/orders/${order._id}`}
                              style={styles.viewLink}
                            >
                              View →
                            </Link>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>
                <span style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// ── SummaryPill helper ────────────────────────────────────────────────────────
const SummaryPill = ({ label, value, color, bg, highlight }) => (
  <div style={{
    backgroundColor: bg || (highlight ? '#eff6ff' : '#fff'),
    borderRadius: '10px',
    padding: '0.75rem 1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    textAlign: 'center',
    minWidth: '100px',
  }}>
    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: color || '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
      {label}
    </p>
    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: color || (highlight ? '#3b82f6' : '#0f172a') }}>
      {value}
    </p>
  </div>
);

const styles = {
  summaryBar:  { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  tableCard:   { backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
  toolbar:     { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' },
  tableTitle:  { fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  countBadge:  { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '999px' },
  filterRow:   { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  filterLabel: { fontSize: '0.82rem', fontWeight: 600, color: '#64748b' },
  filterBtns:  { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  filterBtn:   { border: 'none', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '860px' },
  thead:       { backgroundColor: '#f8fafc', borderBottom: '2px solid #f1f5f9' },
  th:          { textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:          { borderBottom: '1px solid #f8fafc' },
  td:          { padding: '0.85rem 1rem', verticalAlign: 'middle' },
  orderId:     { color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' },
  statusSelect:{ padding: '0.3rem 0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' },
  viewLink:    { color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' },
  pagination:  { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.25rem' },
  pageBtn:     { backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 1.1rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#374151' },
  pageInfo:    { color: '#64748b', fontSize: '0.875rem' },
};

export default AdminOrders;