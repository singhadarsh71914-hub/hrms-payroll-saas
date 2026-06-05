import { useEffect, useState } from 'react';
import { getMyPayslips, downloadPayslip } from '../services/selfService.service';
import { Download, FileText } from 'lucide-react';

const EmployeePayslips = () => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const data = await getMyPayslips();
      setPayslips(data);
    } catch (error) {
      console.error('Failed to fetch payslips', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payslipId: string, month: number, year: number) => {
    try {
      const blob = await downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Failed to download payslip', error);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Payslips</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Month/Year</th>
              <th>Gross Salary</th>
              <th>Deductions</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="#64748b" />
                    {getMonthName(p.month)} {p.year}
                  </div>
                </td>
                <td>₹{Number(p.gross_salary).toLocaleString()}</td>
                <td>₹{Number(p.total_deductions).toLocaleString()}</td>
                <td style={{ fontWeight: 'bold', color: '#4f46e5' }}>₹{Number(p.net_salary).toLocaleString()}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    backgroundColor: '#dcfce7',
                    color: '#16a34a'
                  }}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleDownload(p.id, p.month, p.year)}
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', padding: '0.25rem 0.5rem' }}
                  >
                    <Download size={16} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
            {payslips.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No payslips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePayslips;
