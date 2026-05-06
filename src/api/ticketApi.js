import apiClient from './axiosConfig';

export const ticketApi = {
  getAll: (params) => apiClient.get('/tickets', { params }),
  getById: (id) => apiClient.get(`/tickets/${id}`),
  create: (data) => apiClient.post('/tickets', data),
  update: (id, data) => apiClient.put(`/tickets/${id}`, data),
  updateStatus: (id, status) => apiClient.put('/tickets/status', { ticketId: id, status }),
  search: (params) => apiClient.get('/tickets/search', { params }),
  assign: (id, assignedTo) => apiClient.post(`/tickets/${id}/assign`, { assignedTo }),
  getMy: (params) => apiClient.get('/tickets/my', { params }),
  rate: (id, rating, feedback) => apiClient.post(`/tickets/${id}/rate`, { rating, feedback }),
  delete: (id) => apiClient.delete(`/tickets/${id}`),
};

export default ticketApi;
