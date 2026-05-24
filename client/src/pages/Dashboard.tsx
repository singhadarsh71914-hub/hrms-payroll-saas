import React, { useEffect, useState } from 'react';
import { getDashboardStats, type DashboardStats } from '../services/dashboard.service';
import { Users, IndianRupee, Clock, Calendar, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Error loading stats</div>;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Dashboard Overview</h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card flex items-center gap-4">
          <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Employees</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.totalEmployees}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '12px' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Monthly Payroll</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>₹ {stats.monthlyPayrollAmount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '1rem', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pending Leaves</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.pendingLeaveRequests}</h3>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Payroll Runs */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Recent Payroll Runs</h3>
            <Link to="/payroll" className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0' }}>Period</th>
                  <th style={{ padding: '0.75rem 0' }}>Run Date</th>
                  <th style={{ padding: '0.75rem 0' }}>Employees</th>
                  <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Total Net</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayrollRuns.map(run => (
                  <tr key={run.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 500 }}>
                      {months[run.month - 1]} {run.year}
                    </td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {new Date(run.run_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{run.total_employees}</td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>
                      ₹{Number(run.total_net).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {stats.recentPayrollRuns.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent runs</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Recent Leaves</h3>
            <Link to="/leave" className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentLeaveRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{req.employee.first_name} {req.employee.last_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {req.leave_type} • {new Date(req.start_date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  color: req.status === 'APPROVED' ? '#16a34a' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                }}>
                  {req.status === 'APPROVED' && <CheckCircle size={14} />}
                  {req.status === 'REJECTED' && <XCircle size={14} />}
                  {req.status === 'PENDING' && <AlertCircle size={14} />}
                  {req.status}
                </div>
              </div>
            ))}
            {stats.recentLeaveRequests.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent requests</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
