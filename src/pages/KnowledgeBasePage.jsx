import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import knowledgeApi from '../api/knowledgeApi';
import { toast } from 'react-toastify';

const KnowledgeBasePage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', tags: '', visibility: 'PUBLIC' });
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER') || user?.role?.includes('ENGINEER');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const response = await knowledgeApi.getAll();
      setArticles(response.data.data?.content || response.data.data || response.data?.content || []);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadArticles();
      return;
    }
    setLoading(true);
    try {
      const response = await knowledgeApi.search({ keyword: searchTerm });
      setArticles(response.data.data?.content || response.data.data || response.data?.content || []);
    } catch (error) {
      console.error('Failed to search articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tags = createForm.tags ? createForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await knowledgeApi.create({
        title: createForm.title,
        content: createForm.content,
        tags,
        visibility: createForm.visibility,
      });
      toast.success('Knowledge article created!');
      setShowCreateForm(false);
      setCreateForm({ title: '', content: '', tags: '', visibility: 'PUBLIC' });
      loadArticles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create article');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Knowledge Base</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {showCreateForm ? 'Cancel' : '+ New Article'}
            </button>
          )}
        </div>

        {/* Create Article Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Knowledge Article</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Article title"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Content</label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Article content..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. vpn, network, auth"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Visibility</label>
                  <select
                    value={createForm.visibility}
                    onChange={(e) => setCreateForm({ ...createForm, visibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search articles..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-32"></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No articles found. Articles are auto-generated when solutions are approved.
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.articleId}
                onClick={() => navigate(`/knowledge/${article.articleId}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">{article.title}</h2>
                  <span className={`px-2 py-1 rounded text-sm ${
                    article.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    article.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {article.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{article.content}</p>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {article.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">#{tag?.tagName || tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Version: {article.version || 1}</span>
                  <span>Created: {new Date(article.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
