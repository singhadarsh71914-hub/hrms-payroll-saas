import api from './api';

export const applyLoan = async (data: any) => {
  const response = await api.post('/loans/apply', data);
  return response.data;
};

export const getAllLoans = async (params?: any) => {
  const response = await api.get('/loans', { params });
  return response.data;
};

export const getMyLoans = async () => {
  const response = await api.get('/loans/my');
  return response.data;
};

export const getLoanDetails = async (id: string) => {
  const response = await api.get(`/loans/${id}`);
  return response.data;
};

export const approveLoan = async (id: string) => {
  const response = await api.put(`/loans/${id}/approve`);
  return response.data;
};

export const rejectLoan = async (id: string, remarks?: string) => {
  const response = await api.put(`/loans/${id}/reject`, { remarks });
  return response.data;
};

export const getLoanStats = async () => {
  const response = await api.get('/loans/stats');
  return response.data;
};
