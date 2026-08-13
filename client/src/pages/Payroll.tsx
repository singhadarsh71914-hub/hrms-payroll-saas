import React, { useEffect, useState } from 'react';
import { payrollService, type PayrollRun, type Payslip } from '../services/payroll.service';
import { AlertTriangle, Play, FileText, ChevronRight, CheckCircle, Download, Search, Users, IndianRupee, Activity, Briefcase } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';
import { PayrollProgressModal } from '../components/payroll/PayrollProgressModal';

const Payroll: React.FC = () => {
  const { showToast } = useToast();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

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
    setProcessing(true);
    try {
      const result = await payrollService.runPayroll(month, year);
      setCurrentJobId(result.job_id || 'dummy-job');
      await fetchRuns();
      await fetchPayslips(result.id);
      showToast('Payroll processed successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to process payroll', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPayslip = async (employeeId: string) => {
    if (!selectedRunId) return;
    try {
      const response = await payrollService.downloadPayslip(selectedRunId, employeeId);
      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { 
        type: typeof contentType === 'string' ? contentType : 'application/pdf' 
      });

      let filename = `payslip_${employeeId}.pdf`;
      const contentDisposition = response.headers['content-disposition'];
      if (typeof contentDisposition === 'string') {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Failed to download payslip', err);
      showToast('Failed to download payslip', 'error');
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedRun = runs.find(r => r.id === selectedRunId);

  // Derived Summary Stats
  const totalPayroll = payslips.reduce((acc, curr) => acc + Number(curr.net_salary), 0);
  const totalGross = payslips.reduce((acc, curr) => acc + Number(curr.gross_salary), 0);
  const totalDeductions = payslips.reduce((acc, curr) => acc + Number(curr.total_deductions), 0);
  const totalEmployerContribs = payslips.reduce((acc, curr) => acc + Number(curr.total_employer_contributions || 0), 0);
  const totalCompanyCost = payslips.reduce((acc, curr) => acc + Number(curr.total_company_cost || 0), 0);
  const employeesPaid = payslips.length;

  // Derive unique departments dynamically from payslips for filter
  const departments = Array.from(new Set(payslips.map(p => p.employee?.department?.name || 'Unassigned')));

  const filteredPayslips = payslips.filter(p => {
    const matchSearch = `${p.employee?.first_name} ${p.employee?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.employee?.employee_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter ? (p.employee?.department?.name || 'Unassigned') === deptFilter : true;
    return matchSearch && matchDept;
  });

  if (loading) return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
           <Skeleton width="300px" height="32px" />
           <div style={{ marginTop: '0.5rem' }}><Skeleton width="400px" height="20px" /></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Skeleton height="350px" borderRadius="12px" />
          <Skeleton height="300px" borderRadius="12px" />
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
            <Skeleton height="100px" borderRadius="12px" />
          </div>
          <Skeleton height="400px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
           <h1 className="page-title">Payroll Processing</h1>
           <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Execute and review monthly disbursements</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '320px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Controls & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          
          <div className="premium-card">
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Play size={20} color="var(--primary)" /> Execute Payroll
            </h3>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-base, 14px)', fontWeight: '700', marginBottom: '0.5rem' }}>Financial Year</label>
              <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-base, 14px)', fontWeight: '700', marginBottom: '0.5rem' }}>Processing Month</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600', outline: 'none' }}
              >
                {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <button 
              data-testid="run-payroll-btn"
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '1rem' }}
              onClick={handleRunPayroll}
              disabled={processing}
            >
              <Play size={20} />
              {processing ? 'Processing...' : 'Run Payroll'}
            </button>
          </div>

          <div className="premium-card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
               <h3 style={{ margin: 0, fontWeight: '800' }}>Recent Batches</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {runs.map(run => (
                <div 
                  key={run.id} 
                  onClick={() => fetchPayslips(run.id)}
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: selectedRunId === run.id ? 'var(--sidebar-hover)' : 'transparent',
                    borderLeft: selectedRunId === run.id ? '4px solid var(--primary)' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '1rem', color: selectedRunId === run.id ? 'var(--primary)' : 'var(--text-main)' }}>{months[run.month - 1]} {run.year}</div>
                    <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.25rem' }}>
                      Processed: {new Date(run.run_date).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight size={18} color={selectedRunId === run.id ? "var(--primary)" : "var(--text-muted)"} />
                </div>
              ))}
              {error ? (
                <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '3rem', fontSize: 'var(--font-base, 14px)' }}>
                  Failed to load batch history.
                </div>
              ) : runs.length === 0 && (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', fontSize: 'var(--font-base, 14px)' }}>
                  No batch history found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Details */}
        <div>
          {selectedRunId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
               
               {/* Summary Cards */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                  <div className="premium-card" style={{ borderTop: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                     <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Salary</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--success)' }}>₹{totalGross.toLocaleString()}</div>
                  </div>
                  <div className="premium-card" style={{ borderTop: '4px solid var(--danger)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                     <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emp Deductions</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--danger)' }}>₹{totalDeductions.toLocaleString()}</div>
                  </div>
                  <div className="premium-card" style={{ borderTop: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                     <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Salary</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)' }}>₹{totalPayroll.toLocaleString()}</div>
                  </div>
                  <div className="premium-card" style={{ borderTop: '4px solid var(--warning)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                     <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employer Contrib</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--warning)' }}>₹{totalEmployerContribs.toLocaleString()}</div>
                  </div>
                  <div className="premium-card" style={{ borderTop: '4px solid var(--secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                     <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Company Cost</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--secondary)' }}>₹{totalCompanyCost.toLocaleString()}</div>
                  </div>
               </div>

              <div className="premium-card" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem' }}>
                       Batch Results: {selectedRun ? `${months[selectedRun.month - 1]} ${selectedRun.year}` : ''}
                     </h3>
                     {selectedRun?.skipped_employees && selectedRun.skipped_employees > 0 ? (
                         <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#b45309', background: '#fef3c7' }}><AlertTriangle size={14} /> Completed with {selectedRun.skipped_employees} employees skipped</span>
                       ) : (
                         <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Completed successfully</span>
                       )}
                  </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                   <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                     <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                     <input 
                       type="text" 
                       placeholder="Search employees..." 
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--card-bg)' }}
                     />
                   </div>
                   <select 
                     value={deptFilter} 
                     onChange={e => setDeptFilter(e.target.value)}
                     style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--card-bg)', fontWeight: '600' }}
                   >
                      <option value="">All Departments</option>
                      {departments.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                   </select>
                </div>

                <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Employee Details</th>
                        <th>Department</th>
                        <th>Gross Earnings</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayslips.map(slip => (
                        <tr key={slip.id}>
                          <td style={{ padding: '1.25rem' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                              {slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'Unknown Employee'}
                            </div>
                            <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', fontWeight: '600' }}>
                              {slip.employee?.employee_code || 'N/A'}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <Briefcase size={14} color="var(--text-muted)" />
                               {slip.employee?.department?.name || 'Unassigned'}
                             </div>
                          </td>
                          <td style={{ fontWeight: '700' }}>
                            ₹{Number(slip.gross_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ color: 'var(--danger)', fontWeight: '700' }}>
                            ₹{Number(slip.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.05rem' }}>
                            ₹{Number(slip.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                              onClick={() => handleDownloadPayslip(slip.employee_id)}
                            >
                              <Download size={16} />
                              Download Payslip
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredPayslips.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                             <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                                <AlertTriangle size={48} className="empty-state-icon" style={{ color: '#b45309' }} />
                                <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No salary components configured</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>Create or assign a salary structure before processing payroll.</p>
                             </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px', color: 'var(--text-muted)', border: '2px dashed var(--border)', background: 'transparent', boxShadow: 'none' }}>
              <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--radius-full, 50%)', marginBottom: '1.5rem', boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }}>
                <FileText size={48} color="var(--primary)" opacity={0.8} />
              </div>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: '800' }}>No Batch Selected</h2>
              <p style={{ fontSize: '1rem' }}>Select a payroll run from the history panel to view detailed disbursements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
