import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { leaveService, type LeaveBalance, type LeaveRequest } from '../services/leave.service';
import { getEmployees } from '../services/employee.service';
import { CheckCircle, XCircle, Clock, Plus, Info, Calendar, User, FileText, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

const Leave: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const isHR = user?.role === 'HR' || user?.role === 'ADMIN';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchData = async () => {
    try {
      const [balancesData, requestsData] = await Promise.all([
        !isHR ? leaveService.getBalances() : Promise.resolve([]),
        leaveService.getRequests()
      ]);
      setBalances(balancesData);
      setRequests(requestsData);

      if (isHR) {
        const employeesData = await getEmployees();
        setEmployees(employeesData);
      }
    } catch (err) {
      console.error('Failed to fetch leave data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isHR && !formData.employeeId) {
      showToast('Please select an employee', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await leaveService.applyLeave(formData);
      showToast('Leave application submitted successfully!', 'success');
      setShowApply(false);
      setFormData({ employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveService.updateStatus(id, status);
      fetchData();
      showToast(`Leave request ${status.toLowerCase()} successfully`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  if (loading) return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Skeleton width="300px" height="32px" />
          <div style={{ marginTop: '0.5rem' }}><Skeleton width="min(400px, 100%)" height="20px" /></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : isHR ? '1fr' : '1fr 400px', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: 0 }}>
          {!isHR && (
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(auto-fit, minmax(200px, 1fr))'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <Skeleton height="150px" borderRadius="12px" />
              <Skeleton height="150px" borderRadius="12px" />
              <Skeleton height="150px" borderRadius="12px" />
            </div>
          )}
          <Skeleton height="400px" borderRadius="12px" />
        </div>
        {!isHR && <Skeleton height="350px" borderRadius="12px" />}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Coordinate time-off and resource availability</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApply(!showApply)}>
          <Plus size={20} />
          {isHR ? 'Record Workforce Leave' : 'Apply for Leave'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : isHR && !showApply ? '1fr' : '1fr 400px', gap: '2.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: 0 }}>
          {/* Balances Section for Employees */}
          {!isHR && (
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(auto-fit, minmax(200px, 1fr))'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {balances.map(b => (
                <div key={b.id} className="premium-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                  <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{b.leave_type}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', lineHeight: 1 }}>{Number(b.balance_days)}</div>
                  <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '600', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Days Available</div>
                  <div style={{ marginTop: '1.25rem', height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min((Number(b.used_days) / Number(b.total_days)) * 100, 100)}%`, 
                      background: 'var(--primary)', 
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requests Section */}
          <div className="premium-card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <Calendar size={20} color="var(--primary)" />
               <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: '800' }}>{isHR ? 'Centralized Request Registry' : 'My Leave History'}</h3>
            </div>
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th style={{ textAlign: 'center' }}>Days</th>
                    <th>Status</th>
                    {isHR && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} color="var(--text-muted)" />
                           </div>
                           <div>
                              <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                {req.employee?.first_name} {req.employee?.last_name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{req.employee?.employee_code}</div>
                           </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '6px', 
                          background: 'var(--bg)',
                          color: 'var(--primary)',
                          fontWeight: '800',
                          border: '1px solid var(--border)'
                        }}>
                          {req.leave_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                           {formatDate(req.start_date)} <ChevronRight size={12} opacity={0.5} /> {formatDate(req.end_date)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', color: 'var(--text-main)' }}>{Number(req.total_days)}</td>
                      <td>
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          fontSize: 'var(--font-sm, 12px)', 
                          fontWeight: '800', 
                          color: req.status === 'APPROVED' ? 'var(--success)' : req.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)',
                          background: req.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-lg)'
                        }}>
                          {req.status === 'APPROVED' && <CheckCircle size={14} />}
                          {req.status === 'REJECTED' && <XCircle size={14} />}
                          {req.status === 'PENDING' && <Clock size={14} />}
                          {req.status}
                        </div>
                      </td>
                      {isHR && (
                        <td style={{ textAlign: 'right' }}>
                          {req.status === 'PENDING' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.4rem', borderRadius: '6px', color: 'var(--danger)' }}
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.4rem', borderRadius: '6px', background: 'var(--success)' }}
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={isHR ? 6 : 5} style={{ padding: '4rem', textAlign: 'center' }}>
                        <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                           <FileText size={48} className="empty-state-icon" />
                           <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No requests found</h3>
                           <p style={{ color: 'var(--text-secondary)' }}>No leave requests awaiting action.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {showApply && (
            <div className="premium-card" style={{ position: 'sticky', top: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', fontSize: '1.25rem' }}>{isHR ? 'Record Employee Absence' : 'New Leave Application'}</h3>
              <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {isHR && (
                  <div className="form-group">
                    <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)', marginBottom: '0.5rem', display: 'block' }}>Select Employee</label>
                    <select 
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
                      required
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)', marginBottom: '0.5rem', display: 'block' }}>Leave Category</label>
                  <select 
                    value={formData.leaveType}
                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
                    required
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="ANNUAL">Annual / Earned Leave</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && '1fr 1fr'.includes('repeat(4') ? 'repeat(2, 1fr)' : '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)', marginBottom: '0.5rem', display: 'block' }}>From</label>
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)', marginBottom: '0.5rem', display: 'block' }}>To</label>
                    <input 
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)', marginBottom: '0.5rem', display: 'block' }}>Justification</label>
                  <textarea 
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                    placeholder="Brief reason for time-off..."
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={submitting}>
                  {submitting ? 'Processing Application...' : isHR ? 'Record Request' : 'Submit Application'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%' }} 
                  onClick={() => setShowApply(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {!isHR && !showApply && (
            <div className="premium-card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Info size={24} />
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Organization Policy</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Casual Leave</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>12 days / financial year</div>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Sick Leave</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>12 days / financial year</div>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Annual Leave</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>15 days / financial year</div>
                 </div>
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: 'var(--font-sm, 12px)', opacity: 0.7, fontStyle: 'italic' }}>* Weekend holidays and public holidays are not deducted from your balance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leave;
