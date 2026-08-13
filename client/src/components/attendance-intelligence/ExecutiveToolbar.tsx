import { motion } from 'framer-motion';
import { Calendar, Download, RefreshCw, Maximize, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ExecutiveToolbar() {
  const { isDark } = useTheme();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="premium-card" 
      style={{ 
        position: 'sticky', top: '16px', zIndex: 100, 
        padding: '10px 20px', marginBottom: '24px', display: 'flex', 
        justifyContent: 'space-between', alignItems: 'center', 
        background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)', 
        backdropFilter: 'blur(12px)', 
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
        boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))' 
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--spacing-sm, 8px)', alignItems: 'center' }}>
        <Calendar size={18} color="var(--text-muted)" />
        <select style={{ 
          background: 'transparent', border: 'none', color: 'var(--text-color)', 
          fontWeight: 600, fontSize: 'var(--font-base, 14px)', outline: 'none', cursor: 'pointer' 
        }}>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: 'none', 
          padding: 'var(--spacing-sm, 8px)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex' 
        }}>
          <RefreshCw size={16} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: 'none', 
          padding: 'var(--spacing-sm, 8px)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex' 
        }}>
          <Download size={16} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: 'none', 
          padding: 'var(--spacing-sm, 8px)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex' 
        }}>
          <FileText size={16} />
        </motion.button>
        <div style={{ width: '1px', height: '20px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ 
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: 'none', 
          padding: 'var(--spacing-sm, 8px)', borderRadius: 'var(--radius-md)', color: 'var(--text-color)', cursor: 'pointer', display: 'flex' 
        }}>
          <Maximize size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}
