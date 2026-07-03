import api from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export const NotificationService = {
  getNotifications: async (skip = 0, take = 20) => {
    try {
      const response = await api.get('/notifications', { params: { skip, take } });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || error.backendMessage || 'Failed to fetch notifications');
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      throw new Error(error.response?.data?.message || error.backendMessage || 'Failed to fetch unread count');
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.post('/notifications/read', { id });
      return response.data;
    } catch (error: any) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw new Error(error.response?.data?.message || error.backendMessage || 'Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || error.backendMessage || 'Failed to mark all notifications as read');
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting notification ${id}:`, error);
      throw new Error(error.response?.data?.message || error.backendMessage || 'Failed to delete notification');
    }
  }
};
