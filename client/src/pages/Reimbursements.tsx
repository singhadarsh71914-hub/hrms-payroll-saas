import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { IndianRupee, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Reimbursements = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [claims, setClaims] = useState<any[]>([]);
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({ type: 'TRAVEL', amount: '', description: '' });

  const isHR = user?.role === 'ADMIN' || user?.role === 'HR';

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await api.get(isHR ? '/reimbursements' : '/reimbursements/my');
      setClaims(res.data || []);
    } catch (err) {
      console.error(err);
      // Fallback
      setClaims([
        { id: '1', employee: { first_name: 'Kabir', last_name: 'Das' }, type: 'TRAVEL', amount: 5400, description: 'Client meeting to Mumbai', status: 'PENDING', created_at: new Date().toISOString() }
      ]);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reimbursements', formData);
      showToast('Claim submitted successfully', 'success');
      setShowApply(false);
      fetchClaims();
    } catch (err) {
      showToast('Failed to submit claim', 'error');
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/reimbursements/${id}/status`, { status, remarks: 'Processed via Dashboard' });
      showToast('Status updated successfully', 'success');
      fetchClaims();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reimbursements</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage and process expense claims</p>
        </div>
        {!isHR && (
          <button className="btn btn-primary" onClick={() => setShowApply(true)}>
            <Plus size={20} />
            Submit Claim
          </button>
        )}
      </div>

      {showApply && (
        <div className="premium-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>New Expense Claim</h3>
          <form onSubmit={handleApply} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Expense Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <option value="TRAVEL">Travel</option>
                <option value="FOOD">Food & Beverage</option>
                <option value="MEDICAL">Medical</option>
                <option value="INTERNET">Internet/Phone</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Amount (INR)</label>
              <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description & Justification</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', minHeight: '100px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowApply(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Claim</button>
            </div>
          </form>
        </div>
      )}

      <div className="premium-card" style={{ padding: '0' }}>
        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Expense Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Submitted On</th>
                <th>Status</th>
                {isHR && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {claims.map(c => (
                <tr key={c.id}>
                  {isHR && (
                    <td>
                      <div style={{ fontWeight: '700' }}>{c.employee?.first_name} {c.employee?.last_name}</div>
                    </td>
                  )}
                  <td><span className="badge badge-primary">{c.type}</span></td>
                  <td style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{Number(c.amount).toLocaleString()}</td>
                  <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '800', color: c.status === 'APPROVED' ? '#10b981' : c.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                      {c.status === 'APPROVED' && <CheckCircle size={14} />}
                      {c.status === 'REJECTED' && <XCircle size={14} />}
                      {c.status === 'PENDING' && <Clock size={14} />}
                      {c.status}
                    </div>
                  </td>
                  {isHR && (
                    <td style={{ textAlign: 'right' }}>
                      {c.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleStatus(c.id, 'APPROVED')} className="btn btn-primary" style={{ padding: '0.4rem', borderRadius: '6px' }}><CheckCircle size={16} /></button>
                          <button onClick={() => handleStatus(c.id, 'REJECTED')} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px', color: '#ef4444' }}><XCircle size={16} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                       <IndianRupee size={48} opacity={0.2} />
                       <span>No reimbursement claims found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reimbursements;