import { useMemo, Suspense, lazy, useEffect } from 'react';
import CommandCenter from '../components/attendance-intelligence/CommandCenter';
import ExecutiveToolbar from '../components/attendance-intelligence/ExecutiveToolbar';
import WorkforceHealthCard from '../components/attendance-intelligence/WorkforceHealthCard';
import NotificationCenter from '../components/attendance-intelligence/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import WidgetErrorBoundary from '../components/common/WidgetErrorBoundary';
import { useIntelligenceData } from '../hooks/useIntelligenceData';

const RiskAnalysisPanel = lazy(() => import('../components/attendance-intelligence/RiskAnalysisPanel'));
const WorkforceMap = lazy(() => import('../components/attendance-intelligence/WorkforceMap'));
const LiveAlertsFeed = lazy(() => import('../components/attendance-intelligence/LiveAlertsFeed'));
const RiskHeatmap = lazy(() => import('../components/attendance-intelligence/RiskHeatmap'));
const WorkforceTable = lazy(() => import('../components/attendance-intelligence/WorkforceTable'));
const AttendanceAnalytics = lazy(() => import('../components/attendance-intelligence/AttendanceAnalytics'));
const AttendanceForecast = lazy(() => import('../components/attendance-intelligence/AttendanceForecast'));

const Skeleton = () => <div className="premium-card loading-pulse" style={{ height: '300px', width: '100%', background: 'var(--bg-panel)', opacity: 0.5, borderRadius: '12px' }} />;

export default function AttendanceIntelligence() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { data, loading, error } = useIntelligenceData();

  useEffect(() => {
    console.log('AttendanceIntelligence mounted');
    return () => console.log('AttendanceIntelligence unmounted');
  }, []);

  // Determine View Scope based on Role
  const viewScope = useMemo(() => {
    if (user?.role === 'MANAGER') return 'Team Only';
    if (user?.role === 'HR') return 'Company View';
    return 'Full View';
  }, [user]);

  if (user?.role === 'EMPLOYEE') {
    return <Navigate to="/" replace />;
  }

  if (error) {
    return (
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto', textAlign: 'center', color: 'var(--danger)' }}>
        <h2 style={{ fontWeight: '800', marginBottom: '16px' }}>Failed to load data</h2>
        <p>Could not retrieve intelligence metrics from the server.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        key="attendance-intelligence-page"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, background: isDark ? 'linear-gradient(to right, #fff, #9ca3af)' : 'linear-gradient(to right, #1f2937, #4b5563)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence Command Center</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 0' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Live global workforce presence & risk analysis</p>
            <span style={{ fontSize: '11px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{viewScope}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <span className="pulse-indicator" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px' }}>System Active</span>
        </div>
      </div>

      <ExecutiveToolbar />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <CommandCenter 
          activeWorkers={data.activeWorkers} 
          avgTrustScore={data.avgTrustScore}
          remoteWorkers={data.remoteWorkers}
          criticalRisks={data.criticalRisks}
          sparklines={data.sparklines}
          trendMetrics={data.trendMetrics}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>
          <WidgetErrorBoundary fallbackMessage="Failed to load map data.">
            <Suspense fallback={<Skeleton />}><WorkforceMap locations={data.liveWorkforce?.locations || []} companyLocation={data.companyLocation} /></Suspense>
          </WidgetErrorBoundary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <WidgetErrorBoundary>
              <Suspense fallback={<Skeleton />}><RiskHeatmap /></Suspense>
            </WidgetErrorBoundary>
            <WidgetErrorBoundary>
              <NotificationCenter recentEvents={data.recentEvents} />
            </WidgetErrorBoundary>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <WorkforceHealthCard />
          <WidgetErrorBoundary fallbackMessage="Risk analysis unavailable.">
            <Suspense fallback={<Skeleton />}><RiskAnalysisPanel lowTrustFlags={data.lowTrustFlags} /></Suspense>
          </WidgetErrorBoundary>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <WidgetErrorBoundary>
          <Suspense fallback={<Skeleton />}><LiveAlertsFeed recentEvents={data.recentEvents} /></Suspense>
        </WidgetErrorBoundary>
      </div>

      {/* Analytics & Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <WidgetErrorBoundary fallbackMessage="Failed to load attendance analytics.">
          <Suspense fallback={<Skeleton />}><AttendanceAnalytics chartData={data.analytics?.chartData} stats={data.analytics?.stats} /></Suspense>
        </WidgetErrorBoundary>
        <WidgetErrorBoundary>
          <Suspense fallback={<Skeleton />}><AttendanceForecast forecastData={data.forecast} /></Suspense>
        </WidgetErrorBoundary>
      </div>

      {/* Workforce Visibility */}
      <div style={{ width: '100%' }}>
        <WidgetErrorBoundary fallbackMessage="Failed to load workforce table.">
          <Suspense fallback={<Skeleton />}><WorkforceTable employees={data.liveWorkforce?.employees || []} /></Suspense>
        </WidgetErrorBoundary>
      </div>

      <style>{`
        .pulse-indicator {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

