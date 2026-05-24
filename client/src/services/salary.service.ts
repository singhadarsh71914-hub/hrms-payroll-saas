import api from './api';

export const salaryService = {
  getRevisionHistory: async (employeeId: string) => {
    const response = await api.get(`/salary/history/${employeeId}`);
    return response.data;
  },

  reviseSalary: async (data: {
    employeeId: string;
    ctcAnnual: number;
    effectiveFrom: string;
    reason: string;
  }) => {
    const response = await api.post('/salary/revise', data);
    return response.data;
  }
};
