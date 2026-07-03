import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface AttendanceStatusBadgeProps {
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ON_BREAK' | 'LATE';
}

export default function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  let config = {
    bg: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    label: 'PENDING',
    icon: null as any
  };

  if (status === 'ACTIVE') {
    config = { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', label: 'ACTIVE', icon: <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/> };
  } else if (status === 'COMPLETED') {
    config = { bg: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', label: 'CHECKED OUT', icon: <LogOut size={12} /> };
  } else if (status === 'ON_BREAK') {
    config = { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', label: 'ON BREAK', icon: null };
  } else if (status === 'LATE') {
    config = { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'LATE', icon: null };
  }

  return (
    <span style={{
      background: config.bg,
      color: config.color,
      fontSize: '0.75rem', 
      padding: '0.3rem 0.8rem', 
      borderRadius: '999px', 
      fontWeight: 'bold', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.4rem'
    }}>
      {config.icon} {config.label}
    </span>
  );
}
