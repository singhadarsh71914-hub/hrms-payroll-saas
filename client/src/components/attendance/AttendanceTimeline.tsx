import { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Clock, LogOut, Activity } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceTimelineProps {
  attendanceHistory: any[];
}

const AttendanceTimeline = memo(({ attendanceHistory }: AttendanceTimelineProps) => {
  const { isDark } = useTheme();

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
    }}>
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Activity size={20} color="#f43f5e" /> Smart Timeline
      </div>
      <div style={{ position: 'relative', paddingLeft: '2rem' }}>
        {attendanceHistory.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No attendance history available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '2px solid rgba(156, 163, 175, 0.2)' }}>
            {attendanceHistory.slice(0, 4).map((record: any, idx: number) => (
              <motion.div key={record.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div style={{ 
                  position: 'absolute', left: '-1.45rem', top: '0', width: '28px', height: '28px', borderRadius: 'var(--radius-full, 50%)', 
                  background: record.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  border: `2px solid ${record.status === 'PRESENT' ? 'var(--success)' : 'var(--danger)'}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {record.status === 'PRESENT' ? <CheckCircle size={14} color="var(--success)" /> : <AlertTriangle size={14} color="var(--danger)" />}
                </div>
                <div style={{ 
                  background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', 
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' 
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span style={{ fontSize: 'var(--font-sm, 12px)', padding: '0.2rem 0.5rem', borderRadius: '4px', background: record.status === 'PRESENT' ? 'var(--success)' : 'var(--danger)', color: '#fff' }}>
                      {record.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-base, 14px)', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12}/> IN: {record.check_in ? new Date(record.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LogOut size={12}/> OUT: {record.check_out ? new Date(record.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', gridColumn: 'span 2' }}>
                      <Activity size={12}/> Worked: <strong style={{ color: 'var(--text-color)' }}>{record.check_out ? 'Finished' : 'Ongoing'}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

AttendanceTimeline.displayName = 'AttendanceTimeline';

export default AttendanceTimeline;
