import apiClient from './axiosConfig';

export const ticketApi = {
  getAll: (params) => apiClient.get('/tickets', { params }),
  getById: (id) => apiClient.get(`/tickets/${id}`),
  create: (data) => apiClient.post('/tickets', data),
  update: (id, data) => apiClient.put(`/tickets/${id}`, data),
  updateStatus: (id, status) => apiClient.put('/tickets/status', { ticketId: id, status }),
  assign: (id, assigneeId) => apiClient.patch(`/tickets/${id}/assign`, { assigneeId }),
  delete: (id) => apiClient.delete(`/tickets/${id}`),
};

export default ticketApi;
