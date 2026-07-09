import React, { useEffect, useState, useMemo, memo } from 'react';
import { getOverviewStats, getPayrollTrend, getHeadcountTrend, getTopEmployees, getMiscWidgets, exportReport } from '../services/analytics.service';
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
    borderRadius: '20px',
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
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{subtitle}</p>}
      </div>
    )}
    <div style={{ flex: 1, position: 'relative' }}>{children}</div>
  </div>
));

const KPI = memo(({ title, value, sub, color, icon: Icon }: any) => (
  <Card padding="20px 24px" style={{ height: CARD_HEIGHTS.kpi, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `linear-gradient(135deg, rgba(${color}, 0.15), rgba(${color}, 0.05))`, border: `1px solid rgba(${color}, 0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})` }}>
        <Icon size={16} />
      </div>
    </div>
    <div style={{ fontSize: '12px', fontWeight: 600, color: `rgb(${color})`, display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Activity size={12} /> {sub}
    </div>
  </Card>
));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={`tooltip-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color || '#3B82F6' }} />
            {p.name === 'net' || p.name === 'salary' ? formatK(p.value) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StaticCompensationInsights = memo(() => (
  <Card style={{ gridColumn: 'span 6', height: CARD_HEIGHTS.intelligence, background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(15,23,42,0.6))', position: 'relative', overflow: 'hidden' }} padding="24px">
    <div style={{ position: 'absolute', right: '-20px', top: '10px', opacity: 0.04, pointerEvents: 'none', transform: 'rotate(15deg)' }}>
      <IndianRupee size={220} />
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Compensation Intelligence</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <Lock size={12} /> LOCKED
        </div>
      </div>
      
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '4px' }}>Salary analytics require active salary structures.</p>
      <p style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>28 employees missing compensation profiles.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="rgba(245, 158, 11, 0.7)" /> Top earners leaderboard</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="rgba(245, 158, 11, 0.7)" /> Compensation benchmarking</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="rgba(245, 158, 11, 0.7)" /> Payroll forecasting</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="rgba(245, 158, 11, 0.7)" /> Department cost allocation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="rgba(245, 158, 11, 0.7)" /> Attrition cost modeling</div>
      </div>
      
      <button style={{ width: 'fit-content', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#FCD34D', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '12px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}>
        Configure Salary Structures
      </button>
    </div>
  </Card>
));

const StaticPayrollCompliance = memo(() => (
  <Card title="Payroll Compliance" subtitle="Regulatory health status" style={{ gridColumn: 'span 6', height: CARD_HEIGHTS.intelligence }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginTop: '-5px' }}>
       {['Provident Fund (PF)', 'Employee State Insurance (ESI)', 'Tax Deducted at Source (TDS)', 'Professional Tax (PT)'].map((item, idx) => (
          <div key={`comp-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={16} color="#10B981" />
              <span style={{ fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{item}</span>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34D399', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' }}>
              COMPLIANT
            </div>
          </div>
       ))}
    </div>
  </Card>
));

