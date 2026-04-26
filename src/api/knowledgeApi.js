import apiClient from './axiosConfig';

// Static knowledge base articles for demo
const STATIC_ARTICLES = [
  {
    articleId: 'KB-001',
    title: 'How to Reset Your Password',
    content: 'If you have forgotten your password, follow these steps:\n\n1. Click on the "Forgot Password" link on the login page\n2. Enter your registered email address\n3. Check your inbox for the password reset link\n4. Click the link and create a new password\n5. Use your new password to login\n\nNote: The reset link expires after 24 hours. If you don\'t receive the email, check your spam folder.',
    status: 'PUBLISHED',
    version: 2,
    category: 'Authentication',
    tags: ['password', 'login', 'reset', 'security'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    articleId: 'KB-002',
    title: 'Troubleshooting Dashboard Performance Issues',
    content: 'If your dashboard is loading slowly, try these solutions:\n\n1. Clear your browser cache and cookies\n2. Disable browser extensions temporarily\n3. Check your internet connection speed\n4. Reduce the number of widgets on your dashboard\n5. Try using a different browser\n\nIf the issue persists, please create a support ticket with details about your browser version and operating system.',
    status: 'PUBLISHED',
    version: 1,
    category: 'Performance',
    tags: ['dashboard', 'performance', 'slow', 'troubleshooting'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    articleId: 'KB-003',
    title: 'How to Export Data to CSV',
    content: 'To export your data to CSV format:\n\n1. Navigate to the data view you want to export\n2. Click the "Export" button in the top right corner\n3. Select "CSV" from the format dropdown\n4. Choose the columns you want to include\n5. Click "Download"\n\nThe file will be downloaded to your default downloads folder. Large exports may take a few minutes to process.',
    status: 'PUBLISHED',
    version: 3,
    category: 'Features',
    tags: ['export', 'csv', 'data', 'download'],
    attachments: [
      { fileName: 'export-guide.pdf', fileSize: '245 KB', type: 'application/pdf', url: '#' },
      { fileName: 'sample-export.csv', fileSize: '12 KB', type: 'text/csv', url: '#' },
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    articleId: 'KB-004',
    title: 'Understanding User Roles and Permissions',
    content: 'The system has two main user roles:\n\n**USER Role:**\n- Create and view tickets\n- Submit solutions to tickets\n- View knowledge base articles\n- Earn points for approved solutions\n\n**ADMIN Role:**\n- All USER permissions\n- Assign tickets to users\n- Approve or reject solutions\n- Manage knowledge base articles\n- View all user activities\n\nContact your administrator if you need role changes.',
    status: 'PUBLISHED',
    version: 1,
    category: 'Administration',
    tags: ['roles', 'permissions', 'admin', 'user'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    articleId: 'KB-005',
    title: 'Mobile App Installation Guide',
    content: 'To install the mobile app:\n\n**For Android:**\n1. Open Google Play Store\n2. Search for "Ticketing System"\n3. Tap Install\n4. Open the app and login with your credentials\n\n**For iOS:**\n1. Open App Store\n2. Search for "Ticketing System"\n3. Tap Get/Install\n4. Open the app and login\n\nMinimum requirements: Android 8.0+ or iOS 13.0+',
    status: 'DRAFT',
    version: 1,
    category: 'Mobile',
    tags: ['mobile', 'app', 'installation', 'android', 'ios'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to check if using static auth
const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

export const knowledgeApi = {
  getAll: (params) => {
    if (isStaticAuth()) {
      return Promise.resolve({ data: { data: { content: STATIC_ARTICLES } } });
    }
    return apiClient.get('/knowledge', { params });
  },
  getById: (id) => {
    if (isStaticAuth()) {
      const article = STATIC_ARTICLES.find(a => a.articleId === id);
      return Promise.resolve({ data: { data: article } });
    }
    return apiClient.get(`/knowledge/${id}`);
  },
  search: (params) => {
    if (isStaticAuth()) {
      const keyword = params?.keyword?.toLowerCase() || '';
      const filtered = STATIC_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(keyword) ||
        a.content.toLowerCase().includes(keyword) ||
        a.tags.some(t => t.toLowerCase().includes(keyword))
      );
      return Promise.resolve({ data: { data: { content: filtered } } });
    }
    return apiClient.get('/knowledge/search', { params });
  },
  create: (data) => apiClient.post('/knowledge', data),
  update: (id, data) => apiClient.put(`/knowledge/${id}`, data),
  delete: (id) => apiClient.delete(`/knowledge/${id}`),
  createRating: (data) => apiClient.post('/ratings', data),
  getAverageRating: (articleId) => apiClient.get(`/ratings/article/${articleId}/average`),
};

export default knowledgeApi;
