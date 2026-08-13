import { motion } from 'framer-motion';
import { MapPin, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LocationCardProps {
  todayAttendance: any;
}

export default function LocationCard({ todayAttendance }: LocationCardProps) {
  const { isDark } = useTheme();

  return (
    <motion.div whileHover={{ y: -2 }} className="premium-card" style={{ 
        height: '100%',
        background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
        backdropFilter: 'blur(10px)', 
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
        boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="#0ea5e9" /> Location Intelligence
          </h3>
        </div>

        {todayAttendance?.location_verified ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: 'var(--radius-md)', color: '#0ea5e9' }}>
                <Monitor size={16} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-base, 14px)', fontWeight: 600 }}>
                  {todayAttendance.inside_geofence ? 'Office HQ' : 'Remote Location'}
                </div>
                <div style={{ fontSize: 'var(--font-sm, 12px)', color: 'var(--text-muted)' }}>
                  {todayAttendance.check_in_address || 'Coordinates securely logged'}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', 
              fontSize: 'var(--font-base, 14px)', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', 
              padding: '0.75rem', borderRadius: 'var(--radius-md)' 
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Distance:</span>{' '}
                <span style={{ fontWeight: 600 }}>
                  {todayAttendance.distance_from_office ? `${Math.round(todayAttendance.distance_from_office)}m` : 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Accuracy:</span>{' '}
                <span style={{ fontWeight: 600 }}>
                  {todayAttendance.check_in_accuracy ? `${Math.round(todayAttendance.check_in_accuracy)}m` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: 'var(--font-base, 14px)' }}>
            Location pending verification... Check in to start capturing GPS data.
          </div>
        )}
    </motion.div>
  );
}
