import { useEffect, useState } from 'react';
import { getCompanyTaxSummary, downloadForm16, downloadBulkForm16 } from '../services/tax.service';
import { Download, FileText, PieChart, Users, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';

const TaxManagement = () => {
  const { showToast } = useToast();
  const [financialYear, setFinancialYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [financialYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCompanyTaxSummary(financialYear);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch tax summary', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSingle = async (employeeId: string, empName: string) => {
    try {
      const blob = await downloadForm16(employeeId, financialYear);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Form16_${financialYear}-${financialYear+1}_${empName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      showToast('Failed to download Form 16', 'error');
    }
  };

  const handleDownloadBulk = async () => {
    setDownloading(true);
    try {
      const blob = await downloadBulkForm16(financialYear);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Form16_Bulk_${financialYear}-${financialYear+1}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      showToast('Failed to download bulk Form 16', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const totalTaxLiability = summary.reduce((acc, curr) => acc + curr.taxLiability, 0);
  const totalTDS = summary.reduce((acc, curr) => acc + curr.totalTds, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Tax & Form 16 Management</h1>
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
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadBulk}
            disabled={downloading || summary.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} />
            {downloading ? 'Generating ZIP...' : 'Generate All (ZIP)'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card flex items-center gap-4">
          <div style={{ background: '#dbeafe', color: '#2563eb', padding: '1rem', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Employees Processed</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{summary.length}</h3>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div style={{ background: '#fef3c7', color: '#d97706', padding: '1rem', borderRadius: '12px' }}>
            <PieChart size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Tax Liability</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>₹ {totalTaxLiability.toLocaleString()}</h3>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '12px' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total TDS Deducted</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>₹ {totalTDS.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
             <Skeleton height="300px" borderRadius="12px" />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>PAN</th>
                <th>Gross Salary</th>
                <th>Tax Liability</th>
                <th>TDS Deducted</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((emp) => (
                <tr key={emp.employeeId}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.employeeCode}</div>
                  </td>
                  <td>{emp.pan}</td>
                  <td>₹{Number(emp.totalGross).toLocaleString()}</td>
                  <td>₹{Number(emp.taxLiability).toLocaleString()}</td>
                  <td>₹{Number(emp.totalTds).toLocaleString()}</td>
                  <td style={{ color: emp.balanceTax > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                    {emp.balanceTax > 0 ? 'Payable' : 'Refund'} ₹{Math.abs(Number(emp.balanceTax)).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a'
                    }}>
                      Generated
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDownloadSingle(emp.employeeId, emp.firstName)}
                      className="btn btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem' }}
                    >
                      <FileText size={16} />
                      Form 16
                    </button>
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                       <FileText size={48} className="empty-state-icon" />
                       <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No tax records</h3>
                       <p style={{ color: 'var(--text-secondary)' }}>No tax data available for selected financial year.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TaxManagement;
