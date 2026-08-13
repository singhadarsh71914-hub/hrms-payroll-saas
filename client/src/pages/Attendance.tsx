import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendance.service';
import { holidayService } from '../services/holiday.service';
import { Calendar, Clock, Save, ChevronLeft, UserCheck, UserX, CalendarDays } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();
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
  const [dailySource, setDailySource] = useState<Record<string, string>>({});
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
      
      const currentMarkDate = new Date(markDate);
      currentMarkDate.setHours(0,0,0,0);
      
      const daily: Record<string, string> = {};
      const sourceMap: Record<string, string> = {};
      report.forEach((emp: any) => {
        const record = emp.attendance.find((a: any) => {
          const d = new Date(a.date);
          d.setHours(0,0,0,0);
          return d.valueOf() === currentMarkDate.valueOf();
        });

        let defaultStatus = 'PRESENT';
        const isHoliday = holidayData.some((h: any) => {
          const hd = new Date(h.date);
          hd.setHours(0,0,0,0);
          return hd.valueOf() === currentMarkDate.valueOf();
        });
        const isWeekend = currentMarkDate.getDay() === 0 || currentMarkDate.getDay() === 6;
        
        if (isHoliday) defaultStatus = 'ON_LEAVE';
        else if (isWeekend) defaultStatus = 'PRESENT'; 

        daily[emp.id] = record?.status || defaultStatus;
        if (record?.source) {
          sourceMap[emp.id] = record.source;
        }
      });
      setDailyAttendance(daily);
      setDailySource(sourceMap);

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
      const promises = Object.entries(dailyAttendance)
        .filter(([employeeId, _]) => dailySource[employeeId] !== 'EMPLOYEE_SELF')
        .map(([employeeId, status]) => 
          attendanceService.markAttendance({
            employeeId,
            date: markDate,
            status
          })
        );
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      showToast('Attendance marked successfully!', 'success');
      setView('report');
      fetchData();
    } catch (err: any) {
      console.error('Failed to mark attendance', err);
      showToast(err.message || 'Failed to mark attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => { setCurrentPage(1); }, [selectedMonth, selectedYear, view]);

  const { totalPages, paginatedReportData } = useMemo(() => {
    const total = Math.ceil(reportData.length / itemsPerPage);
    const paginated = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    return { totalPages: total, paginatedReportData: paginated };
  }, [reportData, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'var(--success)';
      case 'ABSENT': return 'var(--danger)';
      case 'HALF_DAY': return 'var(--warning)';
      case 'ON_LEAVE': return 'var(--primary)';
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

  if (loading && reportData.length === 0) return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Skeleton width="300px" height="32px" />
          <div style={{ marginTop: '0.5rem' }}><Skeleton width="min(400px, 100%)" height="20px" /></div>
        </div>
      </div>
      <Skeleton height="80px" borderRadius="12px" />
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(4, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem', marginTop: '2rem' }}>
        <Skeleton height="100px" borderRadius="12px" />
        <Skeleton height="100px" borderRadius="12px" />
        <Skeleton height="100px" borderRadius="12px" />
        <Skeleton height="100px" borderRadius="12px" />
      </div>
      <Skeleton height="400px" borderRadius="12px" />
    </div>
  );

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Oversight</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track workforce presence and compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isHR && (
            <button 
              className={`btn ${view === 'mark' ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => setView(view === 'mark' ? 'report' : 'mark')}
            >
              {view === 'mark' ? <ChevronLeft size={20} /> : <CalendarDays size={20} />}
              {view === 'mark' ? 'Back to Analytics' : 'Mark Daily Attendance'}
            </button>
          )}
        </div>
      </div>

      {view === 'report' ? (
        <>
          <div className="premium-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calendar size={20} color="var(--primary)" />
              <label style={{ fontWeight: '700', fontSize: 'var(--font-base, 14px)' }}>View Period</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', outline: 'none', fontWeight: '600' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', outline: 'none', fontWeight: '600' }}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(4, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div className="premium-card" style={{ textAlign: 'center', borderLeft: '6px solid var(--success)' }}>
              <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Present</div>
              <div style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: '900', color: 'var(--success)' }}>{summaryData.reduce((acc, curr) => acc + curr.PRESENT, 0)}</div>
            </div>
            <div className="premium-card" style={{ textAlign: 'center', borderLeft: '6px solid var(--danger)' }}>
              <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Absent</div>
              <div style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: '900', color: 'var(--danger)' }}>{summaryData.reduce((acc, curr) => acc + curr.ABSENT, 0)}</div>
            </div>
            <div className="premium-card" style={{ textAlign: 'center', borderLeft: '6px solid var(--warning)' }}>
              <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Half Day</div>
              <div style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: '900', color: 'var(--warning)' }}>{summaryData.reduce((acc, curr) => acc + curr.HALF_DAY, 0)}</div>
            </div>
            <div className="premium-card" style={{ textAlign: 'center', borderLeft: '6px solid var(--primary)' }}>
              <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>On Leave</div>
              <div style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: '900', color: 'var(--primary)' }}>{summaryData.reduce((acc, curr) => acc + curr.ON_LEAVE, 0)}</div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
               <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: '800' }}>Attendance Matrix</h3>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: '0', boxShadow: 'none' }}>
              <table className="premium-table" style={{ fontSize: 'var(--font-sm, 12px)' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', position: 'sticky', left: 0, background: 'var(--bg)', zIndex: 10, minWidth: '180px', borderRight: '1px solid var(--border)' }}>Employee Name</th>
                    {days.map(d => (
                      <th key={d} style={{ padding: '0.5rem', textAlign: 'center', minWidth: '35px', background: 'var(--bg)' }}>{d}</th>
                    ))}
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--primary)', color: 'white', fontWeight: '800' }}>P</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--danger)', color: 'white', fontWeight: '800' }}>A</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--warning)', color: 'white', fontWeight: '800' }}>HD</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--primary)', color: 'white', fontWeight: '800' }}>L</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReportData.map(emp => {
                    const summary = summaryData.find(s => s.employee_id === emp.id);
                    return (
                      <tr key={emp.id}>
                        <td style={{ padding: '1rem', position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 5, borderRight: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{emp.first_name} {emp.last_name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>{emp.employee_code}</div>
                        </td>
                        {days.map(d => {
                          const dateObj = new Date(selectedYear, selectedMonth - 1, d);
                          dateObj.setHours(0,0,0,0);
                          const record = emp.attendance.find((a: any) => {
                            const ad = new Date(a.date);
                            ad.setHours(0,0,0,0);
                            return ad.valueOf() === dateObj.valueOf();
                          });
                          
                          const holiday = holidays.find(h => {
                            const hd = new Date(h.date);
                            hd.setHours(0,0,0,0);
                            return hd.valueOf() === dateObj.valueOf();
                          });

                          return (
                            <td key={d} style={{ 
                              padding: '0.25rem', 
                              textAlign: 'center',
                              background: holiday ? (isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb') : 'transparent',
                            }}>
                              <div style={{ 
                                color: getStatusColor(record?.status), 
                                fontWeight: '800',
                                fontSize: '0.85rem'
                              }} title={holiday ? `Holiday: ${holiday.name}` : record?.status || 'Not Marked'}>
                                {getStatusInitial(record?.status)}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: '800' }}>{summary?.PRESENT || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: '800' }}>{summary?.ABSENT || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontWeight: '800' }}>{summary?.HALF_DAY || 0}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: '800' }}>{summary?.ON_LEAVE || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                  <span style={{ fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', fontWeight: '700' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '3px' }} /> Present</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '3px' }} /> Absent</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: 'var(--warning)', borderRadius: '3px' }} /> Half Day</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }} /> On Leave</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '12px', height: '12px', background: '#fde68a', borderRadius: '3px', border: '1px solid var(--warning)' }} /> Company Holiday</div>
            </div>
          </div>
        </>
      ) : (
        <div className="premium-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: '800' }}>Batch Attendance Input</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)' }}>
              <Calendar size={18} color="var(--primary)" />
              <label style={{ fontSize: 'var(--font-base, 14px)', fontWeight: '700' }}>Selected Date:</label>
              <input 
                type="date" 
                value={markDate} 
                onChange={(e) => setMarkDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '700', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Attendance Status</th>
                  <th style={{ textAlign: 'center' }}>Visual Indicator</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReportData.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>{emp.first_name} {emp.last_name}</div>
                      <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', fontWeight: '600' }}>{emp.employee_code}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {dailySource[emp.id] === 'EMPLOYEE_SELF' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '700', fontSize: 'var(--font-base, 14px)' }}>
                          ✓ Submitted by Employee
                        </div>
                      ) : (
                        <select 
                          value={dailyAttendance[emp.id] || 'PRESENT'}
                          onChange={(e) => setDailyAttendance({ ...dailyAttendance, [emp.id]: e.target.value })}
                          style={{ padding: '0.6rem 1rem', width: '180px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg)', fontWeight: '600' }}
                        >
                          <option value="PRESENT">Present (Full Day)</option>
                          <option value="ABSENT">Absent (Unpaid)</option>
                          <option value="HALF_DAY">Half Day</option>
                          <option value="ON_LEAVE">Approved Leave</option>
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        fontSize: 'var(--font-sm, 12px)', 
                        fontWeight: '800', 
                        color: 'white',
                        background: getStatusColor(dailyAttendance[emp.id] || 'PRESENT'),
                        padding: '0.4rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        textTransform: 'uppercase'
                      }}>
                        {dailyAttendance[emp.id] === 'PRESENT' && <UserCheck size={14} />}
                        {dailyAttendance[emp.id] === 'ABSENT' && <UserX size={14} />}
                        {dailyAttendance[emp.id] === 'HALF_DAY' && <Clock size={14} />}
                        {dailyAttendance[emp.id] === 'ON_LEAVE' && <Calendar size={14} />}
                        {dailyAttendance[emp.id] || 'PRESENT'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                <span style={{ fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setView('report')}>Discard Changes</button>
            <button className="btn btn-primary" onClick={handleMarkAttendance} disabled={submitting} style={{ padding: '1rem 2rem' }}>
              {submitting ? 'Committing records...' : 'Commit Attendance'}
              {!submitting && <Save size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
