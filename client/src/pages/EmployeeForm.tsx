import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, updateEmployee, getEmployee, getDepartments, getDesignations, getEmployees } from '../services/employee.service';

const EmployeeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    work_email: '',
    date_of_joining: '',
    department_id: '',
    designation_id: '',
    reporting_manager_id: '',
    employment_status: 'ACTIVE',
    employment_type: 'FULL_TIME',
    work_location: '',
    date_of_birth: '',
    gender: '',
    personal_email: '',
    phone: '',
    aadhaar_number: '',
    pan_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [depts, desigs, emps] = await Promise.all([getDepartments(), getDesignations(), getEmployees()]);
        setDepartments(depts);
        setDesignations(desigs);
        setEmployees(emps);

        if (id) {
          const emp = await getEmployee(id);
          setFormData({
            employee_code: emp.employee_code || '',
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            work_email: emp.work_email || '',
            date_of_joining: emp.date_of_joining ? emp.date_of_joining.split('T')[0] : '',
            department_id: emp.department_id || '',
            designation_id: emp.designation_id || '',
            reporting_manager_id: emp.reporting_manager_id || '',
            employment_status: emp.employment_status || 'ACTIVE',
            employment_type: emp.employment_type || 'FULL_TIME',
            work_location: emp.work_location || '',
            date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
            gender: emp.gender || '',
            personal_email: emp.personal_email || '',
            phone: emp.phone || '',
            aadhaar_number: emp.aadhaar_number || '',
            pan_number: emp.pan_number || '',
            address_line1: emp.address_line1 || '',
            address_line2: emp.address_line2 || '',
            city: emp.city || '',
            state: emp.state || '',
            pincode: emp.pincode || '',
            country: emp.country || '',
            emergency_contact_name: emp.emergency_contact_name || '',
            emergency_contact_phone: emp.emergency_contact_phone || '',
            emergency_contact_relationship: emp.emergency_contact_relationship || ''
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
      const payload = { ...formData };
      if (!payload.date_of_birth) delete (payload as any).date_of_birth;
      if (!payload.department_id) delete (payload as any).department_id;
      if (!payload.designation_id) delete (payload as any).designation_id;
      if (!payload.reporting_manager_id) delete (payload as any).reporting_manager_id;
      if (!payload.gender) delete (payload as any).gender;

      if (id) {
        await updateEmployee(id, payload);
      } else {
        await createEmployee(payload);
      }
      navigate(id ? `/employees/${id}` : '/employees');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>{id ? 'Edit Employee Profile' : 'Add New Employee'}</h1>
      
      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Professional Information */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Professional Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Employee Code *</label>
                <input name="employee_code" value={formData.employee_code} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Work Email *</label>
                <input type="email" name="work_email" value={formData.work_email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Date of Joining *</label>
                <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} required />
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
                <label>Reporting Manager</label>
                <select name="reporting_manager_id" value={formData.reporting_manager_id} onChange={handleChange}>
                  <option value="">Select Manager</option>
                  {employees.filter(e => e.id !== id).map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Employment Type</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
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
              <div className="form-group">
                <label>Work Location</label>
                <input name="work_location" value={formData.work_location} onChange={handleChange} placeholder="e.g. Head Office, Remote" />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>First Name *</label>
                <input name="first_name" value={formData.first_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input name="last_name" value={formData.last_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Personal Email</label>
                <input type="email" name="personal_email" value={formData.personal_email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Aadhaar Number</label>
                <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input name="pan_number" value={formData.pan_number} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Address Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address Line 1</label>
                <input name="address_line1" value={formData.address_line1} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address Line 2</label>
                <input name="address_line2" value={formData.address_line2} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input name="city" value={formData.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input name="state" value={formData.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input name="pincode" value={formData.pincode} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input name="country" value={formData.country} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="premium-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Contact Name</label>
                <input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <input name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn" onClick={() => navigate(id ? `/employees/${id}` : '/employees')} style={{ border: '1px solid var(--border)' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
