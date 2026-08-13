import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getMyTaxSummary, downloadMyForm16 } from '../services/tax.service';
import { Download, AlertCircle, Receipt } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 700, color: 'var(--text-primary)' }}>My Tax Documents</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View your TDS details and download Form 16.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
            value={financialYear}
            onChange={(e) => setFinancialYear(parseInt(e.target.value))}
            style={{ width: 'auto', fontWeight: 600, padding: '8px 16px' }}
          >
            <option value={2024}>FY 2024-25</option>
            <option value={2025}>FY 2025-26</option>
            <option value={2026}>FY 2026-27</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-xl, 24px)' }}>
            <Skeleton height="120px" borderRadius="12px" />
            <Skeleton height="120px" borderRadius="12px" />
            <Skeleton height="120px" borderRadius="12px" />
            <Skeleton height="120px" borderRadius="12px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 300px', gap: '32px' }}>
            <Skeleton height="350px" borderRadius="12px" />
            <Skeleton height="250px" borderRadius="12px" />
          </div>
        </div>
      ) : summary ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-xl, 24px)', marginBottom: '32px' }}>
            <div className="premium-card">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earnings</div>
              <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Number(summary.totalGross).toLocaleString()}</div>
            </div>
            <div className="premium-card">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxable Income</div>
              <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Number(summary.taxableIncome).toLocaleString()}</div>
              <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-secondary)', marginTop: '4px' }}>Standard Deduction: ₹{summary.standardDeduction.toLocaleString()}</div>
            </div>
            <div className="premium-card">
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TDS Deducted</div>
              <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--success)' }}>₹{Number(summary.totalTdsDeducted).toLocaleString()}</div>
            </div>
            <div className="premium-card" style={{ border: summary.balanceTax > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: summary.balanceTax > 0 ? 'rgba(239, 68, 68, 0.02)' : 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Tax Liability</div>
              <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Number(summary.totalTaxLiability).toLocaleString()}</div>
              <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 700, marginTop: '4px', color: summary.balanceTax > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {summary.balanceTax > 0 ? `Payable: ₹${Number(summary.balanceTax).toLocaleString()}` : `Refundable: ₹${Math.abs(Number(summary.balanceTax)).toLocaleString()}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 300px', gap: '32px' }}>
            <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Quarterly TDS Summary</h3>
              </div>
              <table className="premium-table">
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
                  <tr style={{ background: 'var(--bg-page)' }}>
                    <td colSpan={2} style={{ fontWeight: 700 }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{Number(summary.totalTdsDeducted).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Form 16 (Part A & B)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Your complete Form 16 containing the TDS certificate and detailed salary breakdown as per the New Tax Regime is available for download.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={handleDownload}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', marginBottom: 'auto' }}
              >
                <Download size={18} />
                Download Form 16 PDF
              </button>

              <div style={{ marginTop: '32px', padding: 'var(--spacing-lg, 16px)', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>
                  <AlertCircle size={16} />
                  Note
                </div>
                <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  This computation is based on the New Tax Regime. Standard Deduction of ₹75,000 has been considered. Chapter VI-A deductions are not applicable.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Receipt size={48} className="empty-state-icon" />
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Data Available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Tax details for the selected financial year are not available yet.</p>
        </div>
      )}
    </div>
  );
};

export default MyTax;
