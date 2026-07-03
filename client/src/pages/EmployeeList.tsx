import React, { useEffect, useState } from 'react';
import { getEmployees, deleteEmployee, restoreEmployee } from '../services/employee.service';
import { Plus, Edit2, Trash2, Search, TrendingUp, X, User, RotateCcw, Calendar, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService } from '../services/salary.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/Skeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';

const EmployeeList: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    ctcAnnual: '',
    effectiveFrom: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees(includeInactive);
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [includeInactive]);

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean; employeeId: string; type: 'deactivate' | 'restore'}>({
    isOpen: false,
    employeeId: '',
    type: 'deactivate'
  });

  const confirmAction = (employeeId: string, type: 'deactivate' | 'restore') => {
    setConfirmDialog({ isOpen: true, employeeId, type });
  };

  const executeConfirmedAction = async () => {
    const { employeeId, type } = confirmDialog;
    setConfirmDialog({ isOpen: false, employeeId: '', type: 'deactivate' });
    
    if (type === 'deactivate') {
      try {
        await deleteEmployee(employeeId);
        showToast('Employee deactivated successfully', 'success');
        fetchEmployees();
      } catch (err) {
        showToast('Failed to deactivate employee', 'error');
      }
    } else {
      try {
        await restoreEmployee(employeeId);
        showToast('Employee restored successfully', 'success');
        fetchEmployees();
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to restore employee', 'error');
      }
    }
  };

  const openRevisionModal = async (emp: any) => {
    setSelectedEmployee(emp);
    setShowRevisionModal(true);
    try {
      const history = await salaryService.getRevisionHistory(emp.id);
      setRevisionHistory(history);
    } catch (err) {
      showToast('Failed to load salary history', 'error');
    }
  };

  const handleReviseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      const newRevision = await salaryService.reviseSalary({
        employeeId: selectedEmployee.id,
        ctcAnnual: Number(formData.ctcAnnual),
        effectiveFrom: formData.effectiveFrom,
        reason: formData.reason
      });
      // Immediately update history without a round-trip
      setRevisionHistory(prev => [newRevision, ...prev]);
      showToast('Salary revised successfully! 🎉', 'success');
      setFormData({ ctcAnnual: '', effectiveFrom: '', reason: '' });
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to revise salary', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.work_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Directory</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage your organization's talent and growth</p>
        </div>
        <button data-testid="add-employee-btn" className="btn btn-primary" onClick={() => navigate('/employees/add')}>
          <Plus size={20} />
          Add New Employee
        </button>
      </div>

      <div className="premium-card">
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name, email or employee ID..." 
              style={{ width: '100%', paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.role === 'ADMIN' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '600' }}>
              <input 
                type="checkbox" 
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem' }}
              />
              Show Inactive
            </label>
          )}
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Profile & ID</th>
                <th>Work Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td><div style={{ display: 'flex', gap: '12px' }}><Skeleton width="40px" height="40px" borderRadius="10px" /><div><Skeleton width="120px" height="16px" style={{ marginBottom: '6px' }} /><Skeleton width="80px" height="12px" /></div></div></td>
                    <td><Skeleton width="150px" height="16px" /></td>
                    <td><Skeleton width="100px" height="16px" /></td>
                    <td><Skeleton width="100px" height="16px" /></td>
                    <td><Skeleton width="80px" height="24px" borderRadius="12px" /></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><Skeleton width="32px" height="32px" borderRadius="6px" /><Skeleton width="32px" height="32px" borderRadius="6px" /><Skeleton width="32px" height="32px" borderRadius="6px" /></div></td>
                  </tr>
                ))
              ) : filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ opacity: emp.is_active ? 1 : 0.6 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '10px', 
                        background: 'var(--primary)', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700'
                      }}>
                        {emp.first_name?.[0] || ''}{emp.last_name?.[0] || ''}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {emp.first_name} {emp.last_name}
                          {!emp.is_active && <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>INACTIVE</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{emp.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '500' }}>{emp.work_email}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{emp.department?.name || 'Unassigned'}</span>
                  </td>
                  <td>{emp.designation?.name || '-'}</td>
                  <td>
                    <span className={`badge ${emp.employment_status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.employment_status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openRevisionModal(emp)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Salary Revision">
                        <TrendingUp size={16} color="var(--primary)" />
                      </button>
                      <button onClick={() => navigate(`/employees/edit/${emp.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {emp.is_active ? (
                        <button onClick={() => confirmAction(emp.id, 'deactivate')} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Deactivate">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      ) : (
                        user?.role === 'ADMIN' && (
                          <button onClick={() => confirmAction(emp.id, 'restore')} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Restore">
                            <RotateCcw size={16} color="var(--success)" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                       <User size={48} opacity={0.2} />
                       <span>No employees found matching your criteria.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'deactivate' ? "Deactivate Employee" : "Restore Employee"}
        message={confirmDialog.type === 'deactivate' ? "Are you sure you want to deactivate this employee? They will no longer have access to the system." : "Are you sure you want to restore this employee? They will regain access to the system."}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        confirmText={confirmDialog.type === 'deactivate' ? "Deactivate" : "Restore"}
        isDestructive={confirmDialog.type === 'deactivate'}
      />

      {showRevisionModal && selectedEmployee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(6px)' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '960px', height: '75vh', maxHeight: '75vh', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* STICKY HEADER */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.95rem', flexShrink: 0 }}>
                  {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selectedEmployee.employee_code} &middot; {selectedEmployee.designation?.name || selectedEmployee.department?.name || 'Employee'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(var(--primary-rgb, 99,102,241),0.1)', padding: '4px 10px', borderRadius: '20px' }}>Salary Revision</span>
                <button onClick={() => { setShowRevisionModal(false); setFormData({ ctcAnnual: '', effectiveFrom: '', reason: '' }); }} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BODY: two columns, SINGLE scrollable zone — no nested scrollbars */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>

              {/* LEFT — Apply Revision */}
              <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>Apply Revision</div>
                  <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Set New Compensation</h3>
                </div>

                {/* Payroll helper text */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px' }}>
                  <Info size={14} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '600', lineHeight: 1.5 }}>This revision becomes the active salary used in payroll processing.</span>
                </div>

                <form id="revisionForm" onSubmit={handleReviseSalary} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>New Annual CTC (₹)</label>
                    <input
                      type="number"
                      value={formData.ctcAnnual}
                      onChange={e => setFormData({ ...formData, ctcAnnual: e.target.value })}
                      required
                      min={1}
                      placeholder="e.g. 900000"
                      style={{ width: '100%', fontSize: '1rem', fontWeight: '600' }}
                    />
                    {/* Salary Breakdown Preview */}
                    {Number(formData.ctcAnnual) > 0 && (() => {
                      const annual = Number(formData.ctcAnnual);
                      const monthly = Math.round(annual / 12);
                      const estimated = Math.round(monthly * 0.78); // ~78% after typical deductions
                      return (
                        <div style={{ marginTop: '10px', padding: '12px 16px', background: 'var(--bg-page)', border: '1.5px solid var(--primary)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>Annual CTC</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>₹{annual.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>Monthly Gross</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)' }}>₹{monthly.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600' }}>Est. Monthly In-hand</span>
                            <span style={{ fontSize: '1rem', fontWeight: '900', color: '#10b981' }}>~₹{estimated.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Prominent date picker */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                      <Calendar size={14} color="var(--primary)" />
                      Effective From Date
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      required
                      style={{ width: '100%', fontSize: '1rem', fontWeight: '700', border: '2px solid var(--primary)', borderRadius: '10px', padding: '10px 14px', background: 'var(--bg-page)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>Revision Reason</label>
                    <textarea
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                      style={{ width: '100%', resize: 'none', lineHeight: '1.5', fontSize: '0.875rem', boxSizing: 'border-box' }}
                      placeholder="e.g. Annual appraisal, performance bonus, market correction..."
                    />
                  </div>
                </form>
              </div>

              {/* RIGHT — Revision History (compact, no empty stretch) */}
              <div style={{ padding: '20px', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>Timeline</div>
                  <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>Revision History</h3>
                </div>

                {revisionHistory.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', border: '1.5px dashed var(--border)', borderRadius: '12px', textAlign: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📝</span>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.875rem' }}>No salary revisions yet</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>First approved revision will appear here.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {revisionHistory.map((rev, idx) => (
                      <div key={rev.id || idx} style={{ padding: '12px 14px', background: 'var(--bg-card)', border: `1.5px solid ${idx === 0 ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', position: 'relative' }}>
                        {idx === 0 && (
                          <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '0.6rem', background: 'rgba(22,163,74,0.12)', color: 'var(--success)', padding: '2px 7px', borderRadius: '20px', fontWeight: '800', letterSpacing: '0.06em' }}>ACTIVE</span>
                        )}
                        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--primary)', letterSpacing: '-0.01em' }}>₹{Number(rev.ctc_annual).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '3px 0', fontWeight: '600' }}>
                          {new Date(rev.effective_from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {rev.effective_to ? ` → ${new Date(rev.effective_to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' → Present'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{rev.revision_reason || 'Initial Appointment'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* STICKY FOOTER */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { setShowRevisionModal(false); setFormData({ ctcAnnual: '', effectiveFrom: '', reason: '' }); }}
                className="btn btn-secondary"
                style={{ padding: '9px 22px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="revisionForm"
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: '9px 26px', minWidth: '140px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {submitting ? 'Saving...' : '✓ Save Revision'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
