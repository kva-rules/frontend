import apiClient from './axiosConfig';

export const notificationApi = {
  getUserNotifications: (userId, params) => apiClient.get(`/notifications/users/${userId}`, { params }),
  getById: (id) => apiClient.get(`/notifications/${id}`),
  markAsRead: (id, userId) => apiClient.put(`/notifications/${id}/read`, null, { params: { userId } }),
  markAllAsRead: (userId) => apiClient.put(`/notifications/users/${userId}/read-all`),
  getUnreadCount: (userId) => apiClient.get(`/notifications/users/${userId}/unread-count`),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

export default notificationApi;
