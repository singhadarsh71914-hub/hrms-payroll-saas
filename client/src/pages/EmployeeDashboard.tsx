import { useEffect, useState } from 'react';
import { getEmployeeDashboard, downloadPayslip } from '../services/selfService.service';
import api from '../services/api';
import { CreditCard, Clock, Download, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const EmployeeDashboard = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    api.get('/announcements').then(res => setAnnouncements(res.data)).catch(console.error);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await getEmployeeDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payslipId: string, month: number, year: number) => {
    try {
      const blob = await downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Failed to download payslip', error);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

  const { leaveBalances, latestPayslip, attendanceSummary } = data;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>My Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back! Here's your summary.</p>
      </header>

      {/* ANNOUNCEMENTS WIDGET */}
      {announcements.length > 0 && (
        <div className="premium-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b' }}>
          <div className="card-title"><Bell size={20} color="#f59e0b" /> Company Announcements</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {announcements.slice(0, 3).map((a: any, i: number) => (
              <div key={i} style={{ padding: '1rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '8px', borderLeft: `3px solid ${a.priority === 'URGENT' ? '#ef4444' : a.priority === 'IMPORTANT' ? '#f59e0b' : '#3b82f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>{a.title}</h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Latest Payslip */}
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Latest Net Salary</span>
            <div style={{ backgroundColor: isDark ? '#1e3a8a' : '#eef2ff', padding: '0.5rem', borderRadius: '8px', color: '#3b82f6' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>
            {latestPayslip ? `₹${Number(latestPayslip.net_salary).toLocaleString()}` : 'N/A'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {latestPayslip ? `${new Date(0, latestPayslip.month - 1).toLocaleString('default', { month: 'long' })} ${latestPayslip.year}` : 'No payslips generated yet'}
          </p>
        </div>

        {/* Attendance Summary */}
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase' }}>Attendance (This Month)</span>
            <div style={{ backgroundColor: isDark ? '#064e3b' : '#f0fdf4', padding: '0.5rem', borderRadius: '8px', color: '#10b981' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{attendanceSummary.PRESENT} Days</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Present: {attendanceSummary.PRESENT} | Absent: {attendanceSummary.ABSENT} | Leave: {attendanceSummary.ON_LEAVE}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Leave Balances */}
        <div className="premium-card">
          <div className="card-title">Leave Balances</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaveBalances.map((b: any) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{b.leave_type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Quota: {Number(b.total_days)}</div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6' }}>
                  {Number(b.balance_days)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Payslip Action */}
        {latestPayslip && (
          <div className="premium-card">
            <div className="card-title">Recent Payslip</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{new Date(0, latestPayslip.month - 1).toLocaleString('default', { month: 'long' })} {latestPayslip.year}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Net: ₹{Number(latestPayslip.net_salary).toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => handleDownload(latestPayslip.id, latestPayslip.month, latestPayslip.year)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
