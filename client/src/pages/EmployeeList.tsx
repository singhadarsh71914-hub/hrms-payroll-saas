import React, { useEffect, useState } from 'react';
import { getEmployees, deleteEmployee } from '../services/employee.service';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
    </div>
  );
};

export default EmployeeList;
