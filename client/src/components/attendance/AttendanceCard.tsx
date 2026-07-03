import { motion } from 'framer-motion';
import { Clock, UserPlus, Camera, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AttendanceStatusBadge from './AttendanceStatusBadge';
import AttendanceTimer from './AttendanceTimer';

interface AttendanceCardProps {
  session: any;
  duration: number;
  data: any;
  todayAttendance: any;
  setEnrollmentMode: (val: boolean) => void;
  setShowCamera: (val: boolean) => void;
  initiateAttendance: (type: 'IN' | 'OUT') => void;
}

export default function AttendanceCard({
  session,
  duration,
  data,
  todayAttendance,
  setEnrollmentMode,
  setShowCamera,
  initiateAttendance
}: AttendanceCardProps) {
  const { isDark } = useTheme();

  const status = session?.checkOut ? 'COMPLETED' : (session?.checkedIn ? 'ACTIVE' : 'PENDING');

  return (
    <motion.div whileHover={{ y: -5 }} className="premium-card" style={{ 
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="#3b82f6" /> Today's Attendance
        </h3>
        <AttendanceStatusBadge status={status} />
      </div>

      <AttendanceTimer durationSeconds={duration} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
        <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Check In</div>
          <div style={{ fontWeight: 700, color: '#10b981', fontSize: '1.125rem' }}>{session?.checkIn ? new Date(session.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
        </div>
        <div style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Check Out</div>
          <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.125rem' }}>{session?.checkOut ? new Date(session.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {!data?.employee?.face_enrolled_at ? (
           <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(to right, #3b82f6, #2563eb)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }} onClick={() => { setEnrollmentMode(true); setShowCamera(true); }}>
             <UserPlus size={18} /> Enroll Face ID to Check In
           </motion.button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: todayAttendance?.check_in ? 'rgba(16,185,129,0.1)' : 'linear-gradient(to right, #10b981, #059669)', color: todayAttendance?.check_in ? '#10b981' : '#fff', border: todayAttendance?.check_in ? '1px solid #10b981' : 'none', borderRadius: '12px', boxShadow: todayAttendance?.check_in ? 'none' : '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }} onClick={() => initiateAttendance('IN')} disabled={!!todayAttendance?.check_in}>
              <Camera size={18} /> {todayAttendance?.check_in ? 'Checked In' : 'Check In'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn" style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'rgba(239,68,68,0.1)' : 'linear-gradient(to right, #ef4444, #dc2626)', color: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '#ef4444' : '#fff', border: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? '1px solid #ef4444' : 'none', borderRadius: '12px', boxShadow: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 'none' : '0 4px 14px 0 rgba(239, 68, 68, 0.39)', opacity: (!todayAttendance?.check_in || !!todayAttendance?.check_out) ? 0.5 : 1 }} onClick={() => initiateAttendance('OUT')} disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}>
              <LogOut size={18} /> Check Out
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
