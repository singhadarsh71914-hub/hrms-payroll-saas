import api from './api';

export const getCompanyTaxSummary = async (financialYear: number) => {
  const response = await api.get(`/tax/summary/${financialYear}`);
  return response.data;
};

export const downloadForm16 = async (employeeId: string, financialYear: number) => {
  const response = await api.get(`/tax/form16/${employeeId}/${financialYear}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadBulkForm16 = async (financialYear: number) => {
  const response = await api.get(`/tax/form16/bulk/${financialYear}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const getMyTaxSummary = async (financialYear: number) => {
  const response = await api.get(`/tax/my-summary/${financialYear}`);
  return response.data;
};

export const downloadMyForm16 = async (financialYear: number) => {
  const response = await api.get(`/tax/my-form16/${financialYear}`, {
    responseType: 'blob'
  });
  return response.data;
};
