import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '../store/slices/rewardSlice';
import userApi from '../api/userApi';

const PERIODS = [
  { label: 'All Time', value: 'ALL_TIME' },
  { label: 'This Month', value: 'MONTHLY' },
  { label: 'This Week', value: 'WEEKLY' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

const LeaderboardPage = () => {
  const dispatch = useDispatch();
  const { leaderboard, loading } = useSelector((state) => state.rewards);
  const { user } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState('ALL_TIME');
  const [userNames, setUserNames] = useState({});

  useEffect(() => {
    dispatch(fetchLeaderboard({ period }));
  }, [dispatch, period]);

  useEffect(() => {
    if (!leaderboard.length) return;
    const ids = [...new Set(leaderboard.map((e) => e.userId).filter(Boolean))];
    const missingIds = ids.filter((id) => !userNames[id]);
    if (!missingIds.length) return;
    Promise.all(
      missingIds.map((id) =>
        userApi.getById(id)
          .then((res) => ({ id, name: res.data?.data?.name || res.data?.name }))
          .catch(() => ({ id, name: null }))
      )
    ).then((results) => {
      const updates = {};
      results.forEach(({ id, name }) => { if (name) updates[id] = name; });
      setUserNames((prev) => ({ ...prev, ...updates }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard]);

  const myRankEntry = leaderboard.findIndex(
    (e) => e.userId === (user?.authUserId || user?.userId) || e.email === user?.email
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
          {myRankEntry >= 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-blue-600 font-semibold">Your rank: #{myRankEntry + 1}</span>
              <span className="text-blue-500 ml-2">
                {leaderboard[myRankEntry]?.totalPoints || leaderboard[myRankEntry]?.points || 0} pts
              </span>
            </div>
          )}
        </div>

        {/* Period tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-2">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                No leaderboard data yet. Points are earned when solutions are approved!
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-6 pl-2">Contributor</div>
                <div className="col-span-2 text-center">Solutions</div>
                <div className="col-span-3 text-right pr-2">Points</div>
              </div>

              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry, index) => {
                  const isMe =
                    entry.userId === (user?.authUserId || user?.userId) ||
                    entry.email === user?.email;
                  return (
                    <div
                      key={entry.userId || index}
                      className={`grid grid-cols-12 items-center px-4 py-4 transition-colors ${
                        isMe ? 'bg-blue-50' :
                        index === 0 ? 'bg-yellow-50' :
                        index === 1 ? 'bg-gray-50' :
                        index === 2 ? 'bg-orange-50' :
                        'hover:bg-gray-50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center">
                        {index < 3 ? (
                          <span className="text-2xl">{MEDAL[index]}</span>
                        ) : (
                          <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-sm font-bold ${
                            isMe ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="col-span-6 pl-2">
                        <p className={`font-semibold ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                          {userNames[entry.userId] || entry.userName || entry.username || entry.email ||
                           (entry.userId ? `User ${entry.userId.toString().slice(0, 8)}…` : 'Unknown')}
                          {isMe && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </p>
                        {entry.email && entry.userName && (
                          <p className="text-xs text-gray-400">{entry.email}</p>
                        )}
                      </div>

                      {/* Contributions */}
                      <div className="col-span-2 text-center">
                        <span className="text-sm text-gray-600">
                          {entry.solutionsApproved || entry.contributionCount || 0}
                        </span>
                      </div>

                      {/* Points */}
                      <div className="col-span-3 text-right pr-2">
                        <span className={`text-xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-500' :
                          index === 2 ? 'text-orange-600' :
                          isMe ? 'text-blue-600' :
                          'text-gray-700'
                        }`}>
                          {(entry.totalPoints || entry.points || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
