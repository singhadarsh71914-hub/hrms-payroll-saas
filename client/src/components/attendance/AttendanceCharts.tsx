import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface AttendanceChartsProps {
  attendanceSummary: any;
}

const AttendanceCharts = memo(({ attendanceSummary }: AttendanceChartsProps) => {
  const { isDark } = useTheme();

  // Mock data for weekly trend, replacing with simple math if we don't have historical arrays
  const chartData = [
    { name: 'Week 1', present: 5, absent: 0 },
    { name: 'Week 2', present: 4, absent: 1 },
    { name: 'Week 3', present: 5, absent: 0 },
    { name: 'Week 4', present: Math.max(0, Math.min(5, attendanceSummary.PRESENT - 14)), absent: 0 }
  ];

  return (
    <div style={{ height: '200px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis hide />
          <RechartsTooltip 
            cursor={{ fill: 'transparent' }} 
            contentStyle={{ 
              background: isDark ? '#1f2937' : '#fff', 
              border: 'none', 
              borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
            }} 
          />
          <Bar dataKey="present" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="absent" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

AttendanceCharts.displayName = 'AttendanceCharts';

export default AttendanceCharts;
