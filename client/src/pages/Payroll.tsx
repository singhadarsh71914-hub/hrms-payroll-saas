import React, { useEffect, useState } from 'react';
import { payrollService, type PayrollRun, type Payslip } from '../services/payroll.service';
import { Play, FileText, ChevronRight, CheckCircle, Download } from 'lucide-react';

const Payroll: React.FC = () => {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchRuns = async () => {
    try {
      const data = await payrollService.getRuns();
      setRuns(data);
    } catch (err) {
      console.error('Failed to fetch runs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async (runId: string) => {
    try {
      const data = await payrollService.getPayslips(runId);
      setPayslips(data);
      setSelectedRunId(runId);
    } catch (err) {
      console.error('Failed to fetch payslips', err);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunPayroll = async () => {
    if (!window.confirm(`Run payroll for ${month}/${year}?`)) return;
    setProcessing(true);
    try {
      const result = await payrollService.runPayroll(month, year);
      await fetchRuns();
      await fetchPayslips(result.id);
      alert('Payroll processed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPayslip = async (employeeId: string) => {
    if (!selectedRunId) return;
    try {
      const blob = await payrollService.downloadPayslip(selectedRunId, employeeId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${employeeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download payslip', err);
      alert('Failed to download payslip');
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedRun = runs.find(r => r.id === selectedRunId);

  if (loading) return <div>Loading payroll data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Payroll Management</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Run New Payroll</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Year</label>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleRunPayroll}
              disabled={processing}
            >
              <Play size={18} />
              {processing ? 'Processing...' : 'Run Payroll'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Recent Runs</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {runs.map(run => (
                <div 
                  key={run.id} 
                  onClick={() => fetchPayslips(run.id)}
                  style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selectedRunId === run.id ? 'var(--bg-light)' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{months[run.month - 1]} {run.year}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(run.run_date).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
              {runs.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
                  No previous runs
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {selectedRunId ? (
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>
                  Results: {selectedRun ? `${months[selectedRun.month - 1]} ${selectedRun.year}` : 'Loading...'}
                </h3>
                <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  <CheckCircle size={16} />
                  PROCESSED
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem' }}>Employee</th>
                      <th style={{ padding: '1rem' }}>Gross Earnings</th>
                      <th style={{ padding: '1rem' }}>Deductions</th>
                      <th style={{ padding: '1rem' }}>Net Salary</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(slip => (
                      <tr key={slip.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'Unknown Employee'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {slip.employee?.employee_code || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          ₹{Number(slip.gross_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#ef4444' }}>
                          ₹{Number(slip.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>
                          ₹{Number(slip.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button 
                            className="btn btn-outline"
                            style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
                            onClick={() => handleDownloadPayslip(slip.employee_id)}
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
              <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.1 }} />
              <p style={{ fontSize: '1.125rem' }}>Select a payroll run from the list to view detailed results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
