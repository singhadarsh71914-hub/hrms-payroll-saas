import api from './api';

export const getEmployees = async (includeInactive: boolean = false) => {
  const response = await api.get('/employees', { params: { include_inactive: includeInactive } });
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

export const restoreEmployee = async (id: string) => {
  const response = await api.post(`/employees/${id}/restore`);
  return response.data;
};

export const getEmployeeAttendance = async (id: string, month?: number, year?: number) => {
  const response = await api.get(`/employees/${id}/attendance`, { params: { month, year } });
  return response.data;
};

export const getEmployeeLeaves = async (id: string) => {
  const response = await api.get(`/employees/${id}/leaves`);
  return response.data;
};

export const getEmployeePayrolls = async (id: string) => {
  const response = await api.get(`/employees/${id}/payrolls`);
  return response.data;
};

export const getEmployeeDocuments = async (id: string) => {
  const response = await api.get(`/employees/${id}/documents`);
  return response.data;
};

export const getEmployeeLoans = async (id: string) => {
  const response = await api.get(`/employees/${id}/loans`);
  return response.data;
};

export const deleteEmployeeDocument = async (id: string) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const downloadEmployeeDocument = async (id: string) => {
  return api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  });
};

export const uploadEmployeeDocument = async (employeeId: string, formData: FormData) => {
  formData.append('employee_id', employeeId);
  const response = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const markEmployeeAttendance = async (data: any) => {
  const response = await api.post('/attendance/mark', data);
  return response.data;
};

export const applyEmployeeLeave = async (data: any) => {
  const response = await api.post('/leaves/apply', data);
  return response.data;
};

export const applyEmployeeLoan = async (data: any) => {
  const response = await api.post('/loans/apply', data);
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
