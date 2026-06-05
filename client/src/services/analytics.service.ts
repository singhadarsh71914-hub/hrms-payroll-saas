import api from './api';

export const getOverviewStats = async (range: string = '6m') => {
  const response = await api.get(`/analytics/overview?range=${range}`);
  return response.data;
};

export const getPayrollTrend = async (range: string = '6m') => {
  const response = await api.get(`/analytics/payroll-trend?range=${range}`);
  return response.data;
};

export const getHeadcountTrend = async (range: string = '6m') => {
  const response = await api.get(`/analytics/headcount?range=${range}`);
  return response.data;
};

export const getLeaveStats = async (range: string = '6m') => {
  const response = await api.get(`/analytics/leave-stats?range=${range}`);
  return response.data;
};

export const getAttendanceStats = async (range: string = '6m') => {
  const response = await api.get(`/analytics/attendance-stats?range=${range}`);
  return response.data;
};

export const getDepartmentStats = async (range: string = '6m') => {
  const response = await api.get(`/analytics/department-stats?range=${range}`);
  return response.data;
};

export const getLoanStats = async (range: string = '6m') => {
  const response = await api.get(`/analytics/loan-stats?range=${range}`);
  return response.data;
};

export const getTDSTrend = async (range: string = '6m') => {
  const response = await api.get(`/analytics/tds-trend?range=${range}`);
  return response.data;
};

export const getLeaveUtilization = async (range: string = '6m') => {
  const response = await api.get(`/analytics/leave-utilization?range=${range}`);
  return response.data;
};

export const getTopEmployees = async (range: string = '6m') => {
  const response = await api.get(`/analytics/top-employees?range=${range}`);
  return response.data;
};

export const getMiscWidgets = async (range: string = '6m') => {
  const response = await api.get(`/analytics/misc-widgets?range=${range}`);
  return response.data;
};

export const exportReport = async (range: string = '6m') => {
  const response = await api.get(`/analytics/export?range=${range}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  
  const month = new Date().toLocaleString('default', { month: 'short' });
  const year = new Date().getFullYear();
  link.setAttribute('download', `HRMS_Report_${month}_${year}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};
