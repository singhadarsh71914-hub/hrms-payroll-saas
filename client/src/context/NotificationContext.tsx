import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { NotificationService } from '../services/notification.service';
import type { Notification } from '../services/notification.service';
import { getToken } from '../utils/auth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string, is_read: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = getToken();
    
    if (user && token) {
      // Connect Socket
      socketService.connect(token);
      const socket = socketService.getSocket();

      // Fetch initial state
      NotificationService.getUnreadCount().then(setUnreadCount).catch(console.error);
      NotificationService.getNotifications(0, 20).then(res => setNotifications(res.data)).catch(console.error);

      if (socket) {
        socket.on('notification:new', (data: any) => {
          if (data.type === 'REFRESH_REQUIRED') {
            NotificationService.getUnreadCount().then(setUnreadCount).catch(console.error);
            NotificationService.getNotifications(0, 20).then(res => setNotifications(res.data)).catch(console.error);
          } else if (data.id) {
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Toast Notifications based on event type
            switch (data.type) {
              case 'ANNOUNCEMENT_PUBLISHED':
                toast(`📢 New Announcement: ${data.title}`);
                break;
              case 'LEAVE_APPROVED':
                toast.success(`✅ Leave Approved: ${data.title}`);
                break;
              case 'LEAVE_REJECTED':
                toast.error(`❌ Leave Rejected: ${data.title}`);
                break;
              case 'LOAN_APPROVED':
                toast.success(`💰 Loan Approved: ${data.title}`);
                break;
              case 'LOAN_REJECTED':
                toast.error(`❌ Loan Rejected: ${data.title}`);
                break;
              case 'PAYSLIP_GENERATED':
                toast(`📄 Payslip Generated: ${data.title}`);
                break;
              case 'PAYROLL_PROCESSED':
                toast(`💵 Payroll Processed: ${data.title}`);
                break;
              case 'LEAVE_APPLIED':
                toast(`📝 Leave Applied: ${data.title}`);
                break;
              default:
                toast(`🔔 ${data.title}`);
                break;
            }
          }
        });
      }

      return () => {
        if (socket) {
          socket.off('notification:new');
        }
        socketService.disconnect();
      };
    } else {
      socketService.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return;
    try {
      await NotificationService.markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, setNotifications, setUnreadCount, markAllAsRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
