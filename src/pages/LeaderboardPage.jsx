import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '../store/slices/rewardSlice';

const LeaderboardPage = () => {
  const dispatch = useDispatch();
  const { leaderboard, loading } = useSelector((state) => state.rewards);

  useEffect(() => {
    dispatch(fetchLeaderboard({ period: 'MONTHLY' }));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Leaderboard</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-gray-500">
              No leaderboard data yet. Points are earned when solutions are approved!
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId || index}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-50 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-50 border-2 border-gray-300' :
                    index === 2 ? 'bg-orange-50 border-2 border-orange-300' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 text-lg font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {entry.userName || entry.email || `User ${entry.userId}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.contributionCount || 0} contributions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {entry.totalPoints || entry.points || 0}
                    </p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
