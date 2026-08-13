import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../services/audit.service';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/Skeleton';
import { Clock } from 'lucide-react';

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [pagination, setPagination] = useState<any>({});

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(filters);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const formatRelativeTime = (dateString: string) => {
    const diff = new Date().valueOf() - new Date(dateString).valueOf();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'HR') {
    return <div style={{ padding: '2rem' }}>Access Denied</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Monitor system activities and events</p>
        </div>
      </div>

      <div className="premium-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Action</label>
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="e.g. LOGIN_SUCCESS"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Entity Type</label>
            <input
              type="text"
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
              placeholder="e.g. EMPLOYEE"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>From</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>To</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>
        </div>
      </div>

      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td><Skeleton width="120px" height="16px" /></td>
                  <td><div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><Skeleton width="150px" height="16px" /><Skeleton width="80px" height="12px" /></div></td>
                  <td><Skeleton width="100px" height="24px" borderRadius="12px" /></td>
                  <td><Skeleton width="120px" height="16px" /></td>
                  <td><Skeleton width="100px" height="16px" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                    <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
                       <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: 'var(--danger)', marginBottom: '8px' }}>Failed to load audit logs</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Could not retrieve logs from the server. Please try again later.</p>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                    <Clock size={48} className="empty-state-icon" />
                    <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No logs found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>No audit logs match the current filters. Audit logs are generated automatically when users perform actions like creating an employee or updating settings.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRelativeTime(log.created_at)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.user?.email || 'System'}</div>
                    <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)' }}>{log.user?.role}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: log.action.includes('SUCCESS') ? 'rgba(16, 185, 129, 0.1)' : log.action.includes('FAILURE') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: log.action.includes('SUCCESS') ? 'var(--success)' : log.action.includes('FAILURE') ? 'var(--danger)' : 'var(--primary)',
                      border: 'none',
                      fontWeight: 700
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {log.entity_type} {log.entity_id && <span style={{ opacity: 0.6 }}>({log.entity_id.substring(0, 8)})</span>}
                  </td>
                  <td style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && logs.length > 0 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing {logs.length} of {pagination.total} entries
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm, 8px)' }}>
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;


