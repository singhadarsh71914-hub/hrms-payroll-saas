import api from './api';

export const getEmployees = async () => {
  const response = await api.get('/employees');
  return response.data;
};

export const getEmployee = async (id: string) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData: any) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

export const updateEmployee = async (id: string, employeeData: any) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id: string) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('/org/departments');
  return response.data;
};

export const getDesignations = async () => {
  const response = await api.get('/org/designations');
  return response.data;
};
