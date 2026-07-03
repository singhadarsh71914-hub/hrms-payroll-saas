import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getMyLoans, applyLoan, getLoanDetails } from '../services/loan.service';
import { Plus, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

const MyLoans = () => {
  const { showToast } = useToast();
  const [loans, setLoans] = useState<any[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    loanType: 'PERSONAL',
    principalAmount: '',
    interestRate: '12',
    tenureMonths: '12',
    startDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await getMyLoans();
      setLoans(data);
    } catch (error) {
      console.error('Failed to fetch my loans', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyLoan({
        ...formData,
        principalAmount: Number(formData.principalAmount),
        interestRate: Number(formData.interestRate),
        tenureMonths: Number(formData.tenureMonths)
      });
      setShowApplyModal(false);
      fetchLoans();
      showToast('Loan application submitted successfully!', 'success');
    } catch (error) {
      showToast('Failed to submit application', 'error');
    }
  };

  const viewSchedule = async (id: string) => {
    try {
      const data = await getLoanDetails(id);
      setSelectedLoan(data);
      setShowScheduleModal(true);
    } catch (error) {
      showToast('Failed to fetch schedule', 'error');
    }
  };

  const calculateEMI = () => {
    const P = Number(formData.principalAmount);
    const r = (Number(formData.interestRate) / 100) / 12;
    const N = Number(formData.tenureMonths);
    if (!P || !r || !N) return 0;
    const emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    return emi.toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Skeleton width="300px" height="40px" />
          <Skeleton width="150px" height="40px" borderRadius="8px" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height="200px" borderRadius="12px" />
          <Skeleton height="200px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>My Loans & Advances</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your loan applications and repayment schedules.</p>
        </div>
        <button onClick={() => setShowApplyModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          Apply for Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="empty-state">
          <div style={{ padding: '24px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%', marginBottom: '16px', color: '#4f46e5' }}>
            <Plus size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No active loans</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You don't have any loan applications or active loans.</p>
          <button onClick={() => setShowApplyModal(true)} className="btn btn-primary">Apply Now</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {loans.map((loan) => {
            const paidCount = loan.repayments?.filter((r: any) => r.status === 'DEDUCTED').length || 0;
            const totalCount = loan.tenure_months;
            const progress = (paidCount / totalCount) * 100;
            const lastRepayment = loan.repayments?.filter((r: any) => r.status === 'DEDUCTED').sort((a: any, b: any) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
            const balance = lastRepayment ? Number(lastRepayment.balance_remaining) : Number(loan.principal_amount);

            return (
              <div key={loan.id} className="premium-card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{loan.loan_type} LOAN</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Applied on {new Date(loan.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="status-badge" style={{ 
                    backgroundColor: loan.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : loan.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: loan.status === 'ACTIVE' ? 'var(--success)' : loan.status === 'PENDING' ? 'var(--warning)' : 'var(--text-muted)'
                  }}>
                    {loan.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Principal</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>₹{Number(loan.principal_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>EMI Amount</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>₹{Number(loan.emi_amount).toLocaleString()}</div>
                  </div>
                </div>

                {loan.status === 'ACTIVE' && (
                  <>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Repayment Progress</span>
                      <span style={{ fontWeight: 600 }}>{paidCount} / {totalCount} EMIs</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-page)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Balance</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{balance.toLocaleString()}</div>
                      </div>
                      <button onClick={() => viewSchedule(loan.id)} className="btn" style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', padding: 0 }}>
                        Schedule <ChevronRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Loan Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Apply for New Loan</h2>
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label>Loan Type</label>
                <select value={formData.loanType} onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}>
                  <option value="PERSONAL">Personal Loan</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="EMERGENCY">General Emergency</option>
                  <option value="EDUCATION">Education Loan</option>
                  <option value="HOME">Home Improvement</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Amount (₹)</label>
                  <input type="number" value={formData.principalAmount} onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tenure (Months)</label>
                  <select value={formData.tenureMonths} onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Interest Rate (% p.a.)</label>
                <input type="number" value={formData.interestRate} disabled />
              </div>
              <div style={{ marginBottom: '24px', backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, marginBottom: '4px' }}>Estimated Monthly EMI</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>₹{calculateEMI()}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Schedule Modal */}
      {showScheduleModal && selectedLoan && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '700px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Repayment Schedule</h2>
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>EMI</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLoan.repayments.map((r: any, idx: number) => (
                    <tr key={r.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(r.emi_amount).toFixed(0)}</td>
                      <td>₹{Number(r.principal_component).toFixed(0)}</td>
                      <td>₹{Number(r.interest_component).toFixed(0)}</td>
                      <td>₹{Number(r.balance_remaining).toFixed(0)}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: r.status === 'DEDUCTED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: r.status === 'DEDUCTED' ? 'var(--success)' : 'var(--text-muted)' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;
