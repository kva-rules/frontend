import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import solutionApi from '../api/solutionApi';
import { toast } from 'react-toastify';

const SolutionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSolution();
  }, [id]);

  const loadSolution = async () => {
    setLoading(true);
    try {
      const response = await solutionApi.getById(id);
      setSolution(response.data.data);
    } catch (error) {
      console.error('Failed to load solution:', error);
      toast.error('Failed to load solution');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await solutionApi.approve(id);
      toast.success('Solution approved! Knowledge article created.');
      loadSolution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve solution');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setRejecting(true);
    try {
      await solutionApi.reject(id, rejectReason.trim());
      toast.success('Solution rejected');
      setShowRejectModal(false);
      setRejectReason('');
      loadSolution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject solution');
    } finally {
      setRejecting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await solutionApi.submit(id);
      toast.success('Solution submitted for review!');
      loadSolution();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusLabel = (status) => {
    if (status === 'UNDER_REVIEW') return 'Under Review';
    return status ? status.charAt(0) + status.slice(1).toLowerCase() : '';
  };

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');
  const isOwner = solution && (
    solution.createdBy === (user?.email || user?.userId) ||
    solution.submittedByEmail === user?.email
  );
  const canSubmit = (isOwner || isAdmin) &&
    (solution?.status === 'DRAFT' || solution?.status === 'REJECTED');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Solution not found</p>
            <button
              onClick={() => navigate('/solutions')}
              className="mt-4 text-blue-500 hover:underline"
            >
              Back to Solutions
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
          onClick={() => navigate('/solutions')}
          className="mb-4 text-blue-500 hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Solutions
        </button>

        {/* Solution Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadge(solution.status)}`}>
                  {statusLabel(solution.status)}
                </span>
                <span className="text-gray-500">Solution ID: {solution.solutionId}</span>
              </div>
              <button
                onClick={() => navigate(`/tickets/${solution.ticketId}`)}
                className="text-blue-500 hover:underline text-sm"
              >
                View Related Ticket: {solution.ticketId}
              </button>
            </div>
            <div className="flex space-x-2">
              {canSubmit && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
              {isAdmin && solution.status === 'UNDER_REVIEW' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rejection reason banner */}
        {solution.status === 'REJECTED' && solution.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
            <p className="text-red-600">{solution.rejectionReason}</p>
          </div>
        )}

        {/* Solution Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Solution Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{solution.solutionContent}</p>
          </div>
        </div>

        {/* Attachments Section */}
        {solution.attachments && solution.attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solution.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{attachment.fileName || attachment.name}</p>
                    <p className="text-sm text-gray-500">{attachment.fileSize || 'Unknown size'}</p>
                  </div>
                  <a
                    href={attachment.url || attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
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

        {/* Meta Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Submitted By</p>
              <p className="font-medium text-gray-800">{solution.submittedByEmail || solution.submittedBy || solution.createdBy || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Submitted At</p>
              <p className="font-medium text-gray-800">{new Date(solution.createdAt).toLocaleString()}</p>
            </div>
            {solution.contributorIds && solution.contributorIds.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-2">Contributors</p>
                <div className="flex flex-wrap gap-2">
                  {solution.contributorIds.map((contributorId, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {contributorId}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {solution.status === 'APPROVED' && solution.approvedAt && (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Approved By</p>
                  <p className="font-medium text-green-700">{solution.approvedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Approved At</p>
                  <p className="font-medium text-green-700">{new Date(solution.approvedAt).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Solution</h3>
            <form onSubmit={handleRejectSubmit}>
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
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
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

export default SolutionDetailPage;
