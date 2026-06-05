import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getLoanStats, getAllLoans, approveLoan, rejectLoan, getLoanDetails } from '../services/loan.service';
import { IndianRupee, FileText, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const LoanManagement = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      const [s, l] = await Promise.all([
        getLoanStats(),
        getAllLoans(filterStatus ? { status: filterStatus } : {})
      ]);
      setStats(s);
      setLoans(l);
    } catch (error) {
      console.error('Failed to fetch loan data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this loan?')) return;
    try {
      await approveLoan(id);
      showToast('Loan approved successfully', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to approve loan', 'error');
    }
  };

  const handleReject = async (id: string) => {
    const remarks = prompt('Enter rejection reason:');
    if (remarks === null) return;
    try {
      await rejectLoan(id, remarks);
      showToast('Loan rejected', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to reject loan', 'error');
    }
  };

  const viewSchedule = async (id: string) => {
    try {
      const data = await getLoanDetails(id);
      setSelectedLoan(data);
      setShowModal(true);
    } catch (error) {
      showToast('Failed to fetch loan details', 'error');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading Loans...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans & Advances</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage employee financial assistance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600' }}>Outstanding</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{Number(stats?.totalOutstanding || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600' }}>Active Loans</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats?.activeLoansCount || 0}</div>
          </div>
        </div>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px', color: 'var(--warning)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{stats?.pendingApprovalCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="premium-card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '800' }}>Loan Applications</h2>
          <select 
            className="form-input" 
            style={{ width: 'auto', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Tenure</th>
                <th>EMI</th>
                <th>Start Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{loan.employee.first_name} {loan.employee.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{loan.employee.employee_code}</div>
                  </td>
                  <td style={{ fontWeight: '600' }}>{loan.loan_type}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{Number(loan.principal_amount).toLocaleString()}</td>
                  <td>{loan.tenure_months} Mo</td>
                  <td>₹{Number(loan.emi_amount).toLocaleString()}</td>
                  <td>{new Date(loan.start_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${loan.status === 'ACTIVE' ? 'badge-success' : loan.status === 'PENDING' ? 'badge-warning' : loan.status === 'REJECTED' ? 'badge-danger' : 'badge-primary'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {loan.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(loan.id)} className="btn btn-success" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Approve">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleReject(loan.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '6px' }} title="Reject">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => viewSchedule(loan.id)} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '6px' }} title="View Schedule">
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No loan applications found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Details & Schedule Modal */}
      {showModal && selectedLoan && (
        <div className="modal" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div className="premium-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Loan Details & Repayment Schedule</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Employee: {selectedLoan.employee.first_name} {selectedLoan.employee.last_name} ({selectedLoan.employee.employee_code})
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              {/* Loan Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', backgroundColor: 'var(--bg-page)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Loan Amount</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>₹{Number(selectedLoan.principal_amount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Tenure</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{selectedLoan.tenure_months} Months</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Interest Rate</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{Number(selectedLoan.interest_rate)}% p.a.</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Monthly EMI</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--primary)' }}>₹{Number(selectedLoan.emi_amount).toLocaleString()}</div>
                </div>
              </div>

              {/* Repayment Table */}
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Repayment Schedule</h3>
              <table className="premium-table">
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr>
                    <th>#</th>
                    <th>Month/Year</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLoan.repayments?.map((r: any, idx: number) => (
                    <tr key={r.id}>
                      <td>{idx + 1}</td>
                      <td>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][r.month - 1]} {r.year}</td>
                      <td>₹{Number(r.emi_amount).toLocaleString()}</td>
                      <td>₹{Number(r.principal_component).toLocaleString()}</td>
                      <td>₹{Number(r.interest_component).toLocaleString()}</td>
                      <td>₹{Number(r.balance_remaining).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${r.status === 'DEDUCTED' ? 'badge-success' : 'badge-primary'}`}>
                          {r.status === 'DEDUCTED' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!selectedLoan.repayments || selectedLoan.repayments.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No repayment schedule generated yet. Schedule is generated once the loan is approved.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-page)' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
