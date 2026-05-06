import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { fetchNotifications, fetchUnreadCount, markAsRead } from '../store/slices/notificationSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const notifUserId = user?.authUserId || user?.userId;
    if (isAuthenticated && notifUserId) {
      dispatch(fetchNotifications(notifUserId));
      dispatch(fetchUnreadCount(notifUserId));
    }
  }, [dispatch, isAuthenticated, user?.authUserId, user?.userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markAsRead({ id: notification.notificationId, userId: user?.authUserId }));
    }
    setShowNotifications(false);
    if (notification.referenceId) {
      navigate(`/tickets/${notification.referenceId}`);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold">
              Ticketing System
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">
                Dashboard
              </Link>
              <Link to="/tickets" className="hover:bg-blue-700 px-3 py-2 rounded">
                Tickets
              </Link>
              <Link to="/tickets/my" className="hover:bg-blue-700 px-3 py-2 rounded">
                My Tickets
              </Link>
              <Link to="/solutions" className="hover:bg-blue-700 px-3 py-2 rounded">
                Solutions
              </Link>
              <Link to="/solutions/my" className="hover:bg-blue-700 px-3 py-2 rounded">
                My Solutions
              </Link>
              <Link to="/knowledge" className="hover:bg-blue-700 px-3 py-2 rounded">
                Knowledge Base
              </Link>
              <Link to="/leaderboard" className="hover:bg-blue-700 px-3 py-2 rounded">
                Leaderboard
              </Link>
              <Link to="/badges" className="hover:bg-blue-700 px-3 py-2 rounded">
                Badges
              </Link>
              {isAdmin && (
                <Link to="/admin/approvals" className="hover:bg-blue-700 px-3 py-2 rounded bg-yellow-500 hover:bg-yellow-600">
                  Approvals
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="text-gray-800 font-semibold">Notifications</h3>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.notificationId}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                              !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium text-sm">
                                {notification.title}
                              </p>
                              <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/profile"
              className={`text-sm px-3 py-2 rounded transition-colors ${
                location.pathname === '/profile'
                  ? 'bg-blue-800'
                  : 'hover:bg-blue-700'
              }`}
            >
              {user?.name || user?.email?.split('@')[0] || user?.email}
              <span className="ml-1 text-blue-300 text-xs">({user?.role})</span>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
