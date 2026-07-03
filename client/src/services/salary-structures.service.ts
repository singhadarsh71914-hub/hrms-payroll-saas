import api from './api';

export const getSalaryStructures = async () => {
  const res = await api.get('/salary-structures');
  return res.data;
};

export const getSalaryStructure = async (id: string) => {
  const res = await api.get(`/salary-structures/${id}`);
  return res.data;
};

export const createSalaryStructure = async (data: any) => {
  const res = await api.post('/salary-structures', data);
  return res.data;
};

export const updateSalaryStructure = async (id: string, data: any) => {
  const res = await api.put(`/salary-structures/${id}`, data);
  return res.data;
};

export const deleteSalaryStructure = async (id: string) => {
  const res = await api.delete(`/salary-structures/${id}`);
  return res.data;
};

export const duplicateSalaryStructure = async (id: string) => {
  const res = await api.post(`/salary-structures/${id}/duplicate`);
  return res.data;
};

export const assignSalaryStructure = async (id: string, data: { employeeIds: string[], effectiveFrom: string }) => {
  const res = await api.post(`/salary-structures/${id}/assign`, data);
  return res.data;
};
