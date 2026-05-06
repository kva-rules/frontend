import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import rewardApi from '../api/rewardApi';
import userApi from '../api/userApi';

const STATIC_TRANSACTIONS = [
  { id: 'tx-001', type: 'SOLUTION_APPROVED', points: 50, description: 'Solution approved for TKT-003', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-002', type: 'SOLUTION_APPROVED', points: 50, description: 'Solution approved for TKT-007', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-003', type: 'TICKET_RESOLVED', points: 20, description: 'Ticket TKT-005 resolved', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-004', type: 'SOLUTION_APPROVED', points: 50, description: 'Solution approved for TKT-012', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx-005', type: 'TICKET_RESOLVED', points: 20, description: 'Ticket TKT-009 resolved', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const STATIC_POINTS_BY_USER = {
  'static-admin-1': 2450,
  'static-user-1': 1200,
};

const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

const ROLE_COLORS = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  ENGINEER: 'bg-blue-100 text-blue-700',
  CONTRIBUTOR: 'bg-green-100 text-green-700',
  USER: 'bg-gray-100 text-gray-700',
};

const TX_ICONS = {
  SOLUTION_APPROVED: { bg: 'bg-green-100', text: 'text-green-600', label: 'Solution Approved' },
  TICKET_RESOLVED: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Ticket Resolved' },
  BONUS: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Bonus' },
};

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.authUserId || user?.userId;

  const [points, setPoints] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [contributions, setContributions] = useState(null);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || user?.email?.split('@')[0] || '');
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!userId) return;

    if (isStaticAuth()) {
      setPoints(STATIC_POINTS_BY_USER[userId] ?? 0);
      setContributions({ solutionsApproved: 12, ticketsResolved: 22 });
      setLoadingPoints(false);
      setTransactions(STATIC_TRANSACTIONS);
      setLoadingTx(false);
      return;
    }

    rewardApi.getUserPoints(userId)
      .then((res) => setPoints(res.data?.totalPoints ?? res.data ?? 0))
      .catch(() => setPoints(0))
      .finally(() => setLoadingPoints(false));

    rewardApi.getUserTransactions(userId, { size: 10 })
      .then((res) => setTransactions(res.data?.content || res.data || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoadingTx(false));

    rewardApi.getContributions(userId)
      .then((res) => setContributions(res.data))
      .catch(() => setContributions(null));
  }, [userId]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await userApi.update(userId, { name: displayName.trim() });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.USER;
  const initials = (user?.name || user?.email || 'U')
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 w-full max-w-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                  >
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setSaveError(null); }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-800 truncate">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-gray-400 hover:text-blue-500 flex-shrink-0"
                    title="Edit display name"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              {saveError && <p className="text-red-500 text-sm mt-1">{saveError}</p>}
              {saveSuccess && <p className="text-green-600 text-sm mt-1">Name updated!</p>}
              <p className="text-gray-500 mt-0.5">{user?.email}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Points</p>
            {loadingPoints ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded mx-auto w-16" />
            ) : (
              <p className="text-3xl font-bold text-blue-600">{(points ?? 0).toLocaleString()}</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Solutions Approved</p>
            <p className="text-3xl font-bold text-green-600">
              {contributions?.solutionsApproved ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tickets Resolved</p>
            <p className="text-3xl font-bold text-purple-600">
              {contributions?.ticketsResolved ?? '—'}
            </p>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Recent Point Transactions</h2>
          </div>

          {loadingTx ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-14 bg-gray-100 rounded" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400">No transactions yet. Earn points by getting solutions approved!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx, i) => {
                const icon = TX_ICONS[tx.type] || { bg: 'bg-gray-100', text: 'text-gray-600', label: tx.type };
                return (
                  <div key={tx.id || i} className="flex items-center px-5 py-4">
                    <div className={`w-10 h-10 rounded-full ${icon.bg} flex items-center justify-center flex-shrink-0`}>
                      <svg className={`w-5 h-5 ${icon.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{tx.description || icon.label}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-green-600 font-bold text-lg ml-4">+{tx.points}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
