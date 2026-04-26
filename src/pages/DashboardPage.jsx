import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../store/slices/ticketSlice';
import { fetchNotifications } from '../store/slices/notificationSlice';
import { fetchLeaderboard } from '../store/slices/rewardSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { tickets, loading: ticketsLoading } = useSelector((state) => state.tickets);
  const { notifications, loading: notificationsLoading } = useSelector((state) => state.notifications);
  const { leaderboard, loading: leaderboardLoading } = useSelector((state) => state.rewards);

  useEffect(() => {
    dispatch(fetchTickets({ status: 'OPEN' }));
    if (user?.authUserId) {
      dispatch(fetchNotifications(user.authUserId));
    }
    dispatch(fetchLeaderboard({ limit: 5 }));
  }, [dispatch, user?.authUserId]);

  const openTicketsCount = tickets.filter(t => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Open Tickets Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Open Tickets</h2>
            {ticketsLoading ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
            ) : (
              <p className="text-4xl font-bold text-blue-600">{openTicketsCount}</p>
            )}
            <Link to="/tickets" className="text-blue-500 hover:underline text-sm mt-2 inline-block">
              View all tickets →
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/tickets/create"
                className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Create Ticket
              </Link>
              <Link
                to="/knowledge"
                className="block w-full bg-green-500 text-white text-center py-2 px-4 rounded-md hover:bg-green-600"
              >
                Knowledge Base
              </Link>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Welcome</h2>
            <p className="text-xl font-medium text-gray-800">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">My Notifications</h2>
            {notificationsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              <ul className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <li
                    key={notification.notificationId}
                    className={`p-3 rounded-md ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                  >
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Contributors</h2>
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-gray-500">No leaderboard data</p>
            ) : (
              <ul className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <li
                    key={entry.userId || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                        index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-orange-400' : 'bg-gray-200'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-gray-800">{entry.userName || entry.email || `User ${entry.userId}`}</span>
                    </div>
                    <span className="font-bold text-blue-600">{entry.totalPoints || entry.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/leaderboard" className="text-blue-500 hover:underline text-sm mt-4 inline-block">
              View full leaderboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
