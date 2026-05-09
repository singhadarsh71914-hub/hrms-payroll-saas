import React, { useEffect, useState } from 'react';
import { getEmployees } from '../services/employee.service';
import { Users, IndianRupee, Briefcase, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employees = await getEmployees();
        setEmployeeCount(employees.length);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card flex items-center gap-4">
          <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Employees</p>
            <h3 style={{ fontSize: '1.5rem' }}>{employeeCount}</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '12px' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monthly Payroll</p>
            <h3 style={{ fontSize: '1.5rem' }}>₹ 12,45,000</h3>
            <p style={{ fontSize: '0.75rem', color: '#16a34a' }}>+4.2% from last month</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '1rem', borderRadius: '12px' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Departments</p>
            <h3 style={{ fontSize: '1.5rem' }}>8</h3>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '1rem', borderRadius: '12px' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</p>
            <h3 style={{ fontSize: '1.5rem' }}>5</h3>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Recent Payroll Runs</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0' }}>Month</th>
                <th>Status</th>
                <th>Employees</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 0' }}>April 2026</td>
                <td><span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.5rem', borderRadius: '99px', fontSize: '0.75rem' }}>Paid</span></td>
                <td>124</td>
                <td>₹ 12,45,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 0' }}>March 2026</td>
                <td><span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.5rem', borderRadius: '99px', fontSize: '0.75rem' }}>Paid</span></td>
                <td>120</td>
                <td>₹ 11,80,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Employee Distribution</h3>
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            [ Chart Placeholder ]
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
