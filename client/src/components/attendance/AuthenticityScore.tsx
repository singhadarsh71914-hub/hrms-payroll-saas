import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';

interface AuthenticityScoreProps {
  todayAttendance: any;
}

export default function AuthenticityScore({ todayAttendance }: AuthenticityScoreProps) {
  const { isDark } = useTheme();
  
  // Animate the score from 0 to target
  const [animatedScore, setAnimatedScore] = useState(0);
  const targetScore = todayAttendance?.trust_score ?? 100;

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= targetScore) {
        current = targetScore;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [targetScore]);

  const isLowRisk = targetScore >= 90;
  
  const faceVerified = todayAttendance?.face_match_score ? Math.round(todayAttendance.face_match_score) : null;
  const livenessPassed = todayAttendance?.liveness_passed !== false;
  const insideGeofence = todayAttendance?.inside_geofence !== false;
  const locationVerified = todayAttendance?.location_verified !== false;

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-md, 18px)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--secondary)" /> Attendance Authenticity
        </h3>
        <span style={{ 
          background: isLowRisk ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
          color: isLowRisk ? 'var(--success)' : 'var(--danger)', 
          fontSize: 'var(--font-sm, 12px)', padding: '0.3rem 0.8rem', borderRadius: '999px', fontWeight: 'bold' 
        }}>
          {isLowRisk ? 'LOW RISK' : 'HIGH RISK'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={[{ value: animatedScore }, { value: 100 - animatedScore }]} 
                cx="50%" cy="50%" innerRadius={45} outerRadius={60} 
                startAngle={90} endAngle={-270} dataKey="value" stroke="none"
              >
                <Cell fill={isLowRisk ? 'var(--success)' : 'var(--warning)'} />
                <Cell fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: 'var(--font-lg, 24px)', fontWeight: 800 }}>{animatedScore}%</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-base, 14px)' }}>
            {faceVerified && faceVerified >= 90 ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--danger)" />}
            <span style={{ color: 'var(--text-color)' }}>Face Verified {faceVerified ? `(${faceVerified}%)` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-base, 14px)' }}>
            {livenessPassed ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--danger)" />}
            <span style={{ color: 'var(--text-color)' }}>Liveness Passed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-base, 14px)' }}>
            {insideGeofence ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--warning)" />}
            <span style={{ color: 'var(--text-color)' }}>Inside Geofence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--font-base, 14px)' }}>
            {locationVerified ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--warning)" />}
            <span style={{ color: 'var(--text-color)' }}>Trusted Device / IP</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
