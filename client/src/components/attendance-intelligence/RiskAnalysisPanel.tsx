import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, MonitorSmartphone, MapPin, TrendingDown, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface RiskAnalysisPanelProps {
  lowTrustFlags: any[];
}

const RiskAnalysisPanel = React.memo(function RiskAnalysisPanel({ lowTrustFlags }: RiskAnalysisPanelProps) {
  const { isDark } = useTheme();

  const flags = Array.isArray(lowTrustFlags) ? lowTrustFlags : [];

  const getCategory = (score: number) => {
    if (score < 40) return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    if (score < 70) return { label: 'HIGH', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
    if (score < 90) return { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { label: 'LOW', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="premium-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', backdropFilter: 'blur(10px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={20} color="#ef4444" /> AI Risk Analysis Engine
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>System Risk Score</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: flags.length > 5 ? '#ef4444' : '#10b981' }}>
            {flags.length > 5 ? 'Elevated' : 'Optimal'}
          </div>
        </div>
        <div style={{ padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Employee Impact</div>
          <div style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--text-muted)" /> {flags.length}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
        {lowTrustFlags.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ margin: '0 auto 10px', color: '#10b981' }}><ShieldAlert size={36} /></div>
              <p>No active risks</p>
              <p style={{ fontSize: '12px' }}>Workforce authenticity is optimal.</p>
            </div>
          </div>
        ) : (
          flags.map((flag, idx) => {
            const cat = getCategory(flag?.score || 0);
            return (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={idx} style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                background: cat.bg,
                borderLeft: `4px solid ${cat.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: cat.color, padding: '2px 8px', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>{cat.label} RISK</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: cat.color, fontWeight: 700 }}>Trust: {flag.score}%</span>
                    <TrendingDown size={14} color={cat.color} />
                  </div>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-color)', marginBottom: '12px', fontWeight: 600 }}>
                  Employee: {flag?.emp || 'Unknown'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: '4px 8px', borderRadius: '4px' }}><MapPin size={12}/> Geofence Breach</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: '4px 8px', borderRadius: '4px' }}><Fingerprint size={12}/> Face Mismatch</div>
                  {flag.score < 50 && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', padding: '4px 8px', borderRadius: '4px' }}><MonitorSmartphone size={12}/> Device Anomaly</div>}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
});

export default RiskAnalysisPanel;
