import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendance.service';
import { holidayService } from '../services/holiday.service';
import { Calendar, CheckCircle, XCircle, Clock, Save, Info, ChevronLeft, ChevronRight, Palmtree } from 'lucide-react';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [view, setView] = useState<'report' | 'mark'>('report');
  
  // Daily marking state
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isHR = user?.role === 'HR' || user?.role === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [report, summary, holidayData] = await Promise.all([
        attendanceService.getAttendanceReport(selectedMonth, selectedYear),
        attendanceService.getMonthlySummary(selectedMonth, selectedYear),
        holidayService.getHolidays(selectedYear)
      ]);
      setReportData(report);
      setSummaryData(summary);
      setHolidays(holidayData);
      
      // If we are in daily mark view, initialize dailyAttendance from report data
      const currentMarkDate = new Date(markDate);
      currentMarkDate.setHours(0,0,0,0);
      
      const daily: Record<string, string> = {};
      report.forEach((emp: any) => {
        const record = emp.attendance.find((a: any) => {
          const d = new Date(a.date);
          d.setHours(0,0,0,0);
          return d.getTime() === currentMarkDate.getTime();
        });

        // Auto-detect holiday/weekend for mark view
        let defaultStatus = 'PRESENT';
        const isHoliday = holidayData.some((h: any) => {
          const hd = new Date(h.date);
          hd.setHours(0,0,0,0);
          return hd.getTime() === currentMarkDate.getTime();
        });
        const isWeekend = currentMarkDate.getDay() === 0 || currentMarkDate.getDay() === 6;
        
        if (isHoliday) defaultStatus = 'ON_LEAVE';
        else if (isWeekend) defaultStatus = 'PRESENT'; // Usually weekends are not marked or marked as present/off

        daily[emp.id] = record?.status || defaultStatus;
      });
      setDailyAttendance(daily);

    } catch (err) {
      console.error('Failed to fetch attendance data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, markDate]);

  const handleMarkAttendance = async () => {
    setSubmitting(true);
    try {
      const promises = Object.entries(dailyAttendance).map(([employeeId, status]) => 
        attendanceService.markAttendance({
          employeeId,
          date: markDate,
          status
        })
      );
      await Promise.all(promises);
      alert('Attendance marked successfully!');
      setView('report');
      fetchData();
    } catch (err) {
      console.error('Failed to mark attendance', err);
      alert('Failed to mark attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return '#16a34a';
      case 'ABSENT': return '#ef4444';
      case 'HALF_DAY': return '#f59e0b';
      case 'ON_LEAVE': return '#3b82f6';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusInitial = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'P';
      case 'ABSENT': return 'A';
      case 'HALF_DAY': return 'HD';
      case 'ON_LEAVE': return 'L';
      default: return '-';
    }
  };

  if (loading && reportData.length === 0) return <div>Loading attendance data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1>Attendance Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isHR && (
            <button 
              className={`btn ${view === 'mark' ? 'btn-primary' : 'btn-outline'}`} 
              onClick={() => setView(view === 'mark' ? 'report' : 'mark')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {view === 'mark' ? <ChevronLeft size={18} /> : <Calendar size={18} />}
              {view === 'mark' ? 'Back to Report' : 'Mark Daily Attendance'}
            </button>
          )}
        </div>
      </div>

      {view === 'report' ? (
        <>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Month:</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Year:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOTAL PRESENT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summaryData.reduce((acc, curr) => acc + curr.PRESENT, 0)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOTAL ABSENT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summaryData.reduce((acc, curr) => acc + curr.ABSENT, 0)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOTAL HALF-DAY</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summaryData.reduce((acc, curr) => acc + curr.HALF_DAY, 0)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOTAL ON-LEAVE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summaryData.reduce((acc, curr) => acc + curr.ON_LEAVE, 0)}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Attendance Report</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', position: 'sticky', left: 0, background: 'white', zIndex: 1, minWidth: '150px' }}>Employee</th>
                    {days.map(d => (
                      <th key={d} style={{ padding: '0.5rem', textAlign: 'center', minWidth: '30px' }}>{d}</th>
                    ))}
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', fontWeight: 700 }}>P</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', fontWeight: 700 }}>A</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', fontWeight: 700 }}>HD</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', fontWeight: 700 }}>L</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map(emp => {
                    const summary = summaryData.find(s => s.employee_id === emp.id);
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{emp.employee_code}</div>
                        </td>
                        {days.map(d => {
                          const dateObj = new Date(selectedYear, selectedMonth - 1, d);
                          dateObj.setHours(0,0,0,0);
                          const record = emp.attendance.find((a: any) => {
                            const ad = new Date(a.date);
                            ad.setHours(0,0,0,0);
                            return ad.getTime() === dateObj.getTime();
                          });
                          
                          const holiday = holidays.find(h => {
                            const hd = new Date(h.date);
                            hd.setHours(0,0,0,0);
                            return hd.getTime() === dateObj.getTime();
                          });

                          return (
                            <td key={d} style={{ 
                              padding: '0.25rem', 
                              textAlign: 'center',
                              background: holiday ? '#fff7ed' : 'transparent',
                              border: holiday ? '1px solid #ffedd5' : 'none'
                            }}>
                              <div style={{ 
                                color: getStatusColor(record?.status), 
                                fontWeight: 700,
                                cursor: 'help'
                              }} title={holiday ? `Holiday: ${holiday.name}` : record?.status || 'No record'}>
                                {getStatusInitial(record?.status)}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', color: '#16a34a', fontWeight: 600 }}>{summary?.PRESENT || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', color: '#ef4444', fontWeight: 600 }}>{summary?.ABSENT || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', color: '#f59e0b', fontWeight: 600 }}>{summary?.HALF_DAY || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', color: '#3b82f6', fontWeight: 600 }}>{summary?.ON_LEAVE || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ color: '#16a34a', fontWeight: 700 }}>P:</span> Present</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ color: '#ef4444', fontWeight: 700 }}>A:</span> Absent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ color: '#f59e0b', fontWeight: 700 }}>HD:</span> Half Day</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ color: '#3b82f6', fontWeight: 700 }}>L:</span> Leave</div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Mark Attendance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Date:</label>
              <input 
                type="date" 
                value={markDate} 
                onChange={(e) => setMarkDate(e.target.value)}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Employee</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Status Preview</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.employee_code}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={dailyAttendance[emp.id] || 'PRESENT'}
                      onChange={(e) => setDailyAttendance({ ...dailyAttendance, [emp.id]: e.target.value })}
                      style={{ padding: '0.4rem', width: '150px', borderRadius: '4px', border: '1px solid var(--border)' }}
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="ON_LEAVE">Leave</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      color: getStatusColor(dailyAttendance[emp.id] || 'PRESENT'),
                      background: 'var(--bg-light)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px'
                    }}>
                      {dailyAttendance[emp.id] === 'PRESENT' && <CheckCircle size={14} />}
                      {dailyAttendance[emp.id] === 'ABSENT' && <XCircle size={14} />}
                      {dailyAttendance[emp.id] === 'HALF_DAY' && <Clock size={14} />}
                      {dailyAttendance[emp.id] === 'ON_LEAVE' && <Info size={14} />}
                      {dailyAttendance[emp.id] || 'PRESENT'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setView('report')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMarkAttendance} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={18} />
              {submitting ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
