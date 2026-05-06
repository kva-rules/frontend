import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import solutionApi from '../api/solutionApi';
import { toast } from 'react-toastify';

const AdminApprovalQueuePage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadPending();
  }, [isAdmin]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const response = await solutionApi.getPending({ size: 50 });
      setSolutions(
        response.data?.data?.content ||
        response.data?.data ||
        response.data?.content ||
        []
      );
    } catch (error) {
      console.error('Failed to load pending solutions:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (solutionId) => {
    try {
      await solutionApi.approve(solutionId);
      toast.success('Solution approved! Knowledge article created.');
      loadPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve solution');
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setRejecting(true);
    try {
      await solutionApi.reject(rejectTarget, rejectReason.trim());
      toast.success('Solution rejected');
      setRejectTarget(null);
      setRejectReason('');
      loadPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject solution');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Approval Queue</h1>
            <p className="text-gray-500 mt-1">Solutions waiting for review</p>
          </div>
          <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-lg">
            {solutions.length} pending
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-40" />
            ))}
          </div>
        ) : solutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 text-lg font-medium">All caught up!</p>
            <p className="text-gray-400 text-sm mt-1">No solutions waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solutions.map((solution) => (
              <div key={solution.solutionId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 mr-4">
                    {solution.title && (
                      <h2 className="text-lg font-semibold text-gray-800 mb-1">{solution.title}</h2>
                    )}
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                      <span>
                        Ticket:{' '}
                        <button
                          onClick={() => navigate(`/tickets/${solution.ticketId}`)}
                          className="text-blue-500 hover:underline"
                        >
                          {solution.ticketId}
                        </button>
                      </span>
                      <span>·</span>
                      <span>By: {solution.submittedByEmail || solution.createdBy || 'Unknown'}</span>
                      <span>·</span>
                      <span>{new Date(solution.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 line-clamp-3">{solution.solutionContent}</p>
                  </div>
                  <div className="flex flex-col space-y-2 min-w-fit">
                    <button
                      onClick={() => navigate(`/solutions/${solution.solutionId}`)}
                      className="px-3 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 text-sm"
                    >
                      View Full
                    </button>
                    <button
                      onClick={() => handleApprove(solution.solutionId)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectTarget(solution.solutionId)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {solution.contributorIds && solution.contributorIds.length > 1 && (
                  <p className="text-xs text-gray-400 border-t pt-2 mt-2">
                    {solution.contributorIds.length} contributors
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Solution</h3>
            <form onSubmit={handleRejectConfirm}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Explain why this solution is being rejected..."
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovalQueuePage;
