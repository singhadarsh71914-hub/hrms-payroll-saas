import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Fingerprint, ShieldAlert, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LiveAlertsFeedProps {
  recentEvents: any[];
}

const LiveAlertsFeed = React.memo(function LiveAlertsFeed({ recentEvents }: LiveAlertsFeedProps) {
  const { isDark } = useTheme();

  React.useEffect(() => {
    console.log('LiveAlertsFeed mounted');
    return () => console.log('LiveAlertsFeed unmounted');
  }, []);

  // Limit to latest 100 events
  const displayEvents = recentEvents.slice(0, 100);

  const getEventMeta = (type: string) => {
    switch(type) {
      case 'CHECK_IN': return { icon: <CheckCircle size={16} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'CHECK_OUT': return { icon: <Clock size={16} />, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
      case 'BREAK_START': return { icon: <Clock size={16} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'BREAK_END': return { icon: <Clock size={16} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'FACE_VERIFICATION': return { icon: <Fingerprint size={16} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'RISK_ALERT': return { icon: <ShieldAlert size={16} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      default: return { icon: <AlertTriangle size={16} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="premium-card" style={{ padding: '24px', height: '500px', display: 'flex', flexDirection: 'column', background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', backdropFilter: 'blur(10px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#f59e0b" /> Live Event Feed
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '999px' }}>
          Latest {displayEvents.length} events
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px', scrollBehavior: 'smooth' }}>
        {displayEvents.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ margin: '0 auto 10px', color: '#10b981' }}><AlertTriangle size={36} /></div>
              <p>No attendance events</p>
              <p style={{ fontSize: '12px' }}>Live stream is active.</p>
            </div>
          </div>
        )}
        <AnimatePresence>
          {displayEvents.map((evt, idx) => {
            const meta = getEventMeta(evt.type);
            return (
              <motion.div 
                initial={{ opacity: 0, x: -20, height: 0 }} 
                animate={{ opacity: 1, x: 0, height: 'auto' }} 
                exit={{ opacity: 0, x: 20, height: 0 }}
                key={evt?.id || `${evt?.type}-${new Date(evt?.time).valueOf()}-${idx}`} 
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                  borderLeft: `4px solid ${meta.color}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex', gap: '16px', alignItems: 'center'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {meta.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: meta.color }}>{evt.type?.replace('_', ' ') || 'UNKNOWN'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {(() => {
                        const d = new Date(evt.time);
                        return isNaN(d.valueOf()) ? 'Unknown Time' : d.toLocaleTimeString();
                      })()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Employee ID: <strong style={{ color: 'var(--text-color)' }}>{evt.data?.employeeId || 'Unknown'}</strong>
                    {evt.data?.location && <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {evt.data.location}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default LiveAlertsFeed;
