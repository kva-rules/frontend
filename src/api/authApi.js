import apiClient from './axiosConfig';

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  getAssignableUsers: () => apiClient.get('/auth/users'),
};

export default authApi;
