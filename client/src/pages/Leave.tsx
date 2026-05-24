import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService, type LeaveBalance, type LeaveRequest } from '../services/leave.service';
import { getEmployees } from '../services/employee.service';
import { Calendar, CheckCircle, XCircle, Clock, Plus, Info } from 'lucide-react';

const Leave: React.FC = () => {
  const { user } = useAuth();
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
    return new Date(dateString).toLocaleDateString('en-GB'); // en-GB uses DD/MM/YYYY
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
      alert('Please select an employee');
      return;
    }

    setSubmitting(true);
    try {
      await leaveService.applyLeave(formData);
      alert('Leave application submitted!');
      setShowApply(false);
      setFormData({ employeeId: '', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return;
    try {
      await leaveService.updateStatus(id, status);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <div>Loading leave data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Leave Management</h1>
        <button className="btn btn-primary" onClick={() => setShowApply(!showApply)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          {isHR ? 'Record Leave' : 'Apply for Leave'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isHR && !showApply ? '1fr' : '1fr 350px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Balances Section for Employees */}
          {!isHR && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {balances.map(b => (
                <div key={b.id} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{b.leave_type}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(b.balance_days)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days Available</div>
                  <div style={{ marginTop: '0.75rem', height: '4px', background: 'var(--bg-light)', borderRadius: '2px' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(Number(b.used_days) / Number(b.total_days)) * 100}%`, 
                      background: 'var(--primary)', 
                      borderRadius: '2px' 
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requests Section */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>{isHR ? 'All Leave Requests' : 'My Requests'}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>Employee</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Dates</th>
                    <th style={{ padding: '1rem' }}>Days</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    {isHR && <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {req.employee?.first_name} {req.employee?.last_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.employee?.employee_code}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px', 
                          background: 'var(--bg-light)',
                          fontWeight: 500
                        }}>
                          {req.leave_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {formatDate(req.start_date)} - {formatDate(req.end_date)}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{Number(req.total_days)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: req.status === 'APPROVED' ? '#16a34a' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b' }}>
                          {req.status === 'APPROVED' && <CheckCircle size={14} />}
                          {req.status === 'REJECTED' && <XCircle size={14} />}
                          {req.status === 'PENDING' && <Clock size={14} />}
                          {req.status}
                        </div>
                      </td>
                      {isHR && (
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {req.status === 'PENDING' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              >
                                Reject
                              </button>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#16a34a', borderColor: '#16a34a' }}
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={isHR ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No leave requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showApply && (
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{isHR ? 'Record Leave' : 'Apply for Leave'}</h3>
            <form onSubmit={handleApply}>
              {isHR && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Employee</label>
                  <select 
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem' }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Leave Type</label>
                <select 
                  value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>From Date</label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>To Date</label>
                <input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reason</label>
                <textarea 
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
                  placeholder="Optional"
                />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Submitting...' : isHR ? 'Record Request' : 'Submit Request'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: '0.5rem' }} 
                onClick={() => setShowApply(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {!isHR && !showApply && (
          <div className="card" style={{ height: 'fit-content', background: 'var(--bg-light)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Info size={20} />
              <h4 style={{ margin: 0 }}>Leave Policy</h4>
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Casual Leave: 12 days per year</li>
              <li>Sick Leave: 12 days per year</li>
              <li>Annual Leave: 15 days per year</li>
              <li>Requests must be approved by HR</li>
              <li>Weekend holidays are not counted</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leave;
