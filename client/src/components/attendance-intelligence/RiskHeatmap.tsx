import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const data = [
  { name: 'GPS Violations', value: 12, color: '#f59e0b' },
  { name: 'Face Mismatch', value: 5, color: '#ef4444' },
  { name: 'Multiple Devices', value: 3, color: '#8b5cf6' },
  { name: 'Late Arrivals', value: 20, color: '#3b82f6' },
  { name: 'Geofence Breaches', value: 8, color: '#ec4899' },
];

export default function RiskHeatmap() {
  const { isDark } = useTheme();

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%',
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#ec4899" /> Risk Heatmap
        </h3>
      </div>
      
      <div style={{ flex: 1, minHeight: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={Array.isArray(data) && data.length > 0 ? data : [{ name: 'N/A', value: 1, color: '#94a3b8' }]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: 'var(--text-color)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
