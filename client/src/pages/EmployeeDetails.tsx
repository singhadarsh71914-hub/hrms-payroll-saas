import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Calendar, Phone, MapPin, 
  ArrowLeft, Loader2, AlertCircle, Clock, FileText, IndianRupee, 
  Download, Trash2, Eye, Upload, ShieldCheck, Info, Plus, X
} from 'lucide-react';
import { 
  getEmployee, 
  getEmployeeAttendance, 
  getEmployeeLeaves, 
  getEmployeePayrolls, 
  getEmployeeDocuments, 
  getEmployeeLoans,
  deleteEmployeeDocument,
  uploadEmployeeDocument,
  markEmployeeAttendance,
  applyEmployeeLeave,
  applyEmployeeLoan
} from '../services/employee.service';

type TabType = 'profile' | 'attendance' | 'leaves' | 'payroll' | 'documents' | 'loans';

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="premium-card" style={{ width: '100%', maxWidth: '500px', margin: '0 1rem', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tabData, setTabData] = useState<any>({
    attendance: null,
    leaves: null,
    payrolls: null,
    documents: null,
    loans: null
  });
  const [tabLoading, setTabLoading] = useState(false);

  const fetchEmployee = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const fetchTabData = useCallback(async (tab: TabType, force = false) => {
    if (!id || tab === 'profile') return;
    if (tabData[tab] && !force) return;

    try {
      setTabLoading(true);
      let data;
      switch (tab) {
        case 'attendance': data = await getEmployeeAttendance(id); break;
        case 'leaves': data = await getEmployeeLeaves(id); break;
        case 'payroll': data = await getEmployeePayrolls(id); break;
        case 'documents': data = await getEmployeeDocuments(id); break;
        case 'loans': data = await getEmployeeLoans(id); break;
      }
      setTabData((prev: any) => ({ ...prev, [tab]: data }));
    } catch (err) {
      console.error(`Failed to fetch ${tab} data`, err);
    } finally {
      setTabLoading(false);
    }
  }, [id, tabData]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <Loader2 size={40} className="animate-spin" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
        <p>Loading employee workspace...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="premium-card" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <AlertCircle size={48} color="var(--danger)" />
          <h2 style={{ color: 'var(--text-main)' }}>Workspace Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error || 'Employee not found or you do not have permission to view it.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/employees')}>
            <ArrowLeft size={18} />
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const handleRefreshTab = () => {
    fetchTabData(activeTab, true);
  };

  const renderTabContent = () => {
    if (tabLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={24} />
          <span style={{ marginLeft: '0.75rem' }}>Loading data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile': return <ProfileTab employee={employee} />;
      case 'attendance': return <AttendanceTab data={tabData.attendance} employeeId={id!} onRefresh={handleRefreshTab} />;
      case 'leaves': return <LeavesTab data={tabData.leaves} employeeId={id!} onRefresh={handleRefreshTab} />;
      case 'payroll': return <PayrollTab data={tabData.payrolls} />;
      case 'documents': return <DocumentsTab data={tabData.documents} employeeId={id!} onRefresh={handleRefreshTab} />;
      case 'loans': return <LoansTab data={tabData.loans} employeeId={id!} onRefresh={handleRefreshTab} />;
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/employees')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, fontWeight: '500' }}
        >
          <ArrowLeft size={16} />
          Directory
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/employees/edit/${employee.id}`)}>Edit Profile</button>
        </div>
      </div>

      <div className="premium-card" style={{ padding: 0, overflow: 'hidden', border: 'none', backgroundColor: 'transparent' }}>
        <div className="premium-card" style={{ padding: 0, marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)' }}></div>
          <div style={{ padding: '0 2rem 1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '-40px', flexWrap: 'wrap' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '20px', 
                backgroundColor: '#1e293b', 
                border: '4px solid #0f172a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}>
                <User size={50} />
              </div>
              <div style={{ paddingBottom: '0.25rem', flex: 1, minWidth: '250px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                  {employee.first_name} {employee.last_name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> {employee.employee_code}
                  </span>
                  <span>•</span>
                  <span>{employee.designation?.name || 'No Designation'}</span>
                  <span>•</span>
                  <span className={`badge badge-${employee.employment_status === 'ACTIVE' ? 'success' : 'warning'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
                    {employee.employment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', padding: '0 1rem', borderTop: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.5)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={16} />} label="Profile" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Clock size={16} />} label="Attendance" />
            <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={<Calendar size={16} />} label="Leaves" />
            <TabButton active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<IndianRupee size={16} />} label="Payroll" />
            <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} icon={<FileText size={16} />} label="Documents" />
            <TabButton active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} icon={<IndianRupee size={16} />} label="Loans" />
          </div>
        </div>

        <div style={{ minHeight: '400px' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '1rem 1.5rem',
      background: 'none',
      border: 'none',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      fontSize: '0.9rem',
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      position: 'relative',
      transition: 'color 0.2s',
      borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
      whiteSpace: 'nowrap'
    }}
  >
    {icon}
    {label}
  </button>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem', color: '#f1f5f9' }}>
    <span style={{ color: 'var(--primary)' }}>{icon}</span>
    {title}
  </h3>
);

