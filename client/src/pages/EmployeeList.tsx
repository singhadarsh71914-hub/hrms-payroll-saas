import React, { useEffect, useState } from 'react';
import { getEmployees, deleteEmployee } from '../services/employee.service';
import { Plus, Edit2, Trash2, Search, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salaryService } from '../services/salary.service';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  const openRevisionModal = async (emp: any) => {
    setSelectedEmployee(emp);
    setShowRevisionModal(true);
    try {
      const history = await salaryService.getRevisionHistory(emp.id);
      setRevisionHistory(history);
      if (history.length > 0) {
        setFormData({ ...formData, ctcAnnual: history[0].ctc_annual.toString() });
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
      alert('Salary revised successfully!');
      setShowRevisionModal(false);
      setFormData({ ctcAnnual: '', effectiveFrom: '', reason: '' });
      fetchEmployees();
    } catch (err) {
      alert('Failed to revise salary');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading employees...</div>;

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Employees</h1>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => navigate('/employees/add')}>
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <th style={{ padding: '0.75rem' }}>Code</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Department</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <td style={{ padding: '0.75rem' }}>{emp.employee_code}</td>
                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{emp.first_name} {emp.last_name}</td>
                <td style={{ padding: '0.75rem' }}>{emp.work_email}</td>
                <td style={{ padding: '0.75rem' }}>{emp.department?.name || '-'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    background: emp.employment_status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', 
                    color: emp.employment_status === 'ACTIVE' ? '#16a34a' : '#ef4444', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '99px', 
                    fontSize: '0.75rem' 
                  }}>
                    {emp.employment_status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button onClick={() => openRevisionModal(emp)} title="Revise Salary" style={{ background: 'none', color: '#3b82f6', marginRight: '1rem' }}>
                    <TrendingUp size={16} />
                  </button>
                  <button onClick={() => navigate(`/employees/edit/${emp.id}`)} style={{ background: 'none', color: 'var(--text-muted)', marginRight: '1rem' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No employees found.
          </div>
        )}
      </div>

      {showRevisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2>Salary Revision: {selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
              <button onClick={() => setShowRevisionModal(false)} style={{ background: 'none' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Revision Form</h3>
                <form onSubmit={handleReviseSalary}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Annual CTC</label>
                    <input 
                      type="number" 
                      value={formData.ctcAnnual} 
                      onChange={e => setFormData({ ...formData, ctcAnnual: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Effective From</label>
                    <input 
                      type="date" 
                      value={formData.effectiveFrom} 
                      onChange={e => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reason for Revision</label>
                    <textarea 
                      value={formData.reason} 
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      required
                      style={{ width: '100%', minHeight: '80px' }}
                      placeholder="e.g. Annual Appraisal, Promotion, Market Correction"
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Apply Revision'}
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ marginBottom: '1rem' }}>Revision History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {revisionHistory.map((rev, idx) => (
                    <div key={rev.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', position: 'relative' }}>
                      {idx === 0 && <span style={{ position: 'absolute', right: '10px', top: '10px', fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: '4px' }}>CURRENT</span>}
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₹{Number(rev.ctc_annual).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Effective: {new Date(rev.effective_from).toLocaleDateString('en-GB')}
                        {rev.effective_to && ` to ${new Date(rev.effective_to).toLocaleDateString('en-GB')}`}
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>{rev.revision_reason || 'Initial Salary'}</div>
                    </div>
                  ))}
                  {revisionHistory.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No revision history available.</div>}
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
