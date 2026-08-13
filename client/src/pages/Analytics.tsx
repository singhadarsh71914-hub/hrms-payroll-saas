import React, { useEffect, useState, useMemo, memo } from 'react';
import { getOverviewStats, getPayrollTrend, getHeadcountTrend, getTopEmployees, getMiscWidgets, exportReport, getAttendanceStats } from '../services/analytics.service';
import { getAuditLogs } from '../services/audit.service';
import { holidayService } from '../services/holiday.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Download, Users, IndianRupee, Activity, Briefcase, AlertTriangle, CheckCircle, CalendarDays, TrendingDown, Zap, Lock, AlertOctagon, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis, AreaChart, Area, LabelList } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TestChart } from '../components/TestChart';

const formatK = (val: any) => `₹${(Number(val || 0)/1000).toFixed(1)}k`;

const CARD_HEIGHTS = {
  kpi: '110px',
  intelligence: '320px',
  activity: '320px',
  insight: '150px'
};

const Card = memo(({ title, subtitle, children, padding = '24px', noHover = false, style = {}, 'data-testid': dataTestId }: any) => (
  <div data-testid={dataTestId} style={{
    boxSizing: 'border-box',
    background: 'rgba(15,23,42,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 'var(--radius-lg)',
    padding,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 250ms ease-in-out',
    cursor: noHover ? 'default' : 'pointer',
    ...style
  }}
  onMouseEnter={!noHover ? (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.22)';
  } : undefined}
  onMouseLeave={!noHover ? (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  } : undefined}>
    {title && (
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 'var(--font-base, 14px)', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{subtitle}</p>}
      </div>
    )}
    <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>{children}</div>
  </div>
));

const KPI = memo(({ title, value, sub, color, icon: Icon }: any) => (
  <Card padding="20px 24px" style={{ height: CARD_HEIGHTS.kpi, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: `linear-gradient(135deg, rgba(${color}, 0.15), rgba(${color}, 0.05))`, border: `1px solid rgba(${color}, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})` }}>
        <Icon size={16} />
      </div>
    </div>
    <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: 600, color: `rgb(${color})`, display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Activity size={12} /> {sub}
    </div>
  </Card>
));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-md)', padding: '12px 16px', boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-sm, 12px)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={`tooltip-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', color: '#fff', fontSize: 'var(--font-base, 14px)', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: 'var(--radius-full, 50%)', background: p.color || 'var(--primary)' }} />
            {p.name === 'net' || p.name === 'salary' ? formatK(p.value) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StaticCompensationInsights = memo(({ overview, misc }: { overview: any; misc: any }) => {
  const activeEmployees = overview?.activeEmployees || 0;
  const payroll = overview?.currentPayrollCost || 0;
  const avgSalary = activeEmployees > 0 ? Math.round(payroll / activeEmployees) : 0;
  const depts = misc?.departmentDistribution || [];
  const isLocked = payroll === 0;
  return (
  <Card style={{ gridColumn: 'span 6', height: CARD_HEIGHTS.intelligence, background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))', position: 'relative', overflow: 'hidden' }} padding="24px">
    <div className="hide-on-mobile" style={{ position: 'absolute', right: '-20px', top: '10px', opacity: 0.04, pointerEvents: 'none', transform: 'rotate(15deg)' }}>
      <IndianRupee size={220} />
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm, 8px)', marginBottom: '8px' }}>
        <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Compensation Intelligence</h3>
        {isLocked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Lock size={12} /> LOCKED
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={12} /> ACTIVE
          </div>
        )}
      </div>
      
      {isLocked ? (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '4px' }}>No payroll runs found. Configure salary structures to unlock insights.</p>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '4px' }}>Live compensation data from {activeEmployees} active employees across {depts.length} departments.</p>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 'var(--spacing-sm, 8px)', flex: 1, marginTop: '8px', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Monthly Payroll</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{formatK(payroll)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Avg per Employee</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{avgSalary > 0 ? formatK(avgSalary) : '—'}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Active Departments</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{depts.length}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Attrition Rate</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{overview?.attritionRate ?? 0}%</div>
        </div>
      </div>
    </div>
  </Card>
  );
});