const StaticAIInsights = memo(() => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '6px', borderRadius: '8px' }}><Zap size={16} color="#3B82F6" /></div>
         <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Workforce Health</div>
         <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px' }}>STABLE</div>
       </div>
       <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>Headcount remains balanced across all key departments.</p>
       <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Recommendation: No action required.</p>
     </Card>
     
     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '6px', borderRadius: '8px' }}><AlertTriangle size={16} color="#F59E0B" /></div>
         <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Attendance Risk</div>
         <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '6px' }}>WARNING</div>
       </div>
       <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>Zero checks-ins detected across the workforce today.</p>
       <p style={{ fontSize: '12px', color: '#FCD34D', fontWeight: 500 }}>Recommendation: Review biometric sync logs.</p>
     </Card>

     <Card padding="20px 24px" noHover style={{ height: CARD_HEIGHTS.insight }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
         <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '8px' }}><AlertOctagon size={16} color="#EF4444" /></div>
         <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Compensation Alert</div>
         <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px' }}>ACTION REQ</div>
       </div>
       <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '8px' }}>Missing salary structures for 100% of employees.</p>
       <p style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 500 }}>Recommendation: Assign structures before payroll.</p>
     </Card>
  </div>
));

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
          <div key={`demo-log-${i}`} style={{ display: 'flex', gap: '16px', padding: '10px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0F172A', border: '3px solid rgba(255,255,255,0.1)', marginTop: '2px', flexShrink: 0 }} />
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
          <div key={log.id} style={{ display: 'flex', gap: '16px', padding: '10px 0', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0F172A', border: '3px solid #3B82F6', marginTop: '2px' }} />
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
  if (n.includes('day') || n.includes('national') || n.includes('republic') || n.includes('independence')) return { label: 'National Holiday', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
  if (n.includes('diwali') || n.includes('holi') || n.includes('eid') || n.includes('christmas')) return { label: 'Festival', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' };
  return { label: 'Religious Holiday', color: '#10B981', bg: 'rgba(16,185,129,0.1)' };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>Company Calendar</h3>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setCalendarTab('holidays')} style={{ padding: '6px 12px', background: calendarTab === 'holidays' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: calendarTab === 'holidays' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: calendarTab === 'holidays' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>Holidays</button>
          <button onClick={() => setCalendarTab('birthdays')} style={{ padding: '6px 12px', background: calendarTab === 'birthdays' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', color: calendarTab === 'birthdays' ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: calendarTab === 'birthdays' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none' }}>Birthdays</button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {calendarTab === 'holidays' && (
          Object.keys(upcomingHolidays).length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>No upcoming holidays scheduled.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.keys(upcomingHolidays).map((month) => (
                <div key={month}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>{month}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {upcomingHolidays[month].map((h: any, i: number) => {
                      const cat = getHolidayCategory(h.name);
                      return (
                        <div key={`holiday-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 4px 12px rgba(59,130,246,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', lineHeight: 1 }}>{new Date(h.date).toLocaleString('default', { month: 'short' })}</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1, marginTop: '2px' }}>{new Date(h.date).getDate()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{cat.label}</div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{new Date(h.date).toLocaleString('default', { weekday: 'long' })}</div>
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
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>No birthdays this month</div>
              </div>
              {nextBirthday && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Next upcoming birthday</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(139,92,246,0.3)', flexShrink: 0 }}>
                      {nextBirthday.name.split(' ').map((n:any)=>n[0]).join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextBirthday.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{nextBirthday.department || 'Engineering'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{new Date(nextBirthday.date).toLocaleString('default', { month: 'short', day: 'numeric' })}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Turns {new Date().getFullYear() - new Date(nextBirthday.date).getFullYear()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {thisMonthBirthdays.map((b: any, i: number) => (
                <div key={`bday-${b.id || i}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#EC4899', flexShrink: 0 }}>
                    {b.name.split(' ').map((n:any)=>n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{b.department || 'Employee'}</div>
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

const DEMO_DATA: Record<string, any[]> = {
  '3m': [
    { name: 'May', count: 29 },
    { name: 'Jun', count: 30 },
    { name: 'Jul', count: 30 }
  ],
  '6m': [
    { name: 'Feb', count: 28 },
    { name: 'Mar', count: 28 },
    { name: 'Apr', count: 29 },
    { name: 'May', count: 29 },
    { name: 'Jun', count: 30 },
    { name: 'Jul', count: 30 }
  ],
  '1y': [
    { name: 'Aug', count: 24 },
    { name: 'Sep', count: 25 },
    { name: 'Oct', count: 25 },
    { name: 'Nov', count: 26 },
    { name: 'Dec', count: 27 },
    { name: 'Jan', count: 27 },
    { name: 'Feb', count: 28 },
    { name: 'Mar', count: 29 },
    { name: 'Apr', count: 29 },
    { name: 'May', count: 30 },
    { name: 'Jun', count: 30 },
    { name: 'Jul', count: 30 }
  ]
};

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
  background: #10B981;
  animation: pulse 2s infinite;
}
.demo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #F59E0B;
  animation: pulse 2s infinite;
}
.chart-divider {
  border-left: 1px solid rgba(255,255,255,0.08);
}
`;

function AutoSizedAreaChart({ data }: { data: any[] }) {
  const [width, setWidth] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Use ALL real backend data — never strip, never fabricate.
  // The backend already returns every month in the selected range.
  const allValues = data.map(d => (d.count ?? 0) as number);
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;
  const hasAnyData = maxVal > 0;

  // Detect whether tracking started mid-range (leading zeros exist).
  const firstNonZeroIdx = allValues.findIndex(v => v > 0);
  const hasLeadingZeros = firstNonZeroIdx > 0;

  // Y-domain: always start at 0, pad top by ~15% so dots are not clipped.
  const yTop = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.18);
  const yDomain: [number, number] = [0, yTop];

  // Chart fills the full available height.
  const chartHeight = 172;

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
    <div ref={ref} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {width > 0 && data.length > 0 && (
        <AreaChart width={width} height={chartHeight} data={data}
          margin={{ top: 28, right: 20, left: 0, bottom: 4 }}>
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
            contentStyle={{ backgroundColor: 'rgba(10,15,30,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '13px', boxShadow: '0 8px 28px rgba(0,0,0,0.6)' }}
            itemStyle={{ color: '#FF5A67', fontWeight: 700 }}
            cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(v: any) => [v, 'Employees']}
            labelStyle={{ color: 'rgba(255,255,255,0.45)', marginBottom: '2px', fontSize: '11px' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#FF5A67"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#hcGradient)"
            fillOpacity={1}
            connectNulls={true}
            dot={renderDot}
            activeDot={{ r: 6, stroke: 'rgba(255,90,103,0.35)', strokeWidth: 5 }}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          >
            <LabelList dataKey="count" content={renderLabel} />
          </Area>
        </AreaChart>
      )}

      {/* Caption: shown when tracking started mid-range */}
      {hasLeadingZeros && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', paddingBottom: '2px', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
            <circle cx="5" cy="5" r="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
            <text x="5" y="8.2" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif">i</text>
          </svg>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', letterSpacing: '0.01em' }}>
            Workforce tracking began in {data[firstNonZeroIdx]?.name}.
          </span>
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // App State
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');
  const [calendarTab, setCalendarTab] = useState<'holidays' | 'birthdays'>('holidays');

  // Data State
  const [overview, setOverview] = useState<any>(null);
  const [headcountTrend, setHeadcountTrend] = useState<any[]>([]);
  const [misc, setMisc] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Initial Load (Fetches Everything)
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchInitial = async () => {
      try {
        const [overviewData, headcountData, miscData, logsData, holidaysData] = await Promise.all([
          getOverviewStats(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch overview", 'error'); return null; }),
          getHeadcountTrend(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch headcount", 'error'); return []; }),
          getMiscWidgets(dateRange, { signal: controller.signal }).catch((e) => { if (e.name !== 'CanceledError') showToast("Failed to fetch widgets", 'error'); return null; }),
          getAuditLogs({ page: 1, limit: 4 }).catch(() => ({ data: [] })),
          holidayService.getHolidays(new Date().getFullYear()).catch(() => [])
        ]);
        
        if (!controller.signal.aborted) {
          if (overviewData !== null) setOverview(overviewData);
          if (headcountData !== null) setHeadcountTrend(Array.isArray(headcountData) ? headcountData : []);
          if (miscData !== null) setMisc(miscData);
          setAuditLogs(logsData?.data || []);
          setHolidays(holidaysData || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Soft Load (Only chart data updates on range switch)
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
          setMisc(miscData);
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

  // Derived state with useMemo
  const safeDeptDist = useMemo(() => (misc?.departmentDistribution?.length > 0) ? misc.departmentDistribution : [
    { name: 'Engineering', count: 18 }, { name: 'Sales', count: 8 }, { name: 'HR', count: 4 }, { name: 'Others', count: 0 }
  ], [misc?.departmentDistribution]);
  
  const chartData = useMemo(() => {
    if (headcountTrend && headcountTrend.length > 0) {
      return headcountTrend;
    }
    return DEMO_DATA[dateRange] || DEMO_DATA['6m'];
  }, [headcountTrend, dateRange]);
  
  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  if (initialLoading) return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', paddingBottom: '40px' }}>
      <Skeleton height="48px" width="250px" style={{ marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {[1,2,3,4,5].map(i => <Skeleton key={`skel-${i}`} height="110px" borderRadius="20px" />)}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1800px', margin: '0 auto', paddingBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
      <style>{pulseStyles}</style>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em', lineHeight: 1 }}>Analytics Overview</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500 }}>Insights and trends to help you make data-driven decisions.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => exportReport(dateRange).catch(() => showToast("Export failed", 'error'))} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* ROW 1: KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
          <KPI title="Total Employees" value={overview?.activeEmployees || 0} sub="active headcount" color="59, 130, 246" icon={Users} />
          <KPI title="Avg Monthly Payroll" value={formatK(overview?.currentPayrollCost)} sub="avg per month" color="16, 185, 129" icon={IndianRupee} />
          <KPI title="Attendance Rate" value={`${Number(overview?.attendanceRate || 0).toFixed(1)}%`} sub="overall average" color="139, 92, 246" icon={CalendarDays} />
          <KPI title="Attrition Rate" value={`${Number(overview?.attritionRate || 0).toFixed(1)}%`} sub="last 6 months" color="245, 158, 11" icon={TrendingDown} />
          <KPI title="Active Departments" value={safeDeptDist.filter((d:any)=>d.count>0).length} sub="operational" color="20, 184, 166" icon={Briefcase} />
        </div>

        {/* ROW 2: HEADCOUNT & DEPARTMENTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          
          <Card data-testid="headcount-card" noHover style={{ gridColumn: 'span 8', height: '320px', minHeight: '320px', maxHeight: '320px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* TRUE HEADER ROW */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', margin: 0 }}>Headcount Growth</h3>
                {headcountTrend && headcountTrend.length > 0 ? (
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10B981', height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <div className="live-dot" /> LIVE DATA
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#F59E0B', height: '24px', padding: '0 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <div className="demo-dot" /> DEMO DATA
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['3m', '6m', '1y'].map((range) => (
                  <button 
                    key={`range-${range}`} 
                    onClick={() => setDateRange(range)} 
                    style={{ padding: '4px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: dateRange === range ? '#2563EB' : 'transparent', color: dateRange === range ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTENT SPLIT */}
            <div style={{ display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr)', flex: 1, minHeight: 0 }}>
              {/* LEFT KPI */}
              <div style={{ paddingRight: '24px', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Employees</div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{overview?.activeEmployees || 30}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    <Users size={12} /> As of Jul 2026
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 16px 0', flexShrink: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Hires</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={14} style={{ transform: 'rotate(180deg)' }} /> +0
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Net Exits</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={14} /> 0
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stability Rate</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> 100%
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT CHART REGION */}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '-8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Total Emp</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{overview?.activeEmployees || 30}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Teams</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{safeDeptDist.filter((d:any)=>d.count>0).length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Largest</div>
                    <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeDeptDist[0]?.name || 'Engineering'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '100px', position: 'relative', flexShrink: 0 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={safeDeptDist} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="count" stroke="none">
                          {safeDeptDist.map((e: any, index: number) => <Cell key={`pie-${e.name || index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{overview?.activeEmployees || 30}</div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {safeDeptDist.slice(0,3).map((d: any, i: number) => {
                      const total = (overview?.activeEmployees || 30);
                      const pct = Math.round((d.count / total) * 100) || 0;
                      return (
                        <div key={`dept-stat-${d.name || i}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                              <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70px' }}>{d.name}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>{d.count} emp &bull; {pct}%</div>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, lineHeight: 1.3 }}>
                    <span style={{ color: '#3B82F6', fontWeight: 600 }}>Insight:</span> {safeDeptDist[0]?.name || 'Engineering'} represents the majority of organizational capacity.
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>

        </div>

        {/* ROW 3: COMPENSATION & COMPLIANCE (STATIC) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          <StaticCompensationInsights />
          <StaticPayrollCompliance />
        </div>

        {/* ROW 4: ACTIVITY & CALENDAR (STATIC) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          <StaticActivityFeed auditLogs={auditLogs} />
          <StaticCalendar holidays={holidays} birthdays={misc?.birthdays} calendarTab={calendarTab} setCalendarTab={setCalendarTab} />
        </div>

        {/* BOTTOM: AI INSIGHTS (STATIC) */}
        <StaticAIInsights />



      </div>
    </div>
  );
}
