import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Building, Briefcase, Calendar, Phone, MapPin, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getEmployee } from '../services/employee.service';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getEmployee(id);
        setEmployee(data);
      } catch (err: any) {
        console.error('Failed to fetch employee details', err);
        setError(err.response?.data?.message || err.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <Loader2 size={40} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <p>Loading employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="premium-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <AlertCircle size={48} color="var(--danger)" />
          <h2 style={{ color: 'var(--text-main)' }}>Profile Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error || 'Employee not found or you do not have permission to view it.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} />
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/employees')}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: 0, fontWeight: '500' }}
      >
        <ArrowLeft size={16} />
        Back to Employee List
      </button>

      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header Cover / Hero */}
        <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-40px', left: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '24px', 
              backgroundColor: '#1e293b', 
              border: '4px solid #0f172a', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              color: 'var(--primary)'
            }}>
              <User size={64} />
            </div>
            <div style={{ paddingBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {employee?.first_name} {employee?.last_name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#cbd5e1', fontSize: '0.925rem' }}>
                <span>{employee?.employee_code}</span>
                <span>•</span>
                <span className="badge badge-success" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>{employee?.employment_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs Area */}
        <div style={{ padding: '60px 2rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Professional Details */}
            <div className="card" style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: '#334155' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                <Briefcase size={20} color="var(--primary)" />
                Work Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <InfoRow icon={<Building size={16} />} label="Department" value={employee?.department?.name ?? 'No Department'} />
                <InfoRow icon={<Briefcase size={16} />} label="Designation" value={employee?.designation?.name ?? 'No Designation'} />
                <InfoRow icon={<Calendar size={16} />} label="Joining Date" value={employee?.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : 'N/A'} />
                <InfoRow icon={<User size={16} />} label="Reporting Manager" value={employee?.reporting_manager ? `${employee.reporting_manager.first_name} ${employee.reporting_manager.last_name}` : 'No Manager'} />
              </div>
            </div>

            {/* Personal/Contact Details */}
            <div className="card" style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: '#334155' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                <Mail size={20} color="var(--primary)" />
                Contact Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <InfoRow icon={<Mail size={16} />} label="Work Email" value={employee?.work_email ?? 'N/A'} />
                <InfoRow icon={<Phone size={16} />} label="Phone" value={employee?.phone ?? 'Not provided'} />
                <InfoRow icon={<MapPin size={16} />} label="Location" value={employee?.work_location ?? 'On-site'} />
                <InfoRow icon={<Calendar size={16} />} label="Employment Type" value={employee?.employment_type ?? 'FULL_TIME'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
    <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-main)' }}>{value}</div>
    </div>
  </div>
);

export default EmployeeDetails;
