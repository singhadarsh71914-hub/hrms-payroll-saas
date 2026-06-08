import React, { useEffect, useState } from 'react';
import { getEmployees, deleteEmployee, restoreEmployee } from '../services/employee.service';
import { Plus, Edit2, Trash2, Search, TrendingUp, X, User, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService } from '../services/salary.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

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

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      showToast('Employee deactivated successfully', 'success');
      fetchEmployees();
    } catch (err) {
      showToast('Failed to deactivate employee', 'error');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreEmployee(id);
      showToast('Employee restored successfully', 'success');
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to restore employee', 'error');
    }
  };

  const openRevisionModal = async (emp: any) => {
    setSelectedEmployee(emp);
    setShowRevisionModal(true);
    try {
      const history = await salaryService.getRevisionHistory(emp.id);
      setRevisionHistory(history);
      if (history.length > 0) {
        setFormData({ ...formData, ctcAnnual: history[0].ctc_annual.toString(), effectiveFrom: '', reason: '' });
      }
    } catch (err) {
      console.error('Failed to fetch salary history', err);
    }
  };

  const handleReviseSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await salaryService.reviseSalary({
        employeeId: selectedEmployee.id,
        ctcAnnual: parseFloat(formData.ctcAnnual),
        effectiveFrom: formData.effectiveFrom,
        reason: formData.reason
      });
      showToast('Salary revised successfully!', 'success');
      setShowRevisionModal(false);
      setFormData({ ctcAnnual: '', effectiveFrom: '', reason: '' });
      fetchEmployees();
    } catch (err) {
      showToast('Failed to revise salary', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.work_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '2rem' }}>Loading workforce data...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Directory</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage your organization's talent and growth</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/employees/add')}>
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
              {filteredEmployees.map(emp => (
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
                        {emp.first_name[0]}{emp.last_name[0]}
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
                        <button onClick={() => handleDelete(emp.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Deactivate">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      ) : (
                        user?.role === 'ADMIN' && (
                          <button onClick={() => handleRestore(emp.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Restore">
                            <RotateCcw size={16} color="var(--success)" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
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

      {showRevisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="premium-card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Salary Revision</h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>{selectedEmployee.first_name} {selectedEmployee.last_name} ({selectedEmployee.employee_code})</p>
              </div>
              <button onClick={() => setShowRevisionModal(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              <div style={{ padding: '2rem', borderRight: '1px solid var(--border)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Apply New Revision</h3>
                <form onSubmit={handleReviseSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>New Annual CTC (INR)</label>
                    <input 
                      type="number" 
                      value={formData.ctcAnnual} 
                      onChange={e => setFormData({ ...formData, ctcAnnual: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Effective From Date</label>
                    <input 
                      type="date" 
                      value={formData.effectiveFrom} 
                      onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Revision Reason</label>
                    <textarea 
                      value={formData.reason} 
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      required
                      style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                      placeholder="e.g. Performance Bonus, Annual Appraisal..."
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', justifyContent: 'center' }} disabled={submitting}>
                    {submitting ? 'Processing...' : 'Confirm Revision'}
                  </button>
                </form>
              </div>

              <div style={{ padding: '2rem', background: 'var(--bg-page)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: '700' }}>Revision History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {revisionHistory.map((rev, idx) => (
                    <div key={rev.id} style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {idx === 0 && <span style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '0.65rem', background: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)', padding: '4px 8px', borderRadius: '6px', fontWeight: '800' }}>ACTIVE</span>}
                      <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary)' }}>₹{Number(rev.ctc_annual).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0', fontWeight: '600' }}>
                        Period: {new Date(rev.effective_from).toLocaleDateString('en-GB')}
                        {rev.effective_to ? ` to ${new Date(rev.effective_to).toLocaleDateString('en-GB')}` : ' - Present'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rev.revision_reason || 'Initial Appointment'}</div>
                    </div>
                  ))}
                  {revisionHistory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No history records found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