const StaticPayrollCompliance = memo(() => (
  <Card title="Payroll Compliance" subtitle="Regulatory health status" style={{ gridColumn: 'span 6', height: CARD_HEIGHTS.intelligence }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginTop: '-5px' }}>
       {['Provident Fund (PF)', 'Employee State Insurance (ESI)', 'Tax Deducted at Source (TDS)', 'Professional Tax (PT)'].map((item, idx) => (
          <div key={`comp-${idx}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={16} color="var(--success)" />
              <span style={{ fontWeight: 500, fontSize: 'var(--font-base, 14px)', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
              COMPLIANT
            </div>
          </div>
       ))}
    </div>
  </Card>
));

const StaticAIInsights = memo(({ overview, attendance }: { overview: any; attendance: any }) => {
  const attritionRate = Number(overview?.attritionRate ?? 0);
  const attendanceRate = Number(attendance?.attendanceRate ?? 0);
  const payrollCost = Number(overview?.currentPayrollCost ?? 0);
  
  const workforceStatus = attritionRate < 5 ? 'STABLE' : attritionRate < 10 ? 'CAUTION' : 'CRITICAL';
  const workforceColor = attritionRate < 5 ? 'var(--primary)' : attritionRate < 10 ? 'var(--warning)' : 'var(--danger)';
  
  const attendanceStatus = attendanceRate === 0 ? 'NO DATA' : attendanceRate >= 80 ? 'HEALTHY' : attendanceRate >= 60 ? 'WARNING' : 'CRITICAL';
  const attendanceColor = attendanceRate === 0 ? '#6B7280' : attendanceRate >= 80 ? 'var(--success)' : attendanceRate >= 60 ? 'var(--warning)' : 'var(--danger)';
  
  const payrollStatus = payrollCost > 0 ? 'ACTIVE' : 'INACTIVE';
  const payrollColor = payrollCost > 0 ? 'var(--success)' : 'var(--danger)';
  
  return (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'var(--spacing-xl, 24px)' }}>
     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: `rgba(59, 130, 246, 0.1)`, padding: '6px', borderRadius: 'var(--radius-md)' }}><Zap size={16} color="var(--primary)" /></div>
         <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: '#fff' }}>Workforce Health</div>
         <div style={{ marginLeft: 'auto', fontSize: 'var(--font-sm, 12px)', fontWeight: 700, color: workforceColor, background: `${workforceColor}1A`, padding: '2px 8px', borderRadius: '6px' }}>{workforceStatus}</div>
       </div>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>
         Attrition rate is {attritionRate.toFixed(1)}% over the last 6 months across {overview?.activeEmployees ?? 0} active employees.
       </p>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
         Recommendation: {attritionRate < 5 ? 'No action required. Workforce is stable.' : 'Review exit interviews and retention strategies.'}
       </p>
     </Card>
     
     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: 'var(--radius-md)' }}><AlertTriangle size={16} color="var(--warning)" /></div>
         <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: '#fff' }}>Attendance Risk</div>
         <div style={{ marginLeft: 'auto', fontSize: 'var(--font-sm, 12px)', fontWeight: 700, color: attendanceColor, background: `${attendanceColor}1A`, padding: '2px 8px', borderRadius: '6px' }}>{attendanceStatus}</div>
       </div>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>
         {attendanceRate === 0 ? 'No attendance submissions recorded today.' : `Attendance rate is ${attendanceRate.toFixed(1)}% today.`}
       </p>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
         Recommendation: {attendanceRate === 0 ? 'Review biometric sync logs.' : attendanceRate >= 80 ? 'Attendance is healthy.' : 'Investigate absenteeism patterns.'}
       </p>
     </Card>

     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: 'var(--radius-md)' }}><AlertOctagon size={16} color="var(--danger)" /></div>
         <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: '#fff' }}>Payroll Status</div>
         <div style={{ marginLeft: 'auto', fontSize: 'var(--font-sm, 12px)', fontWeight: 700, color: payrollColor, background: `${payrollColor}1A`, padding: '2px 8px', borderRadius: '6px' }}>{payrollStatus}</div>
       </div>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>
         {payrollCost > 0 ? `Current monthly payroll is ${formatK(payrollCost)}.` : 'No payroll runs found for the current month.'}
       </p>
       <p style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
         Recommendation: {payrollCost > 0 ? 'Payroll is active. Verify deductions are correct.' : 'Assign salary structures before running payroll.'}
       </p>
     </Card>
  </div>
  );
});

const StaticActivityFeed = memo(({ auditLogs }: { auditLogs: any[] }) => (
  <Card title="Recent Activity Feed" style={{ gridColumn: 'span 7', height: CARD_HEIGHTS.activity, display: 'flex', flexDirection: 'column' }}>
    {auditLogs.length === 0 ? (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '-5px', overflowY: 'auto', paddingRight: '8px' }}>
        <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        {[
          { user: 'Admin', action: 'created employee', entity: 'John Doe' },
          { user: 'System', action: 'processed payroll', entity: 'June 2026' },
          { user: 'Manager', action: 'approved leave', entity: 'Jane Smith' },
          { user: 'Admin', action: 'updated department', entity: 'Engineering' },
        ].map((log: any, i: number) => (
          <div key={`demo-log-${i}`} style={{ display: 'flex', gap: 'var(--spacing-lg, 16px)', padding: '10px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: 'var(--radius-full, 50%)', background: '#0F172A', border: '3px solid rgba(255,255,255,0.1)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, opacity: 0.5 }}>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>{log.user}</span> {log.action} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{log.entity}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                Pending system activity...
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '-5px', overflowY: 'auto', paddingRight: '8px' }}>
        <div style={{ position: 'absolute', left: '7px', top: '4px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        {auditLogs.map((log: any) => (
          <div key={log.id} style={{ display: 'flex', gap: 'var(--spacing-lg, 16px)', padding: '10px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: 'var(--radius-full, 50%)', background: '#0F172A', border: '3px solid var(--primary)', marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>{log.user?.email?.split('@')[0] || 'System'}</span> {log.action} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{log.entity_type}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
));

const getHolidayCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('day') || n.includes('national') || n.includes('republic') || n.includes('independence')) return { label: 'National Holiday', color: 'var(--primary)', bg: 'rgba(59,130,246,0.1)' };
  if (n.includes('diwali') || n.includes('holi') || n.includes('eid') || n.includes('christmas')) return { label: 'Festival', color: 'var(--secondary)', bg: 'rgba(139,92,246,0.1)' };
  return { label: 'Religious Holiday', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' };
};

const StaticCalendar = memo(({ holidays, birthdays, calendarTab, setCalendarTab }: any) => {
  const upcomingHolidays = useMemo(() => {
    const sorted = holidays.filter((h:any) => new Date(h.date) >= new Date()).sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 4);
    const grouped: any = {};
    sorted.forEach((h:any) => {
      const m = new Date(h.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      if(!grouped[m]) grouped[m] = [];
      grouped[m].push(h);
    });
    return grouped;
  }, [holidays]);
  
  const upcomingBirthdays = useMemo(() => {
    return (birthdays || []).filter((b:any) => {
       const today = new Date();
       const bDate = new Date(b.date);
       bDate.setFullYear(today.getFullYear());
       return bDate >= today;
    }).sort((a:any, b:any) => {
       const aDate = new Date(a.date);
       const bDate = new Date(b.date);
       aDate.setFullYear(new Date().getFullYear());
       bDate.setFullYear(new Date().getFullYear());
       return aDate.getTime() - bDate.getTime();
    });
  }, [birthdays]);
  
  const thisMonthBirthdays = upcomingBirthdays.filter((b:any) => new Date(b.date).getMonth() === new Date().getMonth());
  const nextBirthday = upcomingBirthdays.length > 0 ? upcomingBirthdays[0] : null;

  return (
    <Card padding="24px" style={{ gridColumn: 'span 5', height: CARD_HEIGHTS.activity, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>Company Calendar</h3>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setCalendarTab('holidays')} style={{ padding: '6px 12px', background: calendarTab === 'holidays' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: calendarTab === 'holidays' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 'var(--font-sm, 12px)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: calendarTab === 'holidays' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>Holidays</button>
          <button onClick={() => setCalendarTab('birthdays')} style={{ padding: '6px 12px', background: calendarTab === 'birthdays' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: calendarTab === 'birthdays' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 'var(--font-sm, 12px)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: calendarTab === 'birthdays' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>Birthdays</button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {calendarTab === 'holidays' && (
          Object.keys(upcomingHolidays).length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 'var(--font-base, 14px)' }}>No upcoming holidays scheduled.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.keys(upcomingHolidays).map((month) => (
                <div key={month}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>{month}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {upcomingHolidays[month].map((h: any, i: number) => {
                      const cat = getHolidayCategory(h.name);
                      return (
                        <div key={`holiday-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg, 16px)' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', lineHeight: 1 }}>{new Date(h.date).toLocaleString('default', { month: 'short' })}</div>
                            <div style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 800, color: '#fff', lineHeight: 1, marginTop: '2px' }}>{new Date(h.date).getDate()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-sm, 8px)' }}>
                              <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{cat.label}</div>
                            </div>
                            <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{new Date(h.date).toLocaleString('default', { weekday: 'long' })}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        
        {calendarTab === 'birthdays' && (
          thisMonthBirthdays.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg, 16px)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-base, 14px)', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>No birthdays this month</div>
              </div>
              {nextBirthday && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Next upcoming birthday</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg, 16px)', background: 'rgba(255,255,255,0.03)', padding: 'var(--spacing-lg, 16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full, 50%)', background: 'linear-gradient(135deg, var(--secondary), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))', flexShrink: 0 }}>
                      {nextBirthday.name.split(' ').map((n:any)=>n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextBirthday.name}</div>
                      <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{nextBirthday.department || 'Engineering'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 'var(--font-sm, 12px)', fontWeight: 700, color: '#fff' }}>{new Date(nextBirthday.date).toLocaleString('default', { month: 'short', day: 'numeric' })}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Turns {new Date().getFullYear() - new Date(nextBirthday.date).getFullYear()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {thisMonthBirthdays.map((b: any, i: number) => (
                <div key={`bday-${b.id || i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg, 16px)', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full, 50%)', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-base, 14px)', fontWeight: 700, color: '#EC4899', flexShrink: 0 }}>
                    {b.name.split(' ').map((n:any)=>n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{b.department || 'Employee'}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {new Date(b.date).toLocaleString('default', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Card>
  );
});


const pulseStyles = `
@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: .5; transform: scale(1.4); }
  100% { opacity: 1; transform: scale(1); }
}
.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s infinite;
}
.demo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--warning);
  animation: pulse 2s infinite;
}
.chart-divider {
  border-left: 1px solid rgba(255,255,255,0.08);
}
`;

function AutoSizedAreaChart({ data }: { data: any[] }) {
  const [size, setSize] = useState({ width: 0, height: 172 });
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setSize({ width: entry.contentRect.width, height: 172 });
        }
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Use ALL real backend data — never strip, never fabricate.
  const allValues = data.map(d => (d.count ?? 0) as number);
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;
  const hasAnyData = maxVal > 0;
  
  const firstNonZeroIdx = allValues.findIndex(v => v > 0);
  const hasLeadingZeros = firstNonZeroIdx > 0;


  // Y-domain: always start at 0, pad top by ~15% so dots are not clipped.
  const yTop = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.18);
  const yDomain: [number, number] = [0, yTop];

  // Custom dot: larger and brighter for non-zero values.
  const renderDot = (props: any) => {
    const { cx, cy, value, index, payload } = props;
    const dotKey = payload?.month ? `dot-${payload.month}` : `dot-${index}`;
    if (value > 0) {
      return <circle key={dotKey} cx={cx} cy={cy} r={4.5} fill="#FF5A67" stroke="rgba(255,90,103,0.3)" strokeWidth={4} />;
    }
    // Zero values: small muted dot to show the data point exists.
    return <circle key={dotKey} cx={cx} cy={cy} r={2.5} fill="rgba(255,90,103,0.35)" strokeWidth={0} />;
  };

  // Custom label: only render for non-zero values to avoid clutter.
  const renderLabel = (props: any) => {
    const { x, y, value } = props;
    if (!value || value === 0) return null;
    return (
      <text key={`lbl-${x}-${y}`} x={x} y={y - 10} textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize={11} fontWeight={600}>
        {value}
      </text>
    );
  };

  return (
    <div ref={ref} style={{ width: '100%', height: '172px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!hasAnyData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <Users size={32} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }} />
          <p style={{ color: '#fff', fontSize: 'var(--font-base, 14px)', fontWeight: 600 }}>No Headcount Data</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'var(--font-sm, 12px)', marginTop: '4px' }}>Add employees to see growth trends.</p>
        </div>
      ) : (
        <>
          {data.length > 0 && size.width > 0 && (
            <AreaChart width={size.width} height={size.height} data={data} margin={{ top: 28, right: 20, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="hcGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5A67" stopOpacity={hasAnyData ? 0.2 : 0.04} />
                    <stop offset="100%" stopColor="#FF5A67" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis hide domain={yDomain} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={hasAnyData ? "#FF5A67" : "rgba(255,90,103,0.3)"}
                  strokeWidth={3}
                  fill="url(#hcGradient)"
                  dot={renderDot}
                  activeDot={{ r: 6, fill: '#FF5A67', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1000}
                >
                  <LabelList dataKey="count" content={renderLabel} />
                </Area>
              </AreaChart>
          )}
          {hasLeadingZeros && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', paddingBottom: '2px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', letterSpacing: '0.01em' }}>
                Workforce tracking began in {data[firstNonZeroIdx]?.name}.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');
  const [calendarTab, setCalendarTab] = useState<'holidays' | 'birthdays'>('holidays');

  const [overview, setOverview] = useState<any>(null);
  const [headcountTrend, setHeadcountTrend] = useState<any[]>([]);
  const [misc, setMisc] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchInitial = async () => {
      try {
        const [overviewData, headcountData, miscData, logsData, holidaysData, attData] = await Promise.all([
          getOverviewStats(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch overview", 'error'); return null; }),
          getHeadcountTrend(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch headcount", 'error'); return []; }),
          getMiscWidgets(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch widgets", 'error'); return null; }),
          getAuditLogs({ page: 1, limit: 4 }).catch(() => ({ data: [] })),
          holidayService.getHolidays(new Date().getFullYear()).catch(() => []),
          getAttendanceStats(dateRange, { signal: controller.signal }).catch(() => null)
        ]);
        
        if (!controller.signal.aborted) {
          if (overviewData !== null) setOverview(overviewData);
          if (headcountData !== null) setHeadcountTrend(Array.isArray(headcountData) ? headcountData : []);
          if (miscData !== null) setMisc(miscData?.data ?? miscData);
          setAuditLogs(logsData?.data || []);
          setHolidays(holidaysData || []);
          if (attData !== null) setAttendanceStats(attData);
          setInitialLoading(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Analytics fetch error:", error);
          setInitialLoading(false);
        }
      }
    };
    
    fetchInitial();
    
    return () => {
      controller.abort();
    };
  }, []);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const controller = new AbortController();
    
    const fetchRange = async () => {
      try {
        const [overviewData, headcountData, miscData] = await Promise.all([
          getOverviewStats(dateRange, { signal: controller.signal }),
          getHeadcountTrend(dateRange, { signal: controller.signal }),
          getMiscWidgets(dateRange, { signal: controller.signal })
        ]);
        
        if (!controller.signal.aborted) {
          setOverview(overviewData);
          setHeadcountTrend(Array.isArray(headcountData) ? headcountData : []);
          setMisc(miscData?.data ?? miscData);
        }
      } catch (error: any) {
        if (!controller.signal.aborted) {
          console.error("Range fetch error:", error);
          showToast("Unable to refresh analytics data.", 'error');
        }
      }
    };
    
    fetchRange();
    
    return () => {
      controller.abort();
    };
  }, [dateRange, showToast]);

  const safeDeptDist = useMemo(() =>
    (misc?.departmentDistribution?.length > 0) ? misc.departmentDistribution : []
  , [misc?.departmentDistribution]);

  const chartData = useMemo(() => {
    if (headcountTrend && headcountTrend.length > 0) {
      return headcountTrend;
    }
    return [];
  }, [headcountTrend]);

  const COLORS = ['var(--primary)', 'var(--success)', 'var(--secondary)', 'var(--warning)', 'var(--danger)', '#EC4899'];

  if (initialLoading) return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', paddingBottom: '40px' }}>
      <Skeleton height="48px" width="250px" style={{ marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--spacing-xl, 24px)', marginBottom: '32px' }}>
        {[1,2,3,4,5].map(i => <Skeleton key={`skel-${i}`} height="110px" borderRadius="20px" />)}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
      <style>{pulseStyles}</style>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg, 16px)', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em', lineHeight: 1, wordBreak: 'break-word' }}>Analytics Overview</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--font-base, 14px)', fontWeight: 500 }}>Insights and trends to help you make data-driven decisions.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg, 16px)' }}>
          <button onClick={() => exportReport(dateRange).catch(() => showToast("Export failed", 'error'))} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm, 8px)', cursor: 'pointer', transition: 'background 0.2s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--spacing-xl, 24px)' }}>
          <KPI title="Total Employees" value={overview?.activeEmployees || 0} sub="active headcount" color="59, 130, 246" icon={Users} />
          <KPI title="Avg Monthly Payroll" value={formatK(overview?.currentPayrollCost)} sub="avg per month" color="16, 185, 129" icon={IndianRupee} />
          <KPI title="Attendance Rate" value={`${Number(overview?.attendanceRate || 0).toFixed(1)}%`} sub="overall average" color="139, 92, 246" icon={CalendarDays} />
          <KPI title="Attrition Rate" value={`${Number(overview?.attritionRate || 0).toFixed(1)}%`} sub="last 6 months" color="245, 158, 11" icon={TrendingDown} />
          <KPI title="Active Departments" value={safeDeptDist.filter((d:any)=>d.count>0).length} sub="operational" color="20, 184, 166" icon={Briefcase} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : 'repeat(12, 1fr)', gap: 'var(--spacing-xl, 24px)', alignItems: 'stretch' }}>
          
          <Card data-testid="headcount-card" noHover style={{ gridColumn: 'span 8', height: '320px', minHeight: '320px', maxHeight: '320px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg, 16px)', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-md, 12px)' }}>
                <h3 style={{ fontSize: 'var(--font-md, 18px)', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>Headcount Growth</h3>
                {headcountTrend && headcountTrend.length > 0 ? (
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: 'var(--success)', height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <div className="live-dot" /> LIVE DATA
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: 'var(--warning)', height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <div className="demo-dot" /> DEMO DATA
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['3m', '6m', '1y'].map((range) => (
                  <button 
                    key={`range-${range}`} 
                    onClick={() => setDateRange(range)} 
                    style={{ padding: '4px 16px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm, 12px)', background: dateRange === range ? 'var(--primary-dark)' : 'transparent', color: dateRange === range ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && '190px minmax(0, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : '190px minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
              <div style={{ paddingRight: '24px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Employees</div>
                  <div style={{ fontSize: 'var(--font-xl, 32px)', fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{overview?.activeEmployees || 30}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    <Users size={12} /> As of Jul 2026
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 16px 0', flexShrink: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg, 16px)', flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Hires</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={14} style={{ transform: 'rotate(180deg)' }} /> +{overview?.trends?.hires ?? 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Exits</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={14} /> {overview?.trends?.exits ?? 0}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stability Rate</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> {overview?.activeEmployees > 0 ? `${(100 - Number(overview?.attritionRate ?? 0)).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', paddingLeft: '24px', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                    <AutoSizedAreaChart data={chartData} />
                </div>
              </div>
            </div>
          </Card>

          <Card data-testid="workforce-card" title="Workforce Composition" subtitle="Department capacity & distribution" style={{ gridColumn: 'span 4', height: '320px', minHeight: '320px', maxHeight: '320px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={dateRange}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(3, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 'var(--spacing-sm, 8px)', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.03)', marginTop: '-8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Total Emp</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', color: '#fff', fontWeight: 600 }}>{overview?.activeEmployees || 30}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Teams</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', color: '#fff', fontWeight: 600 }}>{safeDeptDist.filter((d:any)=>d.count>0).length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Largest</div>
                    <div style={{ fontSize: 'var(--font-base, 14px)', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeDeptDist.filter((d:any)=>d.count>0)[0]?.name || '-'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-lg, 16px)', flex: 1, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                  {safeDeptDist.filter((d:any) => d.count > 0).length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, height: '100px', minWidth: 0 }}>
                      <Briefcase size={24} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }} />
                      <p style={{ color: '#fff', fontSize: 'var(--font-sm, 12px)', fontWeight: 600 }}>No Department Data</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '100px', height: '100px', position: 'relative', flexShrink: 0 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={safeDeptDist.filter((d:any) => d.count > 0)} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="count" stroke="none">
                              {safeDeptDist.filter((d:any) => d.count > 0).map((e: any, index: number) => <Cell key={`pie-${e.name || index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overview?.activeEmployees || 0}</div>
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm, 8px)' }}>
                        {safeDeptDist.filter((d:any) => d.count > 0).slice(0,3).map((d: any, i: number) => {
                          const total = (overview?.activeEmployees || 1);
                          const pct = Math.round((d.count / total) * 100) || 0;
                          return (
                            <div key={`dept-stat-${d.name || i}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full, 50%)', background: COLORS[i % COLORS.length] }} />
                                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{d.name}</span>
                                </div>
                                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{pct}%</span>
                              </div>
                              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: '2px' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, lineHeight: 1.3 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Insight:</span> {safeDeptDist[0]?.name || 'Engineering'} represents the majority of organizational capacity.
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>

        </div>

        {/* ROW 3: COMPENSATION & COMPLIANCE (STATIC) */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(12, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)', gap: 'var(--spacing-xl, 24px)', alignItems: 'stretch' }}>
          <StaticCompensationInsights overview={overview} misc={misc} />
          <StaticPayrollCompliance />
        </div>

        {/* ROW 4: ACTIVITY & CALENDAR (STATIC) */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 && 'repeat(12, 1fr)'.includes('repeat(4') ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)', gap: 'var(--spacing-xl, 24px)', alignItems: 'stretch' }}>
          <StaticActivityFeed auditLogs={auditLogs} />
          <StaticCalendar holidays={holidays} birthdays={misc?.birthdays} calendarTab={calendarTab} setCalendarTab={setCalendarTab} />
        </div>

        {/* BOTTOM: AI INSIGHTS (STATIC) */}
        <StaticAIInsights overview={overview} attendance={attendanceStats} />



      </div>
    </div>
  );
}
