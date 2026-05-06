import apiClient from './axiosConfig';

export const rewardApi = {
  getLeaderboard: (params) => apiClient.get('/rewards/leaderboard', { params }),
  getUserPoints: (userId) => apiClient.get(`/rewards/users/${userId}/points`),
  getUserTransactions: (userId, params) => apiClient.get(`/rewards/users/${userId}/transactions`, { params }),
  getContributions: (userId) => apiClient.get(`/rewards/users/${userId}/contributions`),
  getTopContributors: (params) => apiClient.get('/rewards/top-contributors', { params }),
  awardPoints: (data) => apiClient.post('/rewards/points', data),
  getUserBadges: (userId) => apiClient.get(`/rewards/users/${userId}/badges`),
  getAllBadges: () => apiClient.get('/rewards/badges'),
};

export default rewardApi;
