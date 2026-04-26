import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTicketById } from '../store/slices/ticketSlice';
import solutionApi from '../api/solutionApi';
import ticketApi from '../api/ticketApi';
import rewardApi from '../api/rewardApi';
import { toast } from 'react-toastify';

const TicketDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedTicket, loading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [solutions, setSolutions] = useState([]);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solutionForm, setSolutionForm] = useState({ title: '', solutionContent: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({ points: 25, reason: 'Manual award' });
  const [awardingReward, setAwardingReward] = useState(false);

  useEffect(() => {
    dispatch(fetchTicketById(id));
    loadSolutions();
  }, [dispatch, id]);

  const loadSolutions = async () => {
    try {
      const response = await solutionApi.getByTicketId(id);
      setSolutions(response.data?.content || response.data?.data?.content || response.data?.data || []);
    } catch (error) {
      console.error('Failed to load solutions:', error);
    }
  };

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await solutionApi.create({
        ticketId: id,
        title: solutionForm.title,
        solutionContent: solutionForm.solutionContent,
      });
      toast.success('Solution submitted successfully!');
      setShowSolutionForm(false);
      setSolutionForm({ title: '', solutionContent: '' });
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSolution = async (solutionId) => {
    try {
      await solutionApi.approve(solutionId);
      toast.success('Solution approved! Knowledge article will be auto-created and rewards distributed.');
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve solution');
    }
  };

  const handleRejectSolution = async (solutionId) => {
    try {
      await solutionApi.reject(solutionId);
      toast.success('Solution rejected');
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject solution');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ticketApi.updateStatus(id, newStatus);
      toast.success(`Ticket moved to ${newStatus}`);
      dispatch(fetchTicketById(id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAwardReward = async (e) => {
    e.preventDefault();
    setAwardingReward(true);
    try {
      const creatorId = selectedTicket?.createdBy;
      await rewardApi.awardPoints({
        userId: user.authUserId,
        points: Number(rewardForm.points),
        reason: rewardForm.reason,
        referenceId: id,
      });
      toast.success(`${rewardForm.points} points awarded!`);
      setShowRewardForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to award points');
    } finally {
      setAwardingReward(false);
    }
  };

  if (loading || !selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/tickets')} className="mb-4 text-blue-500 hover:underline">
          ← Back to Tickets
        </button>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800">{selectedTicket.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              selectedTicket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
              selectedTicket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              selectedTicket.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedTicket.status}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{selectedTicket.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className={`ml-2 px-2 py-1 rounded ${
                selectedTicket.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                selectedTicket.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                selectedTicket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedTicket.priority}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Difficulty:</span>
              <span className={`ml-2 px-2 py-1 rounded ${
                selectedTicket.difficultyLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                selectedTicket.difficultyLevel === 'HARD' ? 'bg-orange-100 text-orange-800' :
                selectedTicket.difficultyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedTicket.difficultyLevel}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created by:</span>
              <span className="ml-2">{selectedTicket.createdBy || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Admin actions: status change + reward */}
          {isAdmin && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Change status:</span>
                {selectedTicket.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    → In Progress
                  </button>
                )}
                {selectedTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    → Resolved
                  </button>
                )}
                {selectedTicket.status !== 'OPEN' && (
                  <button
                    onClick={() => handleStatusChange('OPEN')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    → Open
                  </button>
                )}
                <button
                  onClick={() => setShowRewardForm(!showRewardForm)}
                  className="ml-auto px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                >
                  Award Points
                </button>
              </div>

              {showRewardForm && (
                <form onSubmit={handleAwardReward} className="p-4 bg-purple-50 rounded-lg flex gap-3 items-end flex-wrap">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={rewardForm.points}
                      onChange={(e) => setRewardForm({ ...rewardForm, points: e.target.value })}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Reason</label>
                    <input
                      type="text"
                      value={rewardForm.reason}
                      onChange={(e) => setRewardForm({ ...rewardForm, reason: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={awardingReward}
                    className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50"
                  >
                    {awardingReward ? 'Awarding...' : 'Award'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRewardForm(false)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Solutions Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Solutions</h2>
            {!showSolutionForm && (
              <button
                onClick={() => setShowSolutionForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Submit Solution
              </button>
            )}
          </div>

          {showSolutionForm && (
            <form onSubmit={handleSolutionSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Solution Title</label>
                <input
                  type="text"
                  value={solutionForm.title}
                  onChange={(e) => setSolutionForm({ ...solutionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief title for your solution"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Solution Description</label>
                <textarea
                  value={solutionForm.solutionContent}
                  onChange={(e) => setSolutionForm({ ...solutionForm, solutionContent: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your solution in detail..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSolutionForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </button>
              </div>
            </form>
          )}

          {solutions.length === 0 ? (
            <p className="text-gray-500">No solutions submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {solutions.map((solution) => (
                <div key={solution.solutionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {solution.title && (
                        <h3 className="font-semibold text-gray-800 mb-1">{solution.title}</h3>
                      )}
                      <span className={`px-2 py-1 rounded text-sm ${
                        solution.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        solution.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {solution.status}
                      </span>
                    </div>
                    {isAdmin && solution.status === 'PENDING' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleApproveSolution(solution.solutionId)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectSolution(solution.solutionId)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 mt-2">{solution.solutionContent}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted: {new Date(solution.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
