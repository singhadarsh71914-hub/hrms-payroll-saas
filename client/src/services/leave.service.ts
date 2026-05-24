import api from './api';

export interface LeaveBalance {
  id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  balance_days: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  employee?: {
    first_name: string;
    last_name: string;
    employee_code: string;
  };
}

export const leaveService = {
  getBalances: async () => {
    const response = await api.get('/leave/balances');
    return response.data;
  },
  getRequests: async () => {
    const response = await api.get('/leave/requests');
    return response.data;
  },
  applyLeave: async (data: { leaveType: string, startDate: string, endDate: string, reason?: string, employeeId?: string }) => {
    const response = await api.post('/leave/apply', data);
    return response.data;
  },
  updateStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const response = await api.patch(`/leave/requests/${requestId}/status`, { status });
    return response.data;
  }
};
