import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import knowledgeApi from '../api/knowledgeApi';
import { toast } from 'react-toastify';

const StarRating = ({ value, onChange, readonly }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readonly && onChange(star)}
        className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} ${!readonly ? 'hover:text-yellow-500 cursor-pointer' : 'cursor-default'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const KnowledgeArticlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(null);
  const [ratingForm, setRatingForm] = useState({ rating: 0, feedback: '' });
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadArticle();
    loadAverageRating();
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const response = await knowledgeApi.getById(id);
      setArticle(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load article:', error);
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const loadAverageRating = async () => {
    try {
      const response = await knowledgeApi.getAverageRating(id);
      setAverageRating(response.data.data ?? response.data ?? null);
    } catch {
      // no ratings yet — silent
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingForm.rating) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmittingRating(true);
    try {
      await knowledgeApi.createRating({
        articleId: id,
        rating: ratingForm.rating,
        feedback: ratingForm.feedback || undefined,
      });
      toast.success('Rating submitted!');
      setRatingForm({ rating: 0, feedback: '' });
      loadAverageRating();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Article not found</p>
            <button
              onClick={() => navigate('/knowledge')}
              className="mt-4 text-blue-500 hover:underline"
            >
              Back to Knowledge Base
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/knowledge')}
          className="mb-4 text-blue-500 hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Knowledge Base
        </button>

        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(article.status)}`}>
                  {article.status}
                </span>
                {article.category && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {article.category?.categoryName || article.category}
                  </span>
                )}
                <span className="text-gray-500 text-sm">Version {article.version || 1}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">{article.title}</h1>
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>Article ID: {article.articleId}</span>
            <span>•</span>
            <span>Created: {new Date(article.createdAt).toLocaleDateString()}</span>
            {article.updatedAt !== article.createdAt && (
              <>
                <span>•</span>
                <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="prose max-w-none">
            {article.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-gray-700 mb-4 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        {article.tags && article.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                >
                  #{tag?.tagName || tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {article.attachments && article.attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    {attachment.type?.includes('image') ? (
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : attachment.type?.includes('pdf') ? (
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{attachment.fileName || attachment.name}</p>
                    <p className="text-sm text-gray-500">{attachment.fileSize || 'Unknown size'}</p>
                  </div>
                  <a
                    href={attachment.url || attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Information */}
        {article.ticketId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Related Information</h2>
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">This article was generated from:</span>
              <button
                onClick={() => navigate(`/tickets/${article.ticketId}`)}
                className="text-blue-500 hover:underline"
              >
                Ticket {article.ticketId}
              </button>
            </div>
          </div>
        )}

        {/* Rating Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Rate this Article</h2>
          {averageRating !== null && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating value={Math.round(averageRating)} readonly />
              <span className="text-gray-600 text-sm">{Number(averageRating).toFixed(1)} average</span>
            </div>
          )}
          <form onSubmit={handleRatingSubmit}>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-2">Your Rating</label>
              <StarRating
                value={ratingForm.rating}
                onChange={(star) => setRatingForm({ ...ratingForm, rating: star })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Feedback (optional)</label>
              <textarea
                value={ratingForm.feedback}
                onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your thoughts on this article..."
              />
            </div>
            <button
              type="submit"
              disabled={submittingRating || !ratingForm.rating}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
            >
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticlePage;
