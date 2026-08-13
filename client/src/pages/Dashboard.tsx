import React, { useEffect, useState } from 'react';
import { getOverviewStats, getAttendanceStats } from '../services/analytics.service';
import { getAuditLogs } from '../services/audit.service';
import { holidayService } from '../services/holiday.service';
import { useAuth } from '../context/AuthContext';
import { 
  Users, IndianRupee, Briefcase, CalendarDays,
  Clock, AlertTriangle, ShieldCheck, MapPin, Calendar, 
  Activity, UserPlus, Fingerprint, Plane, Settings, FileText,
  ChevronRight, Sparkles
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { Link, useNavigate } from 'react-router-dom';

const KPI = ({ title, value, sub, icon: Icon, color, isWarning, warningText }: any) => {
  return (
    <div style={{
      background: 'rgba(17,24,39,0.65)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-xl, 24px)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 8px 32px rgba(0,0,0,0.2), inset 0 0 80px rgba(${color}, 0.05)`,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 12px 40px rgba(${color}, 0.15), inset 0 0 80px rgba(${color}, 0.1)`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), inset 0 0 80px rgba(${color}, 0.05)`;
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: 'var(--radius-md)', 
            background: `linear-gradient(135deg, rgba(${color}, 0.2), rgba(${color}, 0.05))`,
            border: `1px solid rgba(${color}, 0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})`
          }}>
            <Icon size={20} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{title}</span>
        </div>
      </div>
      
      <div style={{ fontSize: '42px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '16px' }}>
        {value}
      </div>

      <div style={{ marginTop: 'auto' }}>
        {isWarning ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: '#FCD34D', fontSize: '13px', fontWeight: 600 }}>
            <AlertTriangle size={14} /> {warningText}
          </div>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `rgba(${color}, 0.15)`, border: `1px solid rgba(${color}, 0.3)`, padding: '6px 10px', borderRadius: 'var(--radius-sm)', color: `rgb(${color})`, fontSize: '13px', fontWeight: 600 }}>
            <Sparkles size={14} /> {sub}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [overview, setOverview] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [overviewData, logsData, holidaysData, attData] = await Promise.all([
        getOverviewStats('1m').catch(() => null),
        getAuditLogs({ page: 1, limit: 10 }).catch(() => ({ data: [] })),
        holidayService.getHolidays(new Date().getFullYear()).catch(() => []),
        getAttendanceStats().catch(() => null)
      ]);
      setOverview(overviewData);
      setAuditLogs(logsData?.data || []);
      setHolidays(holidaysData || []);
      setAttendance(attData);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Skeleton width="300px" height="40px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-xl, 24px)', marginBottom: '24px' }}>
        <Skeleton height="200px" borderRadius="20px" />
        <Skeleton height="200px" borderRadius="20px" />
        <Skeleton height="200px" borderRadius="20px" />
        <Skeleton height="200px" borderRadius="20px" />
      </div>
    </div>
  );

  // attendance-stats returns flat: { presentToday, absentToday, attendanceRate, pendingApprovals }
  const todayAtt = {
    present: attendance?.presentToday ?? 0,
    absent: attendance?.absentToday ?? 0,
    onLeave: 0,   // Not separately tracked in this endpoint
    halfDay: 0,   // Not separately tracked in this endpoint
  };
  const totalAtt = todayAtt.present + todayAtt.absent;
  
  const pendingActions = (overview?.pendingLeaves || 0) + (overview?.pendingLoans || 0);
  const formatK = (val: any) => `₹${(Number(val || 0)/1000).toFixed(1)}k`;
  const isPayrollZero = overview?.currentPayrollCost === 0;

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 3);
  
  // For donut chart
  const deptData = [
    { name: 'Engineering', count: 12, color: '#3B82F6' },
    { name: 'Sales', count: 8, color: '#10B981' },
    { name: 'HR', count: 4, color: '#8B5CF6' },
    { name: 'Others', count: 6, color: '#F59E0B' }
  ];

  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', padding: '0 16px', paddingBottom: '60px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em' }}>
            Operational Command Center
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — Hello, {user?.first_name || 'Admin'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-lg, 16px)', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/attendance/intelligence')} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 'var(--font-base, 14px)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'background 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <MapPin size={18} /> Live Map
          </button>
          <button onClick={() => navigate('/analytics')} style={{
            background: '#3B82F6', border: '1px solid #2563EB',
            padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 'var(--font-base, 14px)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <Activity size={18} /> View Analytics
          </button>
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-xl, 24px)', marginBottom: '24px' }}>
        <KPI 
          title="Total Employees" 
          value={overview?.activeEmployees || 0} 
          sub={`+${overview?.activeEmployees || 0} active workforce`}
          icon={Users} color="59, 130, 246" // Blue
          isWarning={false}
        />
        <KPI 
          title="Present Today" 
          value={todayAtt.present} 
          sub="checked in" 
          icon={Clock} color="16, 185, 129" // Green
          isWarning={todayAtt.present === 0} 
          warningText="No attendance submitted yet"
        />
        <KPI 
          title="Pending Approvals" 
          value={pendingActions} 
          sub={`${pendingActions} tasks require action`} 
          icon={Briefcase} color="139, 92, 246" // Purple
          isWarning={pendingActions === 0} 
          warningText="All clear"
        />
        <KPI 
          title="Monthly Payroll" 
          value={formatK(overview?.currentPayrollCost)} 
          sub="current cycle" 
          icon={IndianRupee} color="245, 158, 11" // Orange
          isWarning={isPayrollZero} 
          warningText="Missing salary structures"
        />
      </div>

      {/* ROW 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 'var(--spacing-xl, 24px)', marginBottom: '24px' }}>
        
        {/* Needs Attention */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#F59E0B" /> Needs Attention
          </h3>
          
          {pendingActions === 0 && !isPayrollZero ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <ShieldCheck size={40} color="#10B981" />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>All Caught Up!</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>There are no pending operational tasks requiring your approval.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg, 16px)' }}>
              {overview?.pendingLeaves > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}><CalendarDays size={20} color="#EF4444" /></div>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pending Leave Requests</span>
                  </div>
                  <button onClick={() => navigate('/leave')} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-base, 14px)', cursor: 'pointer' }}>Review {overview.pendingLeaves}</button>
                </div>
              )}
              {overview?.pendingLoans > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}><IndianRupee size={20} color="#EF4444" /></div>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pending Loan Requests</span>
                  </div>
                  <button onClick={() => navigate('/loans')} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-base, 14px)', cursor: 'pointer' }}>Review {overview.pendingLoans}</button>
                </div>
              )}
              {isPayrollZero && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '16px 20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}><AlertTriangle size={20} color="#F59E0B" /></div>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Missing Salary Structures</span>
                  </div>
                  <button onClick={() => navigate('/employees')} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-base, 14px)', cursor: 'pointer' }}>Configure</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="#8B5CF6" /> Upcoming Events
          </h3>
          {upcomingHolidays.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <CalendarDays size={28} color="#8B5CF6" opacity={0.8} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>No Upcoming Events</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-base, 14px)' }}>No holidays configured.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg, 16px)' }}>
              {upcomingHolidays.map((holiday: any, idx: number) => {
                const date = new Date(holiday.date);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg, 16px)', background: 'rgba(255,255,255,0.03)', padding: 'var(--spacing-lg, 16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                    <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', padding: '10px 16px', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: '60px', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                      <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>{date.toLocaleString('default', { month: 'short' })}</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1, marginTop: '2px' }}>{date.getDate()}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: '#fff', marginBottom: '4px' }}>{holiday.name}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Company Holiday</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ROW 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 'var(--spacing-xl, 24px)', marginBottom: '24px' }}>
        
        {/* Today's Attendance Overview */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#10B981" /> Today's Attendance Overview
          </h3>
          
          {totalAtt === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Clock size={40} color="rgba(255,255,255,0.3)" />
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No Attendance Submitted</h4>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '24px' }}>Employees have not yet marked attendance today.</p>
              <button onClick={() => navigate('/attendance')} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-base, 14px)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>View Attendance</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 'var(--spacing-lg, 16px)', height: '100%' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl, 24px)' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#34D399', lineHeight: 1, marginBottom: '8px' }}>{todayAtt.present}</div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Present</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl, 24px)' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#F87171', lineHeight: 1, marginBottom: '8px' }}>{todayAtt.absent}</div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Absent</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl, 24px)' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#FBBF24', lineHeight: 1, marginBottom: '8px' }}>{todayAtt.halfDay}</div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Half Day</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl, 24px)' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#60A5FA', lineHeight: 1, marginBottom: '8px' }}>{todayAtt.onLeave}</div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>On Leave</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#3B82F6" /> Recent Activity Feed
          </h3>
          
          {auditLogs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>No recent activity to display.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
              
              {auditLogs.slice(0, 5).map((log: any) => {
                const isSuccess = log.action.includes('SUCCESS') || log.action.includes('CREATE') || log.action.includes('APPROVE');
                const isWarning = log.action.includes('UPDATE') || log.action.includes('MODIFY');
                const isDanger = log.action.includes('DELETE') || log.action.includes('FAIL');
                
                let dotColor = '#3B82F6';
                if (isSuccess) dotColor = '#10B981';
                if (isWarning) dotColor = '#F59E0B';
                if (isDanger) dotColor = '#EF4444';

                return (
                  <div key={log.id} style={{ display: 'flex', gap: '20px', padding: '16px 0', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: '#111827', 
                      border: `2px solid ${dotColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 10px rgba(${dotColor === '#10B981' ? '16,185,129' : dotColor === '#F59E0B' ? '245,158,11' : dotColor === '#EF4444' ? '239,68,68' : '59,130,246'}, 0.3)`
                    }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: 'var(--spacing-lg, 16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: '15px', color: '#fff', fontWeight: 500, marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700 }}>{log.user?.email || 'System'}</span> performed <span style={{ color: dotColor, fontWeight: 700 }}>{log.action}</span> on {log.entity_type}
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ROW 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 'var(--spacing-xl, 24px)' }}>
        
        {/* Department Distribution Donut Chart Replacement */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '32px', alignSelf: 'flex-start' }}>
            Department Distribution
          </h3>
          <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Fake SVG Donut Chart for aesthetics */}
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="100 150" strokeDashoffset="0" style={{ transition: 'all 1s' }} />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="60 190" strokeDashoffset="-100" style={{ transition: 'all 1s' }} />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="40 210" strokeDashoffset="-160" style={{ transition: 'all 1s' }} />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="50 200" strokeDashoffset="-200" style={{ transition: 'all 1s' }} />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overview?.activeEmployees || 30}</span>
              <span style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Employees</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-lg, 16px)', flexWrap: 'wrap', justifyContent: 'center', marginTop: '32px' }}>
            {deptData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: d.color }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-base, 14px)', fontWeight: 500 }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'rgba(17,24,39,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl, 24px)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 'var(--spacing-lg, 16px)' }}>
            
            <button onClick={() => navigate('/employees/add')} style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'var(--spacing-xl, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ background: 'rgba(59,130,246,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#60A5FA' }}><UserPlus size={24} /></div>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Add Employee</span>
            </button>
            
            <button onClick={() => navigate('/attendance')} style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'var(--spacing-xl, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ background: 'rgba(16,185,129,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#34D399' }}><Fingerprint size={24} /></div>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Mark Attendance</span>
            </button>
            
            <button onClick={() => navigate('/leave')} style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'var(--spacing-xl, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ background: 'rgba(245,158,11,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#FBBF24' }}><Plane size={24} /></div>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Request Leave</span>
            </button>
            
            <button onClick={() => navigate('/payroll')} style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'var(--spacing-xl, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ background: 'rgba(139,92,246,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#A78BFA' }}><IndianRupee size={24} /></div>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Run Payroll</span>
            </button>

            <button onClick={() => navigate('/analytics')} style={{
              gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'var(--spacing-lg, 16px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff' }}><FileText size={20} /></div>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>View All Reports</span>
              </div>
              <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}

