import api from './api';

export const getCompanySettings = async () => {
  const response = await api.get('/company');
  return response.data;
};

export const updateCompanySettings = async (data: any) => {
  const response = await api.put('/company', data);
  return response.data;
};
