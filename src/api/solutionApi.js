import apiClient from './axiosConfig';

// Static solutions for demo
const STATIC_SOLUTIONS = {
  'TKT-001': [
    {
      solutionId: 'SOL-001',
      ticketId: 'TKT-001',
      solutionContent: 'The 401 error is caused by an expired JWT token. Clear your browser cookies and local storage, then try logging in again. If the issue persists, check if the token refresh endpoint is working correctly.',
      status: 'PENDING',
      submittedBy: 'static-user-1',
      submittedByEmail: 'melvinabi757@gmail.com',
      contributorIds: ['static-user-1'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'TKT-002': [
    {
      solutionId: 'SOL-002',
      ticketId: 'TKT-002',
      solutionContent: 'The slow loading is due to inefficient database queries. Implemented pagination and added indexes on frequently queried columns. Also enabled Redis caching for dashboard widgets.',
      status: 'PENDING',
      submittedBy: 'static-admin-1',
      submittedByEmail: 'abhidhabmellwynva@gmail.com',
      contributorIds: ['static-admin-1', 'static-user-1'],
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'TKT-003': [
    {
      solutionId: 'SOL-003',
      ticketId: 'TKT-003',
      solutionContent: 'Fixed the CSV export issue. The problem was a missing Content-Disposition header in the API response. Updated the backend to properly set headers and handle large file downloads with streaming.',
      status: 'APPROVED',
      submittedBy: 'static-admin-1',
      submittedByEmail: 'abhidhabmellwynva@gmail.com',
      contributorIds: ['static-admin-1'],
      approvedBy: 'static-admin-1',
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { fileName: 'fix-screenshot.png', fileSize: '156 KB', type: 'image/png', url: '#' },
        { fileName: 'code-changes.diff', fileSize: '8 KB', type: 'text/plain', url: '#' },
      ],
    },
    {
      solutionId: 'SOL-004',
      ticketId: 'TKT-003',
      solutionContent: 'Try using a different browser or disabling ad blockers.',
      status: 'REJECTED',
      submittedBy: 'user-123',
      submittedByEmail: 'john.doe@example.com',
      contributorIds: ['user-123'],
      rejectedBy: 'static-admin-1',
      rejectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'TKT-005': [
    {
      solutionId: 'SOL-005',
      ticketId: 'TKT-005',
      solutionContent: 'Investigating the crash. Initial analysis shows it\'s related to a null pointer exception in the splash screen initialization. Working on a fix that properly handles missing user preferences on first launch.',
      status: 'PENDING',
      submittedBy: 'static-user-1',
      submittedByEmail: 'melvinabi757@gmail.com',
      contributorIds: ['static-user-1', 'user-expert-1'],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// Helper to check if using static auth
const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

export const solutionApi = {
  getAll: (params) => {
    if (isStaticAuth()) {
      const allSolutions = Object.values(STATIC_SOLUTIONS).flat();
      return Promise.resolve({ data: { data: { content: allSolutions } } });
    }
    return apiClient.get('/solutions', { params });
  },
  getById: (id) => {
    if (isStaticAuth()) {
      const allSolutions = Object.values(STATIC_SOLUTIONS).flat();
      const solution = allSolutions.find(s => s.solutionId === id);
      return Promise.resolve({ data: { data: solution } });
    }
    return apiClient.get(`/solutions/${id}`);
  },
  getByTicketId: (ticketId) => {
    if (isStaticAuth()) {
      const solutions = STATIC_SOLUTIONS[ticketId] || [];
      return Promise.resolve({ data: { data: { content: solutions } } });
    }
    return apiClient.get(`/solutions/ticket/${ticketId}`);
  },
  create: (data) => apiClient.post('/solutions', data),
  update: (id, data) => apiClient.put(`/solutions/${id}`, data),
  submit: (id) => apiClient.patch(`/solutions/${id}/submit`),
  approve: (id) => apiClient.put(`/solutions/${id}/approve`),
  reject: (id, reason) => apiClient.put(`/solutions/${id}/reject`, { reason }),
  delete: (id) => apiClient.delete(`/solutions/${id}`),
  getMy: (params) => apiClient.get('/solutions/my', { params }),
  getPending: (params) => apiClient.get('/solutions/pending', { params }),
};

export default solutionApi;
