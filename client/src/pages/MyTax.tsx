import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getMyTaxSummary, downloadMyForm16 } from '../services/tax.service';
import { Download, PieChart, AlertCircle } from 'lucide-react';

const MyTax = () => {
  const { showToast } = useToast();
  const [financialYear, setFinancialYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [financialYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getMyTaxSummary(financialYear);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch my tax summary', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadMyForm16(financialYear);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Form16_${financialYear}-${financialYear+1}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      showToast('Failed to download Form 16', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>My Tax Documents</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select 
            className="form-input" 
            value={financialYear}
            onChange={(e) => setFinancialYear(parseInt(e.target.value))}
            style={{ width: 'auto' }}
          >
            <option value={2024}>FY 2024-25</option>
            <option value={2025}>FY 2025-26</option>
            <option value={2026}>FY 2026-27</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading tax summary...</div>
      ) : summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Total Earnings</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{Number(summary.totalGross).toLocaleString()}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Taxable Income</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{Number(summary.taxableIncome).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Standard Deduction Applied: ₹{summary.standardDeduction.toLocaleString()}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Total TDS Deducted</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>₹{Number(summary.totalTdsDeducted).toLocaleString()}</div>
            </div>
            <div className="card" style={{ border: summary.balanceTax > 0 ? '1px solid #ef4444' : '1px solid #16a34a' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Estimated Tax Liability</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{Number(summary.totalTaxLiability).toLocaleString()}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginTop: '0.25rem', color: summary.balanceTax > 0 ? '#dc2626' : '#16a34a' }}>
                {summary.balanceTax > 0 ? `Payable: ₹${Number(summary.balanceTax).toLocaleString()}` : `Refundable: ₹${Math.abs(Number(summary.balanceTax)).toLocaleString()}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Quarterly TDS Summary</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Quarter</th>
                    <th>Period</th>
                    <th style={{ textAlign: 'right' }}>TDS Deducted (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Q1</strong></td>
                    <td>Apr - Jun</td>
                    <td style={{ textAlign: 'right' }}>{Number(summary.quarters[0]).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Q2</strong></td>
                    <td>Jul - Sep</td>
                    <td style={{ textAlign: 'right' }}>{Number(summary.quarters[1]).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Q3</strong></td>
                    <td>Oct - Dec</td>
                    <td style={{ textAlign: 'right' }}>{Number(summary.quarters[2]).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Q4</strong></td>
                    <td>Jan - Mar</td>
                    <td style={{ textAlign: 'right' }}>{Number(summary.quarters[3]).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan={2}>Total</td>
                    <td style={{ textAlign: 'right' }}>{Number(summary.totalTdsDeducted).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Form 16 (Part A & B)</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Your complete Form 16 containing the TDS certificate and detailed salary breakdown as per the New Tax Regime is available for download.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={handleDownload}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={18} />
                Download Form 16 PDF
              </button>

              <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <AlertCircle size={18} />
                  Note
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  This computation is based on the New Tax Regime. Standard Deduction of ₹75,000 has been considered. Chapter VI-A deductions are not applicable.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <PieChart size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Data Available</h3>
          <p style={{ color: '#64748b' }}>Tax details for the selected financial year are not available yet.</p>
        </div>
      )}
    </div>
  );
};

export default MyTax;
