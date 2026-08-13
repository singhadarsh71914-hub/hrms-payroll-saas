import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface FaceIdCardProps {
  employee: any;
  setEnrollmentMode: (val: boolean) => void;
  setShowCamera: (val: boolean) => void;
}

export default function FaceIdCard({ employee, setEnrollmentMode, setShowCamera }: FaceIdCardProps) {
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
            <Fingerprint size={18} color="#ec4899" /> Face ID Status
          </h3>
          {employee?.face_enrolled_at ? (
            <span style={{ color: 'var(--success)', fontSize: 'var(--font-sm, 12px)', fontWeight: 'bold' }}>✅ ACTIVE</span>
          ) : (
            <span style={{ color: 'var(--danger)', fontSize: 'var(--font-sm, 12px)', fontWeight: 'bold' }}>⚠ MISSING</span>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 'var(--font-base, 14px)', marginBottom: '1rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase' }}>Enrolled On</div>
            <div style={{ fontWeight: 600 }}>
              {employee?.face_enrolled_at ? new Date(employee.face_enrolled_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm, 12px)', textTransform: 'uppercase' }}>Confidence Base</div>
            <div style={{ fontWeight: 600 }}>
              {(employee?.biometric_enabled && Array.isArray(employee?.face_descriptor)) ? '99.8%' : '0%'}
            </div>
          </div>
        </div>

        {employee?.face_enrolled_at && (
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', fontSize: 'var(--font-sm, 12px)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }} 
            onClick={() => { 
              if (window.confirm('Are you sure you want to re-enroll your Face ID? This will overwrite your existing biometric template.')) { 
                setEnrollmentMode(true); 
                setShowCamera(true); 
              } 
            }}
          >
            Re-Enroll Face ID
          </button>
        )}
    </motion.div>
  );
}
