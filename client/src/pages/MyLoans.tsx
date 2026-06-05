import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getMyLoans, applyLoan, getLoanDetails } from '../services/loan.service';
import { Plus, ChevronRight } from 'lucide-react';

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

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>My Loans & Advances</h1>
        <button onClick={() => setShowApplyModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Apply for Loan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {loans.map((loan) => {
          const paidCount = loan.repayments?.filter((r: any) => r.status === 'DEDUCTED').length || 0;
          const totalCount = loan.tenure_months;
          const progress = (paidCount / totalCount) * 100;
          const lastRepayment = loan.repayments?.filter((r: any) => r.status === 'DEDUCTED').sort((a: any, b: any) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
          const balance = lastRepayment ? Number(lastRepayment.balance_remaining) : Number(loan.principal_amount);

          return (
            <div key={loan.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{loan.loan_type} LOAN</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Applied on {new Date(loan.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  backgroundColor: loan.status === 'ACTIVE' ? '#dcfce7' : loan.status === 'PENDING' ? '#fff7ed' : '#f1f5f9',
                  color: loan.status === 'ACTIVE' ? '#16a34a' : loan.status === 'PENDING' ? '#ea580c' : '#64748b'
                }}>
                  {loan.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Principal</div>
                  <div style={{ fontWeight: 'bold' }}>₹{Number(loan.principal_amount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>EMI Amount</div>
                  <div style={{ fontWeight: 'bold', color: '#4f46e5' }}>₹{Number(loan.emi_amount).toLocaleString()}</div>
                </div>
              </div>

              {loan.status === 'ACTIVE' && (
                <>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span>Repayment Progress</span>
                    <span>{paidCount} / {totalCount} EMIs</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#4f46e5' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Balance</div>
                      <div style={{ fontWeight: 'bold' }}>₹{balance.toLocaleString()}</div>
                    </div>
                    <button onClick={() => viewSchedule(loan.id)} className="btn" style={{ fontSize: '0.875rem', color: '#4f46e5', background: 'none', display: 'flex', alignItems: 'center' }}>
                      Schedule <ChevronRight size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Loan Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Apply for New Loan</h2>
            <form onSubmit={handleApply}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Loan Type</label>
                <select className="form-input" value={formData.loanType} onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}>
                  <option value="PERSONAL">Personal Loan</option>
                  <option value="MEDICAL">Medical Emergency</option>
                  <option value="EMERGENCY">General Emergency</option>
                  <option value="EDUCATION">Education Loan</option>
                  <option value="HOME">Home Improvement</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" className="form-input" value={formData.principalAmount} onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Tenure (Months)</label>
                  <select className="form-input" value={formData.tenureMonths} onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Interest Rate (% p.a.)</label>
                <input type="number" className="form-input" value={formData.interestRate} disabled />
              </div>
              <div style={{ marginBottom: '1.5rem', backgroundColor: '#eef2ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#4f46e5' }}>Estimated Monthly EMI</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>₹{calculateEMI()}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setShowApplyModal(false)} className="btn">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Schedule Modal */}
      {showScheduleModal && selectedLoan && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Repayment Schedule</h2>
            <table className="table">
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
                    <td>₹{Number(r.emi_amount).toFixed(0)}</td>
                    <td>₹{Number(r.principal_component).toFixed(0)}</td>
                    <td>₹{Number(r.interest_component).toFixed(0)}</td>
                    <td>₹{Number(r.balance_remaining).toFixed(0)}</td>
                    <td>
                      <span style={{ color: r.status === 'DEDUCTED' ? '#16a34a' : '#64748b' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setShowScheduleModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;
