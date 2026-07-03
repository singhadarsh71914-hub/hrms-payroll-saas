import api from './api';
import { setToken, setUserLocal, clearAuth, getUser } from '../utils/auth';

export const login = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.accessToken) {
    setToken(response.data.accessToken);
    setUserLocal(response.data.user);
  }
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = async () => {
  clearAuth();
  
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Logout error', err);
  }
};

export const getCurrentUser = () => {
  return getUser();
};
