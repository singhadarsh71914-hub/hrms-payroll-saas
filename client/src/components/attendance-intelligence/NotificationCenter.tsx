import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, ShieldAlert, MapPin, Fingerprint, Activity, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface NotificationCenterProps {
  recentEvents: any[];
}

interface Notification {
  id: string;
  category: 'Attendance' | 'GPS' | 'Face Verification' | 'Risk Alerts' | 'System Alerts';
  message: string;
  time: Date;
  read: boolean;
}

const NotificationCenter = React.memo(function NotificationCenter({ recentEvents }: NotificationCenterProps) {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    console.log('NotificationCenter mounted');
    return () => console.log('NotificationCenter unmounted');
  }, []);

  // Convert incoming events to notifications
  useEffect(() => {
    if (recentEvents.length > 0) {
      const latest = recentEvents[0];
      let category: Notification['category'] = 'System Alerts';
      let message = 'New system event';

      if (latest.type === 'CHECK_IN' || latest.type === 'CHECK_OUT') {
        category = 'Attendance';
        message = `Employee ${latest.data.employeeId} ${latest.type.toLowerCase().replace('_', ' ')}`;
      } else if (latest.type === 'RISK_ALERT') {
        category = 'Risk Alerts';
        message = `High risk anomaly for ${latest.data.employeeId} (Score: ${latest.data.trustScore})`;
      }

      setNotifications(prev => {
        const latestTime = new Date(latest.time).valueOf();
        const isDuplicate = prev.some(n => n.id === latest.id || (n.message === message && new Date(n.time).valueOf() === latestTime));
        if (isDuplicate) return prev;
        
        return [{
          id: latest.id || Date.now().toString(),
          category,
          message,
          time: latest.time,
          read: false
        }, ...prev].slice(0, 50);
      });
    }
  }, [recentEvents]);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Attendance': return <Activity size={16} color="#3b82f6" />;
      case 'GPS': return <MapPin size={16} color="#f59e0b" />;
      case 'Face Verification': return <Fingerprint size={16} color="#8b5cf6" />;
      case 'Risk Alerts': return <ShieldAlert size={16} color="#ef4444" />;
      default: return <Terminal size={16} color="#10b981" />;
    }
  };

  return (
    <div className="premium-card" style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '400px',
      background: isDark ? 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', 
      backdropFilter: 'blur(10px)', 
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', 
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
    }}>
      <div style={{ padding: '20px 24px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="#3b82f6" /> Notification Center
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>
              {unreadCount} New
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {notifications.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>All caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {notifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => markRead(notif.id)}
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    background: notif.read ? 'transparent' : (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'),
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getIcon(notif.category)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{notif.category}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {(() => {
                          const d = new Date(notif.time);
                          return isNaN(d.valueOf()) ? 'Unknown Time' : d.toLocaleTimeString();
                        })()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: notif.read ? 'var(--text-muted)' : 'var(--text-color)' }}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }} />}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
});

export default NotificationCenter;
