import React, { Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Lazy loading the heavy charts component
const AttendanceCharts = React.lazy(() => import('./AttendanceCharts'));

interface MonthlyInsightsProps {
  attendanceSummary: any;
}

const MonthlyInsights = memo(({ attendanceSummary }: MonthlyInsightsProps) => {
  const { isDark } = useTheme();

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' 
    }}>
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Activity size={20} color="#14b8a6" /> Monthly Insights
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{attendanceSummary.PRESENT}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</div>
        </div>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{attendanceSummary.ABSENT}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
        </div>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{attendanceSummary.ON_LEAVE}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leaves</div>
        </div>
      </div>

      <Suspense fallback={<div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading charts...</div>}>
        <AttendanceCharts attendanceSummary={attendanceSummary} />
      </Suspense>
    </motion.div>
  );
});

MonthlyInsights.displayName = 'MonthlyInsights';

export default MonthlyInsights;
