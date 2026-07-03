export const getToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('accessToken');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const getUser = (): any | null => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setUserLocal = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUserLocal = (): void => {
  localStorage.removeItem('user');
};

export const clearAuth = (): void => {
  removeToken();
  removeUserLocal();
};
