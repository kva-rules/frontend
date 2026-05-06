import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import rewardApi from '../api/rewardApi';

const BADGE_META = {
  FIRST_SOLVER: {
    icon: '🏆',
    color: 'from-yellow-400 to-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    hint: 'Get your first solution approved',
  },
  TOP_CONTRIBUTOR: {
    icon: '⭐',
    color: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hint: 'Reach the top of the leaderboard',
  },
  KNOWLEDGE_MASTER: {
    icon: '📚',
    color: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    hint: 'Contribute 5+ knowledge base articles',
  },
  TICKET_SLAYER: {
    icon: '⚔️',
    color: 'from-red-400 to-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    hint: 'Resolve 10+ tickets',
  },
  SOLUTION_ARCHITECT: {
    icon: '🔧',
    color: 'from-green-400 to-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    hint: 'Have 10+ solutions approved',
  },
};

const DEFAULT_META = {
  icon: '🎖️',
  color: 'from-gray-400 to-gray-600',
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  hint: '',
};

const STATIC_ALL_BADGES = [
  { badgeId: 'b-001', badgeName: 'FIRST_SOLVER', description: 'Awarded for submitting and getting approved your very first solution.', pointsRequired: 50 },
  { badgeId: 'b-002', badgeName: 'TOP_CONTRIBUTOR', description: 'Awarded to the top contributor on the leaderboard.', pointsRequired: 500 },
  { badgeId: 'b-003', badgeName: 'KNOWLEDGE_MASTER', description: 'Awarded for contributing 5 or more knowledge base articles.', pointsRequired: 250 },
  { badgeId: 'b-004', badgeName: 'TICKET_SLAYER', description: 'Awarded for resolving 10 or more tickets.', pointsRequired: 200 },
  { badgeId: 'b-005', badgeName: 'SOLUTION_ARCHITECT', description: 'Awarded for having 10 or more solutions approved.', pointsRequired: 500 },
];

const STATIC_EARNED_BY_USER = {
  'static-admin-1': ['FIRST_SOLVER', 'TOP_CONTRIBUTOR', 'SOLUTION_ARCHITECT'],
  'static-user-1': ['FIRST_SOLVER'],
};

const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

const BadgesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.authUserId || user?.userId;

  const [allBadges, setAllBadges] = useState([]);
  const [earnedNames, setEarnedNames] = useState(new Set());
  const [earnedDetails, setEarnedDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    if (isStaticAuth()) {
      setAllBadges(STATIC_ALL_BADGES);
      const earned = STATIC_EARNED_BY_USER[userId] || [];
      setEarnedNames(new Set(earned));
      setEarnedDetails(
        earned.map((name) => {
          const badge = STATIC_ALL_BADGES.find((b) => b.badgeName === name);
          return { badgeName: name, earnedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(), badgeDescription: badge?.description };
        })
      );
      setLoading(false);
      return;
    }

    Promise.all([
      rewardApi.getUserBadges(userId),
      rewardApi.getAllBadges(),
    ]).then(([userRes, allRes]) => {
      const earned = userRes.data || [];
      setEarnedDetails(earned);
      setEarnedNames(new Set(earned.map((b) => b.badgeName)));
      const all = allRes.data?.content || allRes.data || [];
      setAllBadges(all.length ? all : STATIC_ALL_BADGES);
    }).catch(() => {
      setAllBadges(STATIC_ALL_BADGES);
    }).finally(() => setLoading(false));
  }, [userId]);

  const earnedCount = earnedNames.size;
  const totalCount = allBadges.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Badges</h1>
            <p className="text-gray-500 mt-1">
              {earnedCount} of {totalCount} earned
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-48">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{totalCount ? Math.round((earnedCount / totalCount) * 100) : 0}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                style={{ width: totalCount ? `${(earnedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Earned section */}
        {earnedCount > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Earned</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {earnedDetails.map((earned) => {
                const meta = BADGE_META[earned.badgeName] || DEFAULT_META;
                const badge = allBadges.find((b) => b.badgeName === earned.badgeName);
                return (
                  <div
                    key={earned.badgeName}
                    className={`rounded-xl border-2 ${meta.border} ${meta.bg} p-5 flex flex-col items-center text-center shadow-sm`}
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center text-3xl mb-3 shadow-md`}>
                      {meta.icon}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">
                      {(earned.badgeName || '').replace(/_/g, ' ')}
                    </h3>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-3">
                      {earned.badgeDescription || badge?.description || meta.hint}
                    </p>
                    <div className="mt-auto flex flex-col items-center gap-1">
                      <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {badge?.pointsRequired ?? 0} pts required
                      </span>
                      {earned.earnedAt && (
                        <span className="text-xs text-gray-400">
                          Earned {new Date(earned.earnedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All badges catalog */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">All Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allBadges.map((badge) => {
              const earned = earnedNames.has(badge.badgeName);
              const meta = BADGE_META[badge.badgeName] || DEFAULT_META;
              return (
                <div
                  key={badge.badgeId}
                  className={`rounded-xl border-2 p-5 flex flex-col items-center text-center transition-all ${
                    earned
                      ? `${meta.border} ${meta.bg} shadow-sm`
                      : 'border-gray-200 bg-white opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${
                    earned
                      ? `bg-gradient-to-br ${meta.color} shadow-md`
                      : 'bg-gray-200'
                  }`}>
                    {meta.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">
                    {(badge.badgeName || '').replace(/_/g, ' ')}
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 line-clamp-3">
                    {badge.description || meta.hint}
                  </p>
                  <div className="mt-auto flex flex-col items-center gap-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {badge.pointsRequired ?? 0} pts required
                    </span>
                    {earned ? (
                      <span className="text-xs text-green-600 font-medium">Earned ✓</span>
                    ) : (
                      <span className="text-xs text-gray-400">Not yet earned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BadgesPage;
