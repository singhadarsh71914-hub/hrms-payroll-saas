import { motion } from 'framer-motion';
import { TrendingUp, Crosshair, Users, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function AttendanceForecast({ forecastData }: { forecastData?: any }) {
  const { isDark } = useTheme();
  const data = forecastData || {};

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%',
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="#3b82f6" /> Attendance Forecast
        </h3>
        <span style={{ 
          background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', 
          fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 
        }}>
          {data?.confidence ?? 0}% Confidence
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', color: '#10b981' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Expected Attendance (Tomorrow)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>{data?.expectedAttendance ?? '0%'}</div>
            </div>
          </div>
          <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>{data?.attendanceStatus ?? 'N/A'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', color: '#f59e0b' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Potential Late Arrivals</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>{data?.potentialLate ?? 0} Employees</div>
            </div>
          </div>
          <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>{data?.lateRate ? data.lateRate + '% Late Rate' : ''}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', color: '#ef4444' }}>
              <Crosshair size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Risk Trend (Next 7 Days)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-color)' }}>{data?.riskTrend ?? 'N/A'}</div>
            </div>
          </div>
          <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Trust Score Impact</div>
        </div>
      </div>
    </motion.div>
  );
}
