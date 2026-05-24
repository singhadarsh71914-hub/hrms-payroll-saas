import api from './api';

export const attendanceService = {
  markAttendance: async (data: { employeeId: string; date: string; status: string; remarks?: string }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  getAttendanceReport: async (month: number, year: number) => {
    const response = await api.get('/attendance/report', { params: { month, year } });
    return response.data;
  },

  getMonthlySummary: async (month: number, year: number) => {
    const response = await api.get('/attendance/summary', { params: { month, year } });
    return response.data;
  }
};
