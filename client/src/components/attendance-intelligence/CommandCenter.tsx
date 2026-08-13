import React, { useEffect } from 'react';
import { motion, animate as motionAnimate } from 'framer-motion';
import { Users, ShieldAlert, MonitorSmartphone, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

function AnimatedCounter({ end, duration = 2.5, suffix = '' }: { end: number, duration?: number, suffix?: string }) {
  const [count, ReactSetCount] = React.useState(0);
  React.useEffect(() => {
    const controls = motionAnimate(0, end, {
      duration,
      ease: "easeOut",
      onUpdate: (value) => ReactSetCount(Math.floor(value))
    });
    return controls.stop;
  }, [end, duration]);
  return <>{count}{suffix}</>;
}

interface CommandCenterProps {
  activeWorkers: number;
  avgTrustScore: number;
  remoteWorkers: number;
  criticalRisks: number;
  sparklines: any;
  trendMetrics?: {
    activeWorkersDelta: number;
    trustDelta: number;
    remoteDelta: number;
    riskDelta: number;
  };
}

const CommandCenter = React.memo(function CommandCenter({ 
  activeWorkers, 
  avgTrustScore, 
  remoteWorkers, 
  criticalRisks, 
  sparklines,
  trendMetrics
}: CommandCenterProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    return () => console.log('CommandCenter unmounted');
  }, []);

  const cardStyle = { 
    padding: 'var(--spacing-xl, 24px)', 
    background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
    backdropFilter: 'blur(10px)', 
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
    boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
      <motion.div whileHover={{ y: -5, boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }} className="premium-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Workforce</h3>
            <p style={{ margin: '12px 0 0', fontSize: 'var(--font-xl, 32px)', fontWeight: 800 }}>
              <AnimatedCounter end={activeWorkers} duration={2.5} />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: (trendMetrics?.activeWorkersDelta ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--font-sm, 12px)', fontWeight: 600 }}>
              {(trendMetrics?.activeWorkersDelta ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
              {(trendMetrics?.activeWorkersDelta ?? 0) > 0 ? '+' : ''}{trendMetrics?.activeWorkersDelta ?? 0}% vs last week
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}><Users size={24} /></div>
        </div>
        <div style={{ height: '40px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklines?.active || [{ v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div whileHover={{ y: -5, boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }} className="premium-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Trust Score</h3>
            <p style={{ margin: '12px 0 0', fontSize: 'var(--font-xl, 32px)', fontWeight: 800, color: 'var(--success)' }}>
              <AnimatedCounter end={avgTrustScore} duration={2.5} suffix="%" />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: (trendMetrics?.trustDelta ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--font-sm, 12px)', fontWeight: 600 }}>
              {(trendMetrics?.trustDelta ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
              {(trendMetrics?.trustDelta ?? 0) > 0 ? '+' : ''}{trendMetrics?.trustDelta ?? 0}% vs yesterday
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}><ShieldAlert size={24} /></div>
        </div>
        <div style={{ height: '40px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklines?.trust || [{ v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke="var(--success)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div whileHover={{ y: -5, boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }} className="premium-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Remote Workers</h3>
            <p style={{ margin: '12px 0 0', fontSize: 'var(--font-xl, 32px)', fontWeight: 800, color: 'var(--secondary)' }}>
              <AnimatedCounter end={remoteWorkers} duration={2.5} />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: (trendMetrics?.remoteDelta ?? 0) >= 0 ? 'var(--secondary)' : 'var(--danger)', fontSize: 'var(--font-sm, 12px)', fontWeight: 600 }}>
              {(trendMetrics?.remoteDelta ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
              {(trendMetrics?.remoteDelta ?? 0) > 0 ? '+' : ''}{trendMetrics?.remoteDelta ?? 0}% vs yesterday
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--secondary)' }}><MonitorSmartphone size={24} /></div>
        </div>
        <div style={{ height: '40px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklines?.remote || [{ v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke="var(--secondary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div whileHover={{ y: -5, boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' }} className="premium-card" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Critical Risks</h3>
            <p style={{ margin: '12px 0 0', fontSize: 'var(--font-xl, 32px)', fontWeight: 800, color: 'var(--danger)' }}>
              <AnimatedCounter end={criticalRisks} duration={2.5} />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: (trendMetrics?.riskDelta ?? 0) <= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 'var(--font-sm, 12px)', fontWeight: 600 }}>
              {(trendMetrics?.riskDelta ?? 0) <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />} 
              {(trendMetrics?.riskDelta ?? 0) > 0 ? '+' : ''}{trendMetrics?.riskDelta ?? 0}% anomalies
            </div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}><AlertTriangle size={24} /></div>
        </div>
        <div style={{ height: '40px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklines?.risks || [{ v: 0 }]}>
              <Line type="monotone" dataKey="v" stroke="var(--danger)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
});

export default CommandCenter;
