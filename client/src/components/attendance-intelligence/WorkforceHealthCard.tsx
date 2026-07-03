import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function WorkforceHealthCard() {
  const { isDark } = useTheme();
  
  // Animate the score
  const [animatedScore, setAnimatedScore] = useState(0);
  const targetScore = 96; // Derived from aggregate trust scores

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

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="#8b5cf6" /> Workforce Health Score
        </h3>
        <span style={{ 
          background: 'rgba(16, 185, 129, 0.2)', 
          color: '#10b981', 
          fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '999px', fontWeight: 'bold' 
        }}>
          OPTIMAL
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1 }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={[{ value: animatedScore || 0 }, { value: 100 - (animatedScore || 0) }]} 
                cx="50%" cy="50%" innerRadius={45} outerRadius={60} 
                startAngle={90} endAngle={-270} dataKey="value" stroke="none"
              >
                <Cell fill="#10b981" />
                <Cell fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{animatedScore}%</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} color="#10b981" />
            <span style={{ color: 'var(--text-color)' }}>Attendance Reliability (98%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle size={16} color="#10b981" />
            <span style={{ color: 'var(--text-color)' }}>GPS Integrity (100%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ color: 'var(--text-color)' }}>Face Verification (92%)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
