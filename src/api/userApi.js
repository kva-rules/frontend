import apiClient from './axiosConfig';

export const userApi = {
  getById: (id) => apiClient.get(`/users/${id}`),
  getAll: () => apiClient.get('/users'),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
};

export default userApi;