// TAB: PROFILE
const ProfileTab = ({ employee }: { employee: any }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
    <div className="premium-card" style={{ padding: '1.5rem' }}>
      <SectionTitle icon={<Briefcase size={20} />} title="Professional Details" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <InfoRow label="Department" value={employee.department?.name || 'N/A'} />
        <InfoRow label="Designation" value={employee.designation?.name || 'N/A'} />
        <InfoRow label="Join Date" value={new Date(employee.date_of_joining).toLocaleDateString()} />
        <InfoRow label="Reporting Manager" value={employee.reporting_manager ? `${employee.reporting_manager.first_name} ${employee.reporting_manager.last_name}` : 'None'} />
        <InfoRow label="Work Email" value={employee.work_email} />
        <InfoRow label="Location" value={employee.work_location || 'Head Office'} />
      </div>
    </div>

    <div className="premium-card" style={{ padding: '1.5rem' }}>
      <SectionTitle icon={<User size={20} />} title="Personal & Contact" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <InfoRow label="Personal Email" value={employee.personal_email || 'N/A'} />
        <InfoRow label="Phone Number" value={employee.phone || 'N/A'} />
        <InfoRow label="Date of Birth" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A'} />
        <InfoRow label="Gender" value={employee.gender || 'N/A'} />
        <InfoRow label="Aadhaar" value={employee.aadhaar_number || 'N/A'} />
        <InfoRow label="PAN" value={employee.pan_number || 'N/A'} />
      </div>
    </div>

    <div className="premium-card" style={{ padding: '1.5rem' }}>
      <SectionTitle icon={<MapPin size={20} />} title="Address Information" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <InfoRow label="Permanent Address" value={`${employee.address_line1 || ''} ${employee.address_line2 || ''}`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
           <InfoRow label="City" value={employee.city || 'N/A'} />
           <InfoRow label="State" value={employee.state || 'N/A'} />
           <InfoRow label="Pincode" value={employee.pincode || 'N/A'} />
        </div>
      </div>
    </div>

    <div className="premium-card" style={{ padding: '1.5rem' }}>
      <SectionTitle icon={<Phone size={20} />} title="Emergency Contact" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <InfoRow label="Contact Name" value={employee.emergency_contact_name || 'N/A'} />
        <InfoRow label="Relationship" value={employee.emergency_contact_relationship || 'N/A'} />
        <InfoRow label="Contact Phone" value={employee.emergency_contact_phone || 'N/A'} />
      </div>
    </div>
  </div>
);

// TAB: ATTENDANCE
const AttendanceTab = ({ data, employeeId, onRefresh }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: '', checkIn: '', checkOut: '', status: 'PRESENT', remarks: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { employeeId, date: formData.date, status: formData.status, remarks: formData.remarks };
      if (formData.checkIn) payload.checkIn = `${formData.date}T${formData.checkIn}:00.000Z`;
      if (formData.checkOut) payload.checkOut = `${formData.date}T${formData.checkOut}:00.000Z`;
      
      await markEmployeeAttendance(payload);
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to mark attendance');
    }
  };

  const hasData = data && data.attendance && data.attendance.length > 0;
  const stats = hasData ? data.stats : { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, total: 0 };
  const attendanceRate = stats.total > 0 ? ((stats.PRESENT + stats.HALF_DAY) / stats.total * 100).toFixed(1) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
           <Plus size={14} /> Add Attendance
        </button>
      </div>

      {!hasData ? (
        <EmptyState label="No attendance records found" actionLabel="Add Record" onAction={() => setIsModalOpen(true)} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard label="Present Days" value={stats.PRESENT} color="#10b981" />
            <StatCard label="Absent Days" value={stats.ABSENT} color="#ef4444" />
            <StatCard label="Half Days" value={stats.HALF_DAY} color="#f59e0b" />
            <StatCard label="Attendance %" value={`${attendanceRate}%`} color="#3b82f6" />
          </div>

          <div className="premium-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>DATE</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>CHECK IN</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>CHECK OUT</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {data.attendance.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9', fontWeight: '500' }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1' }}>{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1' }}>{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge badge-${a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'danger' : 'warning'}`}>{a.status}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>{a.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Mark Attendance">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Check In Time</label>
              <input type="time" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Check Out Time</label>
              <input type="time" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Status *</label>
            <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
          <div className="form-group">
            <label>Remarks</label>
            <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Record</button>
        </form>
      </Modal>
    </div>
  );
};

