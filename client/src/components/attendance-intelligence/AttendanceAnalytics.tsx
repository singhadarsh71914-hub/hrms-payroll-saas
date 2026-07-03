import { useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AttendanceAnalytics = React.memo(function AttendanceAnalytics({ chartData, stats: propStats }: { chartData?: any[], stats?: any }) {
  const { isDark } = useTheme();
  const [view, setView] = useState<'Week' | 'Month' | 'Quarter'>('Week');
  
  const data = chartData || [];
  const stats = propStats || { avgTrust: 0, avgLate: 0, overtime: 0 };

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%',
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#8b5cf6" /> Attendance Analytics
        </h3>
        
        <div style={{ display: 'flex', background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
          {['Week', 'Month', 'Quarter'].map(v => (
            <button 
              key={v}
              onClick={() => setView(v as any)}
              style={{
                padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: view === v ? (isDark ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
                color: view === v ? 'var(--text-color)' : 'var(--text-muted)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.length > 0 ? data : [{ name: 'N/A', attendance: 0, remote: 0 }]}>
            <defs>
              <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="attendance" name="Attendance %" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
            <Area type="monotone" dataKey="remote" name="Remote %" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRem)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Trust</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{stats.avgTrust}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Late</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{stats.avgLate}%</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overtime</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>{stats.overtime} hrs</div>
        </div>
      </div>
    </motion.div>
  );
});

export default AttendanceAnalytics;
