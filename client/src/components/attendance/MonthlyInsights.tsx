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
      boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
    }}>
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Activity size={20} color="#14b8a6" /> Monthly Insights
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--success)' }}>{attendanceSummary.PRESENT}</div>
          <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</div>
        </div>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--danger)' }}>{attendanceSummary.ABSENT}</div>
          <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
        </div>
        <div style={{ padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800, color: 'var(--warning)' }}>{attendanceSummary.ON_LEAVE}</div>
          <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leaves</div>
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
