import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import solutionApi from '../api/solutionApi';
import { toast } from 'react-toastify';

const MySolutionsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    loadMySolutions();
  }, []);

  const loadMySolutions = async () => {
    setLoading(true);
    try {
      const response = await solutionApi.getMy({ size: 50 });
      setSolutions(
        response.data?.data?.content ||
        response.data?.data ||
        response.data?.content ||
        []
      );
    } catch (error) {
      console.error('Failed to load my solutions:', error);
      toast.error('Failed to load solutions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (solutionId) => {
    setSubmittingId(solutionId);
    try {
      await solutionApi.submit(solutionId);
      toast.success('Solution submitted for review!');
      loadMySolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit for review');
    } finally {
      setSubmittingId(null);
    }
  };

  const statusLabel = (status) => {
    if (status === 'UNDER_REVIEW') return 'Under Review';
    return status ? status.charAt(0) + status.slice(1).toLowerCase() : '';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filtered = filter === 'ALL'
    ? solutions
    : solutions.filter((s) => s.status === filter);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Solutions</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {solutions.length} total
          </span>
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'All' : statusLabel(status)}
                {status !== 'ALL' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({solutions.filter((s) => s.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-36" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500">
              {filter === 'ALL' ? 'You haven\'t submitted any solutions yet.' : `No ${statusLabel(filter).toLowerCase()} solutions.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((solution) => (
              <div key={solution.solutionId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(solution.status)}`}>
                        {statusLabel(solution.status)}
                      </span>
                      <button
                        onClick={() => navigate(`/tickets/${solution.ticketId}`)}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Ticket: {solution.ticketId}
                      </button>
                    </div>
                    {solution.title && (
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">{solution.title}</h2>
                    )}
                    <p className="text-gray-600 line-clamp-3">{solution.solutionContent}</p>
                    {solution.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                        <span className="font-medium">Rejected: </span>{solution.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 min-w-fit">
                    <button
                      onClick={() => navigate(`/solutions/${solution.solutionId}`)}
                      className="px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 text-sm"
                    >
                      View
                    </button>
                    {(solution.status === 'DRAFT' || solution.status === 'REJECTED') && (
                      <button
                        onClick={() => handleSubmitForReview(solution.solutionId)}
                        disabled={submittingId === solution.solutionId}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                      >
                        {submittingId === solution.solutionId ? '...' : 'Submit for Review'}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 border-t pt-2 mt-1">
                  Created: {new Date(solution.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySolutionsPage;
