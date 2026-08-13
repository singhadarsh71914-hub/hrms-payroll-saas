import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceTimerProps {
  durationSeconds: number;
}

export default function AttendanceTimer({ durationSeconds }: AttendanceTimerProps) {
  const { isDark } = useTheme();

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <motion.div 
        key={durationSeconds} 
        initial={{ opacity: 0.8, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }} 
        style={{ 
          fontSize: '3.5rem', 
          fontWeight: '900', 
          fontFamily: 'SF Mono, monospace', 
          letterSpacing: '-2px', 
          background: isDark ? 'linear-gradient(to right, #fff, #9ca3af)' : 'linear-gradient(to right, #1f2937, #4b5563)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' 
        }}
      >
        {formatDuration(durationSeconds)}
      </motion.div>
      <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: 'var(--font-base, 14px)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Session Timer</p>
    </div>
  );
}