// TAB: LEAVES
const LeavesTab = ({ data, employeeId, onRefresh }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyEmployeeLeave({ employeeId, ...formData });
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to apply for leave');
    }
  };

  const hasData = data && data.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
           <Plus size={14} /> Apply Leave
        </button>
      </div>

      {!hasData ? (
        <EmptyState label="No leave history available" actionLabel="Apply Leave" onAction={() => setIsModalOpen(true)} />
      ) : (
        <div className="premium-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>TYPE</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>DATES</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>DAYS</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>STATUS</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>APPROVED BY</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9', fontWeight: '600' }}>{l.leave_type}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1' }}>
                    {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9' }}>{Number(l.total_days)}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge badge-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>{l.status}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: '#94a3b8' }}>{l.approved_by || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply Leave">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Leave Type *</label>
            <select required value={formData.leaveType} onChange={e => setFormData({...formData, leaveType: e.target.value})}>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Reason *</label>
            <textarea required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Application</button>
        </form>
      </Modal>
    </div>
  );
};

// TAB: PAYROLL
const PayrollTab = ({ data }: { data: any }) => {
  const hasData = data && data.length > 0;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div>
      {!hasData ? (
        <EmptyState label="No payroll records found" />
      ) : (
        <div className="premium-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>MONTH/YEAR</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>GROSS</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>DEDUCTIONS</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>NET SALARY</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9', fontWeight: '600' }}>{months[p.month-1]} {p.year}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1' }}>₹{Number(p.gross_salary).toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#ef4444' }}>₹{Number(p.total_deductions).toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', color: '#10b981', fontWeight: '700' }}>₹{Number(p.net_salary).toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// TAB: DOCUMENTS
const DocumentsTab = ({ data, employeeId, onRefresh }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('OTHER');
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteEmployeeDocument(docId);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return alert('Please select a file');
    
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('document_type', docType);
      formData.append('document_name', docName || fileInputRef.current.files[0].name);
      
      await uploadEmployeeDocument(employeeId, formData);
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const hasData = data && data.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
           <Upload size={14} /> Upload Document
        </button>
      </div>

      {!hasData ? (
        <EmptyState label="No documents uploaded yet" actionLabel="Upload First Document" onAction={() => setIsModalOpen(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {data.map((doc: any) => (
            <div key={doc.id} className="premium-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                <FileText size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.document_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ color: '#94a3b8', padding: '4px' }} title="Download">
                  <Download size={16} />
                </a>
                <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Document Type *</label>
            <select required value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="ID_PROOF">ID Proof (Aadhaar/PAN)</option>
              <option value="ADDRESS_PROOF">Address Proof</option>
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="PF_FORM">PF Form</option>
              <option value="FORM16">Form 16</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Document Name (Optional)</label>
            <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Employee Resume" />
          </div>
          <div className="form-group">
            <label>File *</label>
            <input type="file" ref={fileInputRef} required className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// TAB: LOANS
const LoansTab = ({ data, employeeId, onRefresh }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ loanType: 'PERSONAL', principalAmount: '', interestRate: '0', tenureMonths: '', startDate: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyEmployeeLoan({ employeeId, ...formData });
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to apply for loan');
    }
  };

  const hasData = data && data.length > 0;
  const totalOutstanding = hasData ? data.reduce((acc: number, loan: any) => {
      if (loan.status === 'ACTIVE') {
          const lastRepayment = (loan.repayments || [])
            .filter((r: any) => r.status === 'DEDUCTED')
            .sort((a: any, b: any) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
          return acc + (lastRepayment ? Number(lastRepayment.balance_remaining) : Number(loan.principal_amount));
      }
      return acc;
  }, 0) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
           <Plus size={14} /> Create Loan
        </button>
      </div>

      {!hasData ? (
        <EmptyState label="No loan records found" actionLabel="Create First Loan" onAction={() => setIsModalOpen(true)} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard label="Total Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} color="#ef4444" />
            <StatCard label="Active Loans" value={data.filter((l: any) => l.status === 'ACTIVE').length} color="#3b82f6" />
            <StatCard label="Total Loans" value={data.length} color="#94a3b8" />
          </div>

          <div className="premium-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>LOAN TYPE</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>PRINCIPAL</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>EMI</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>START DATE</th>
                </tr>
              </thead>
              <tbody>
                {data.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9', fontWeight: '600' }}>{l.loan_type}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#cbd5e1' }}>₹{Number(l.principal_amount).toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#f1f5f9' }}>₹{Number(l.emi_amount).toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className={`badge badge-${l.status === 'ACTIVE' || l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>{l.status}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#94a3b8' }}>{new Date(l.start_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Loan Request">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Loan Type *</label>
            <select required value={formData.loanType} onChange={e => setFormData({...formData, loanType: e.target.value})}>
              <option value="PERSONAL">Personal</option>
              <option value="MEDICAL">Medical</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="EDUCATION">Education</option>
              <option value="HOME">Home</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Principal Amount (₹) *</label>
              <input type="number" required min="1" value={formData.principalAmount} onChange={e => setFormData({...formData, principalAmount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tenure (Months) *</label>
              <input type="number" required min="1" value={formData.tenureMonths} onChange={e => setFormData({...formData, tenureMonths: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Interest Rate (%) *</label>
              <input type="number" required min="0" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Loan Application</button>
        </form>
      </Modal>
    </div>
  );
};

// --- UTILS ---

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div>
    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</div>
    <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#e2e8f0', wordBreak: 'break-word' }}>{value}</div>
  </div>
);

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="premium-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{label}</div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc' }}>{value}</div>
  </div>
);

const EmptyState = ({ label, actionLabel, onAction }: { label: string, actionLabel?: string, onAction?: () => void }) => (
  <div style={{ padding: '4rem 2rem', textAlign: 'center' }} className="premium-card">
    <Info size={40} color="#475569" style={{ marginBottom: '1rem', margin: '0 auto' }} />
    <p style={{ color: '#64748b', marginBottom: actionLabel ? '1.5rem' : 0 }}>{label}</p>
    {actionLabel && onAction && (
      <button className="btn btn-primary mx-auto" onClick={onAction}>
        <Plus size={18} /> {actionLabel}
      </button>
    )}
  </div>
);

export default EmployeeDetails;
