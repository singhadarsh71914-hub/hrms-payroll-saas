import api from './api';

export interface DashboardStats {
  totalEmployees: number;
  pendingLeaveRequests: number;
  monthlyPayrollAmount: number;
  recentPayrollRuns: any[];
  recentLeaveRequests: any[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};
