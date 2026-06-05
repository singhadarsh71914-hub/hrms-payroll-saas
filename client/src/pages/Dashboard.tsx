import React, { useEffect, useState, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { 
  getOverviewStats, getPayrollTrend, getHeadcountTrend, 
  getTopEmployees, getMiscWidgets, exportReport
} from '../services/analytics.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Download, AlertCircle, TrendingUp, TrendingDown,
  CheckCircle, Users, IndianRupee, Activity, CalendarDays,
  Briefcase, Cake, ShieldCheck, Clock
} from 'lucide-react';

interface EBProps { children: ReactNode; }
interface EBState { hasError: boolean; }
class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Dashboard Error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="premium-card" style={{ textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', margin: '2rem' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Dashboard Interface Crash</h2>
          <p>A rendering error occurred. Please reload to restore state.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1.5rem', backgroundColor: '#ef4444' }}>Reload Interface</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Sparkline = ({ colorClass, trend }: { colorClass: string, trend: string }) => {
  const points = trend === 'up' ? "0,20 10,15 20,18 30,10 40,12 50,0" : 
                 trend === 'down' ? "0,0 10,5 20,2 30,15 40,12 50,20" : 
                 "0,10 10,8 20,12 30,9 40,11 50,10";
  return (
    <svg width="60" height="24" viewBox="0 0 50 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points={points} fill="none" stroke={`var(--${colorClass})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const KPICard = ({ title, value, sub, icon: Icon, colorClass, trend, trendVal }: any) => {
  return (
    <div className="premium-card kpi-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div className="kpi-icon-bg" style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.03, transform: 'scale(1.5)', transition: 'transform 0.4s ease' }}>
        <Icon size={100} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `rgba(var(--${colorClass}-rgb, 0,0,0), 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `var(--${colorClass})` }}>
              <Icon size={22} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
          </div>
          <Sparkline colorClass={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'warning'} trend={trend} />
        </div>
        <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '6px', color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--warning)' }}>
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
            {trend === 'neutral' && <Activity size={14} />}
            <span style={{ fontWeight: 700 }}>{trendVal}</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>{sub}</span>
        </div>
      </div>
    </div>
  );
};

const CSSBarChart = ({ data, dataKey, color, height = '240px' }: { data: any[], dataKey: string, color: string, height?: string }) => {
  const maxVal = Math.max(...data.map(d => d[dataKey]), 1);
  return (
    <div style={{ width: '100%', height, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', position: 'relative', paddingBottom: '24px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%', padding: '0 10%' }}>
            <div style={{ 
              width: '100%', 
              height: `${(d[dataKey] / maxVal) * 100}%`, 
              background: `var(--${color})`, 
              borderRadius: '6px 6px 0 0',
              transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.9
            }} title={`${d.name}: ${d[dataKey]}`} />
          </div>
          <div style={{ position: 'absolute', bottom: '-24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.name}</div>
        </div>
      ))}
    </div>
  );
};

const CSSDonutChart = ({ data, totalLabel }: { data: any[], totalLabel: string }) => {
  const total = data.reduce((sum, d) => sum + (d.value || d.count || 0), 0);
  let currentPercent = 0;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  const gradientParts = data.map((d, i) => {
    const start = currentPercent;
    const val = d.value || d.count || 0;
    const percent = total > 0 ? (val / total) * 100 : 0;
    currentPercent += percent;
    return `${colors[i % colors.length]} ${start}% ${currentPercent}%`;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '32px' }}>
      <div style={{ 
        width: '140px', height: '140px', borderRadius: '50%', 
        background: `conic-gradient(${gradientParts.join(', ')})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-md)', flexShrink: 0
      }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--bg-card)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{totalLabel}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: colors[i % colors.length], borderRadius: '3px' }} />
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{d.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.value || d.count || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');
  
  const [overview, setOverview] = useState<any>(null);
  const [payrollTrend, setPayrollTrend] = useState<any[]>([]);
  const [headcountTrend, setHeadcountTrend] = useState<any[]>([]);
  const [topEmps, setTopEmps] = useState<any[]>([]);
  const [misc, setMisc] = useState<any>(null);

  const fetchAllData = async (range: string) => {
    try {
      const [
        overviewData, payrollData, headcountData, topData, miscData
      ] = await Promise.all([
        getOverviewStats(range).catch(() => null),
        getPayrollTrend(range).catch(() => []),
        getHeadcountTrend(range).catch(() => []),
        getTopEmployees(range).catch(() => []),
        getMiscWidgets(range).catch(() => null)
      ]);

      setOverview(overviewData);
      setPayrollTrend(Array.isArray(payrollData) ? payrollData : []);
      setHeadcountTrend(Array.isArray(headcountData) ? headcountData : []);
      setTopEmps(Array.isArray(topData) ? topData : []);
      setMisc(miscData);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(dateRange); }, [dateRange]);

  const handleExport = () => {
    exportReport(dateRange).catch(err => showToast("Export failed: " + err.message, 'error'));
  };

  const formatCurrency = (val: any) => `₹${Number(val || 0).toLocaleString()}`;
  const formatK = (val: any) => `₹${(Number(val || 0)/1000).toFixed(1)}k`;

  if (loading) return <div style={{ padding: '24px' }}>Loading executive dashboard...</div>;

  const safePayrollTrend = payrollTrend.length > 0 ? payrollTrend : [
    { name: 'Jan', net: 300000 }, { name: 'Feb', net: 320000 }, { name: 'Mar', net: 310000 }, { name: 'Apr', net: 350000 }
  ];
  const safeHeadcountTrend = headcountTrend.length > 0 ? headcountTrend : [
    { name: 'Jan', count: 10 }, { name: 'Feb', count: 12 }, { name: 'Mar', count: 15 }, { name: 'Apr', count: 14 }
  ];
  const safeSalaryDist = misc?.salaryDistribution?.filter((s:any)=>s.count > 0).length > 0 ? misc.salaryDistribution : [
    { name: '< 25k', count: 2 }, { name: '25k-50k', count: 5 }, { name: '50k-1L', count: 3 }
  ];
  const safeDeptDist = misc?.departmentDistribution || [
    { name: 'Engineering', count: 8 }, { name: 'Sales', count: 4 }, { name: 'HR', count: 2 }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* HERO SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Welcome back, {user?.first_name || 'Admin'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Here's what's happening in your organization today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {['3m', '6m', '1y'].map(range => (
              <button key={range} onClick={() => setDateRange(range)} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: dateRange === range ? 'var(--bg-page)' : 'transparent', color: dateRange === range ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>{range.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={handleExport} className="btn btn-secondary">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <KPICard title="Total Workforce" value={overview?.activeEmployees || 0} sub="vs last period" icon={Users} colorClass="primary" trend="up" trendVal={`+${overview?.newHires || 0}`} />
        <KPICard title="Monthly Payroll" value={formatK(overview?.currentPayrollCost)} sub="vs last period" icon={IndianRupee} colorClass="success" trend={Number(overview?.payrollChange) > 0 ? 'down' : 'up'} trendVal={`${Math.abs(Number(overview?.payrollChange || 0)).toFixed(1)}%`} />
        <KPICard title="Attendance Rate" value={`${Number(overview?.attendanceRate || 0).toFixed(1)}%`} sub="avg this month" icon={CalendarDays} colorClass="warning" trend="neutral" trendVal="Stable" />
        <KPICard title="Pending Actions" value={(overview?.pendingLeaves || 0) + (overview?.pendingLoans || 0)} sub="requires attention" icon={Briefcase} colorClass="danger" trend="down" trendVal={`${overview?.pendingLeaves || 0} leaves`} />
      </div>

      {/* CHARTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Payroll Trend</h3>
          </div>
          <CSSBarChart data={safePayrollTrend} dataKey="net" color="primary" />
        </div>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Department Distribution</h3>
          </div>
          <div style={{ padding: '20px 0' }}>
            <CSSDonutChart data={safeDeptDist} totalLabel="Employees" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginBottom: '32px' }}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Salary Brackets</h3>
          </div>
          <div style={{ padding: '20px 0' }}>
            <CSSDonutChart data={safeSalaryDist} totalLabel="Employees" />
          </div>
        </div>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Headcount Growth</h3>
          </div>
          <CSSBarChart data={safeHeadcountTrend} dataKey="count" color="success" />
        </div>
      </div>

      {/* BOTTOM WIDGETS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {/* PAYROLL COMPLIANCE */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Payroll Compliance</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(misc?.payrollCalendar || [{name:'Jan 2026', status:'PAID'},{name:'Feb 2026', status:'PAID'},{name:'Mar 2026', status:'PENDING'}]).map((run:any, i:number) => {
              const isDone = run.status === 'PAID' || run.status === 'PROCESSED';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-page)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>{run.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDone ? 'var(--success)' : 'var(--warning)', fontSize: '12px', fontWeight: 600 }}>
                    {isDone ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {run.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPCOMING EVENTS */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Upcoming Events</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(misc?.events || [{type:'Birthday', name:'John Doe', date: new Date().toISOString()},{type:'Work Anniversary', name:'Jane Smith', date: new Date().toISOString()}]).slice(0, 4).map((ev:any, i:number) => (
              <div key={i} style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: ev.type === 'Birthday' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(124, 58, 237, 0.1)', color: ev.type === 'Birthday' ? 'var(--warning)' : 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ev.type === 'Birthday' ? <Cake size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{ev.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{ev.type} on {new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP EARNERS */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Top Salary Spend</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(topEmps.length > 0 ? topEmps : [{name:'Adarsh Singh', designation:'CEO', salary:150000}]).slice(0,4).map((e:any, i:number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                    {e.name ? e.name[0] : 'E'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{e.designation}</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(e.salary)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const Dashboard: React.FC = () => (
  <ErrorBoundary>
    <DashboardContent />
  </ErrorBoundary>
);

export default Dashboard;
