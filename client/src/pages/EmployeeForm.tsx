import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, updateEmployee, getEmployee, getDepartments, getDesignations } from '../services/employee.service';

const EmployeeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    work_email: '',
    date_of_joining: '',
    department_id: '',
    designation_id: '',
    employment_status: 'ACTIVE',
    employment_type: 'FULL_TIME'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depts, desigs] = await Promise.all([getDepartments(), getDesignations()]);
        setDepartments(depts);
        setDesignations(desigs);

        if (id) {
          const emp = await getEmployee(id);
          setFormData({
            employee_code: emp.employee_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            work_email: emp.work_email,
            date_of_joining: emp.date_of_joining.split('T')[0],
            department_id: emp.department_id || '',
            designation_id: emp.designation_id || '',
            employment_status: emp.employment_status,
            employment_type: emp.employment_type
          });
        }
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (id) {
        await updateEmployee(id, formData);
      } else {
        await createEmployee(formData);
      }
      navigate('/employees');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>{id ? 'Edit Employee' : 'Add New Employee'}</h1>
      
      <div className="card">
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Employee Code</label>
              <input name="employee_code" value={formData.employee_code} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input type="email" name="work_email" value={formData.work_email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="department_id" value={formData.department_id} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select name="designation_id" value={formData.designation_id} onChange={handleChange}>
                <option value="">Select Designation</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Joining</label>
              <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Employment Status</label>
              <select name="employment_status" value={formData.employment_status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="NOTICE_PERIOD">Notice Period</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center" style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button type="button" className="btn" onClick={() => navigate('/employees')} style={{ border: '1px solid var(--border)' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
