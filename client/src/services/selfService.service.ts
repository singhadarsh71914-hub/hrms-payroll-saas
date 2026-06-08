import api from './api';

export const getEmployeeDashboard = async () => {
  const response = await api.get('/self-service/dashboard');
  return response.data;
};

export const getMyPayslips = async () => {
  const response = await api.get('/self-service/payslips');
  return response.data;
};

export const downloadPayslip = async (payslipId: string) => {
  return api.get(`/self-service/payslips/${payslipId}/download`, {
    responseType: 'blob',
  });
};

export const getMyLeaves = async () => {
  const response = await api.get('/self-service/leaves');
  return response.data;
};

export const applyLeave = async (data: { leaveType: string; startDate: string; endDate: string; reason?: string }) => {
  const response = await api.post('/self-service/leaves', data);
  return response.data;
};

export const setPassword = async (data: { token: string; password: string }) => {
  const response = await api.post('/auth/set-password', data);
  return response.data;
};
