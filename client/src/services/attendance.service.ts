import api from './api';

export const attendanceService = {
  markAttendance: async (data: { employeeId: string; date: string; status: string; remarks?: string }) => {
    try {
      const response = await api.post('/attendance/mark', data);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Internal Server Error');
    }
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
