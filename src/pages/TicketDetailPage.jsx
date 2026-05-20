import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTicketById } from '../store/slices/ticketSlice';
import solutionApi from '../api/solutionApi';
import ticketApi from '../api/ticketApi';
import rewardApi from '../api/rewardApi';
import authApi from '../api/authApi';
import { toast } from 'react-toastify';
import SlaDeadline from '../components/SlaDeadline';

const TicketDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedTicket, loading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [solutions, setSolutions] = useState([]);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [solutionForm, setSolutionForm] = useState({ title: '', solutionContent: '', articleTitle: '', articleContent: '', codeSnippet: '', codeLanguage: 'javascript' });
  const [solutionFiles, setSolutionFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({ points: 25, reason: 'Manual award' });
  const [awardingReward, setAwardingReward] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [users, setUsers] = useState([]);
  const [assignedSolutionForm, setAssignedSolutionForm] = useState({ title: '', solutionContent: '', codeSnippet: '', codeLanguage: 'javascript' });
  const [assignedFiles, setAssignedFiles] = useState([]);
  const [submittingAssigned, setSubmittingAssigned] = useState(false);
  const [csatRating, setCsatRating] = useState(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [submittingCsat, setSubmittingCsat] = useState(false);
  const [csatDone, setCsatDone] = useState(false);

  useEffect(() => {
    dispatch(fetchTicketById(id));
    loadSolutions();
    loadUsers();
  }, [dispatch, id]);

  const loadUsers = async () => {
    try {
      const response = await authApi.getAssignableUsers();
      setUsers(response.data?.data || []);
    } catch {
      // users list is optional — silently fail
    }
  };

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
      const res = await solutionApi.create({
        ticketId: id,
        title: solutionForm.title,
        solutionContent: solutionForm.solutionContent,
        articleTitle: solutionForm.articleTitle || undefined,
        articleContent: solutionForm.articleContent || undefined,
        codeSnippet: solutionForm.codeSnippet || undefined,
        codeLanguage: solutionForm.codeSnippet ? solutionForm.codeLanguage : undefined,
      });
      const newId = res.data?.data?.solutionId || res.data?.solutionId;
      if (newId && solutionFiles.length > 0) {
        await Promise.allSettled(solutionFiles.map(f => solutionApi.uploadAttachment(newId, f)));
      }
      toast.success('Solution saved as draft. Submit it for review when ready.');
      setShowSolutionForm(false);
      setSolutionForm({ title: '', solutionContent: '', articleTitle: '', articleContent: '', codeSnippet: '', codeLanguage: 'javascript' });
      setSolutionFiles([]);
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
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject solution');
    } finally {
      setRejecting(false);
    }
  };

  const handleSubmitForReview = async (solutionId) => {
    setSubmittingReview(solutionId);
    try {
      await solutionApi.submit(solutionId);
      toast.success('Solution submitted for review!');
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit for review');
    } finally {
      setSubmittingReview(null);
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

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTo.trim()) return;
    setAssigning(true);
    try {
      await ticketApi.assign(id, assignTo.trim());
      toast.success(`Ticket assigned to ${assignTo}`);
      setAssignTo('');
      dispatch(fetchTicketById(id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign ticket');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignedSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!assignedSolutionForm.title.trim() || !assignedSolutionForm.solutionContent.trim()) return;
    setSubmittingAssigned(true);
    try {
      const createRes = await solutionApi.create({
        ticketId: id,
        title: assignedSolutionForm.title,
        solutionContent: assignedSolutionForm.solutionContent,
        codeSnippet: assignedSolutionForm.codeSnippet || undefined,
        codeLanguage: assignedSolutionForm.codeSnippet ? assignedSolutionForm.codeLanguage : undefined,
      });
      const newId = createRes.data?.data?.solutionId || createRes.data?.solutionId;
      if (newId && assignedFiles.length > 0) {
        await Promise.allSettled(assignedFiles.map(f => solutionApi.uploadAttachment(newId, f)));
      }
      await solutionApi.submit(newId);
      toast.success('Solution submitted for review!');
      setAssignedSolutionForm({ title: '', solutionContent: '', codeSnippet: '', codeLanguage: 'javascript' });
      setAssignedFiles([]);
      loadSolutions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit solution');
    } finally {
      setSubmittingAssigned(false);
    }
  };

  const handleCsatSubmit = async (e) => {
    e.preventDefault();
    if (!csatRating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmittingCsat(true);
    try {
      await ticketApi.rate(id, csatRating, csatFeedback || undefined);
      toast.success('Thank you for your feedback!');
      setCsatDone(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingCsat(false);
    }
  };

  const statusLabel = (status) => {
    if (status === 'UNDER_REVIEW') return 'Under Review';
    return status ? status.charAt(0) + status.slice(1).toLowerCase() : '';
  };

  const getSolutionStatusClass = (status) => {
    if (status === 'APPROVED') return 'bg-green-100 text-green-800';
    if (status === 'REJECTED') return 'bg-red-100 text-red-800';
    if (status === 'UNDER_REVIEW') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading || !selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');
  const isOwner = user?.email === selectedTicket?.createdBy;
  const isAssigned = user?.authUserId && selectedTicket?.assignedTo === user.authUserId;
  const assignedUserEmail = users.find(u => u.authUserId === selectedTicket?.assignedTo)?.email || selectedTicket?.assignedTo;

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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <SlaDeadline
                createdAt={selectedTicket.createdAt}
                priority={selectedTicket.priority}
                status={selectedTicket.status}
              />
              <span className={`px-3 py-1 rounded-full text-sm ${
                selectedTicket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                selectedTicket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                selectedTicket.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedTicket.status}
              </span>
            </div>
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

          {/* Owner actions: close / reopen own ticket */}
          {isOwner && !isAdmin && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Your ticket:</span>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(selectedTicket.status) && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    Close Ticket
                  </button>
                )}
                {selectedTicket.status === 'CLOSED' && (
                  <button
                    onClick={() => handleStatusChange('REOPENED')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>
          )}

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

        {/* Assign Ticket — admin/manager only */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Assign Ticket</h2>
            <form onSubmit={handleAssign} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-bold text-gray-600 mb-1">Assign to</label>
                <select
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => {
                    const roleLabel = u.roles?.[0]?.replace('ROLE_', '') || 'USER';
                    return (
                      <option key={u.authUserId} value={u.authUserId}>
                        {u.email} ({roleLabel})
                      </option>
                    );
                  })}
                </select>
              </div>
              <button
                type="submit"
                disabled={assigning || !assignTo.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </form>
            {selectedTicket?.assignedTo && (
              <p className="text-sm text-gray-500 mt-2">
                Currently assigned to: <span className="font-medium text-gray-700">{assignedUserEmail}</span>
              </p>
            )}
          </div>
        )}

        {/* Assigned person: direct solution submit (goes straight to UNDER_REVIEW) */}
        {isAssigned && !isAdmin && ['OPEN', 'IN_PROGRESS'].includes(selectedTicket?.status) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Submit Your Solution</h2>
            <p className="text-gray-500 text-sm mb-4">You are assigned to this ticket. Your solution will go directly to review.</p>
            <form onSubmit={handleAssignedSolutionSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Solution Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={assignedSolutionForm.title}
                  onChange={(e) => setAssignedSolutionForm({ ...assignedSolutionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Brief title for your solution"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Solution Description <span className="text-red-500">*</span></label>
                <textarea
                  value={assignedSolutionForm.solutionContent}
                  onChange={(e) => setAssignedSolutionForm({ ...assignedSolutionForm, solutionContent: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Describe your solution in detail..."
                  required
                />
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-gray-700 text-sm font-bold">Code Snippet</label>
                  <select
                    value={assignedSolutionForm.codeLanguage}
                    onChange={(e) => setAssignedSolutionForm({ ...assignedSolutionForm, codeLanguage: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['javascript','python','java','sql','bash','typescript','go','other'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">optional</span>
                </div>
                <textarea
                  value={assignedSolutionForm.codeSnippet}
                  onChange={(e) => setAssignedSolutionForm({ ...assignedSolutionForm, codeSnippet: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                  placeholder="Paste relevant code here (optional)..."
                />
              </div>
              <div className="border-t pt-3">
                <label className="block text-gray-700 text-sm font-bold mb-2">Attachments <span className="text-xs text-gray-400 font-normal">— images, PDFs, text (max 5 MB each)</span></label>
                <input
                  type="file"
                  multiple
                  accept="image/*,text/plain,application/pdf"
                  onChange={(e) => setAssignedFiles(Array.from(e.target.files))}
                  className="block text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {assignedFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {assignedFiles.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                        <span>📎</span> {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAssigned}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {submittingAssigned ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CSAT Rating — shown to ticket creator when resolved */}
        {selectedTicket?.status === 'RESOLVED' && !isAdmin && !csatDone && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Rate Your Experience</h2>
            <p className="text-gray-500 text-sm mb-4">How satisfied are you with the resolution of this ticket?</p>
            <form onSubmit={handleCsatSubmit}>
              <div className="flex space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCsatRating(star)}
                    className={`text-3xl transition-transform hover:scale-110 ${
                      star <= csatRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                {csatRating > 0 && (
                  <span className="ml-2 text-sm text-gray-500 self-center">
                    {['', 'Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'][csatRating]}
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
                <textarea
                  value={csatFeedback}
                  onChange={(e) => setCsatFeedback(e.target.value)}
                  rows={2}
                  placeholder="Tell us more about your experience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={submittingCsat || !csatRating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {submittingCsat ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={() => setCsatDone(true)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        )}

        {csatDone && selectedTicket?.status === 'RESOLVED' && !isAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-700">
            Thank you for your feedback!
          </div>
        )}

        {/* Solutions Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Solutions</h2>
            {!showSolutionForm && (
              <button
                onClick={() => setShowSolutionForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + Add Solution
              </button>
            )}
          </div>

          {showSolutionForm && (
            <form onSubmit={handleSolutionSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Solution Title <span className="text-red-500">*</span></label>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">Solution Description <span className="text-red-500">*</span></label>
                <textarea
                  value={solutionForm.solutionContent}
                  onChange={(e) => setSolutionForm({ ...solutionForm, solutionContent: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your solution in detail..."
                  required
                />
              </div>

              {/* Code snippet */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Optional: Code Snippet</p>
                <div className="mb-3 flex gap-2 items-center">
                  <label className="block text-gray-700 text-sm font-bold whitespace-nowrap">Language</label>
                  <select
                    value={solutionForm.codeLanguage}
                    onChange={(e) => setSolutionForm({ ...solutionForm, codeLanguage: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['javascript','python','java','sql','bash','typescript','go','other'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={solutionForm.codeSnippet}
                  onChange={(e) => setSolutionForm({ ...solutionForm, codeSnippet: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-50"
                  placeholder="Paste relevant code here (optional)..."
                />
              </div>

              {/* File attachments */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Optional: Attachments (images, PDFs, text — max 5 MB each)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,text/plain,application/pdf"
                  onChange={(e) => setSolutionFiles(Array.from(e.target.files))}
                  className="block text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {solutionFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {solutionFiles.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                        <span>📎</span> {f.name} <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Optional KB article */}
              <div className="border-t pt-4 mt-2">
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Optional: Add Knowledge Base Article</p>
                <div className="mb-3">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Article Title</label>
                  <input
                    type="text"
                    value={solutionForm.articleTitle}
                    onChange={(e) => setSolutionForm({ ...solutionForm, articleTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Title for the knowledge base article (optional)"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Article Content</label>
                  <textarea
                    value={solutionForm.articleContent}
                    onChange={(e) => setSolutionForm({ ...solutionForm, articleContent: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed article content for the knowledge base (optional)"
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          )}

          {solutions.length === 0 ? (
            <p className="text-gray-500">No solutions submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {solutions.map((solution) => {
                const isMine = solution.createdBy === (user?.email || user?.userId) ||
                  solution.submittedByEmail === user?.email;
                const canSubmitThis = (isMine || isAdmin) &&
                  (solution.status === 'DRAFT' || solution.status === 'REJECTED');

                return (
                  <div key={solution.solutionId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {solution.title && (
                          <h3 className="font-semibold text-gray-800 mb-1">{solution.title}</h3>
                        )}
                        <span className={`px-2 py-1 rounded text-sm ${getSolutionStatusClass(solution.status)}`}>
                          {statusLabel(solution.status)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {canSubmitThis && (
                          <button
                            onClick={() => handleSubmitForReview(solution.solutionId)}
                            disabled={submittingReview === solution.solutionId}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                          >
                            {submittingReview === solution.solutionId ? '...' : 'Submit for Review'}
                          </button>
                        )}
                        {isAdmin && solution.status === 'UNDER_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleApproveSolution(solution.solutionId)}
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
                          </>
                        )}
                      </div>
                    </div>
                    {solution.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-600">
                        <span className="font-medium">Rejected: </span>{solution.rejectionReason}
                      </div>
                    )}
                    <p className="text-gray-700 mt-2">{solution.solutionContent}</p>

                    {/* Code snippet */}
                    {solution.codeSnippet && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded">
                            {solution.codeLanguage || 'code'}
                          </span>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(solution.codeSnippet); toast.success('Copied!'); }}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-green-300 rounded-md p-3 text-sm overflow-x-auto whitespace-pre-wrap break-words">
                          <code>{solution.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Attachments */}
                    {solution.attachments && solution.attachments.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Attachments</p>
                        <div className="flex flex-wrap gap-3">
                          {solution.attachments.map((att) => {
                            const isImage = att.fileType?.startsWith('image/');
                            return (
                              <div key={att.attachmentId} className="border border-gray-200 rounded-lg overflow-hidden">
                                {isImage ? (
                                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.fileUrl}
                                      alt={att.fileName}
                                      className="w-32 h-24 object-cover hover:opacity-90 transition-opacity"
                                    />
                                    <p className="text-xs text-gray-500 px-2 py-1 truncate max-w-32">{att.fileName}</p>
                                  </a>
                                ) : (
                                  <a
                                    href={att.fileUrl}
                                    download={att.fileName}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <span>📄</span>
                                    <span className="max-w-32 truncate">{att.fileName}</span>
                                    <span className="text-xs text-gray-400">
                                      {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : ''}
                                    </span>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 mt-2">
                      Submitted: {new Date(solution.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

export default TicketDetailPage;
