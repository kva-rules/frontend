import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ticketApi from '../api/ticketApi';
import SlaDeadline from '../components/SlaDeadline';

const PAGE_SIZE = 10;

const statusColor = (status) => {
  switch (status) {
    case 'OPEN': return 'bg-green-100 text-green-800';
    case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
    case 'RESOLVED': return 'bg-blue-100 text-blue-800';
    case 'CLOSED': return 'bg-gray-100 text-gray-800';
    case 'REOPENED': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const priorityColor = (p) => {
  switch (p) {
    case 'URGENT': return 'bg-red-100 text-red-800';
    case 'HIGH': return 'bg-orange-100 text-orange-800';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-green-100 text-green-800';
  }
};

// Static data for demo users
const STATIC_MY_TICKETS = [
  { ticketId: 'TKT-001', title: 'Unable to login to the application', description: 'Getting 401 error when trying to login with valid credentials.', status: 'OPEN', priority: 'HIGH', difficultyLevel: 'MEDIUM', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { ticketId: 'TKT-002', title: 'Dashboard loading slowly', description: 'The dashboard takes more than 10 seconds to load.', status: 'IN_PROGRESS', priority: 'MEDIUM', difficultyLevel: 'EASY', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { ticketId: 'TKT-005', title: 'Mobile app crashes on startup', description: 'Android app crashes immediately after splash screen.', status: 'IN_PROGRESS', priority: 'HIGH', difficultyLevel: 'CRITICAL', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusTab, setStatusTab] = useState('ALL');

  useEffect(() => {
    loadMyTickets(0);
  }, [statusTab]);

  const loadMyTickets = async (pageNum = 0) => {
    setLoading(true);
    try {
      if (isStaticAuth()) {
        const filtered = statusTab === 'ALL'
          ? STATIC_MY_TICKETS
          : STATIC_MY_TICKETS.filter(t => t.status === statusTab);
        setTickets(filtered);
        setTotalElements(filtered.length);
        setTotalPages(1);
        setPage(0);
        return;
      }

      const params = { page: pageNum, size: PAGE_SIZE };
      const response = await ticketApi.getMy(params);
      const data = response.data?.data || response.data;
      let content = data?.content || [];

      if (statusTab !== 'ALL') {
        content = content.filter(t => t.status === statusTab);
      }

      setTickets(content);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(statusTab === 'ALL' ? (data?.totalElements || 0) : content.length);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load my tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
          </div>
          <Link to="/tickets/create" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            + Create Ticket
          </Link>
        </div>

        {/* Summary cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Open', count: openCount, color: 'border-green-400 text-green-700 bg-green-50' },
              { label: 'In Progress', count: inProgressCount, color: 'border-yellow-400 text-yellow-700 bg-yellow-50' },
              { label: 'Resolved', count: resolvedCount, color: 'border-blue-400 text-blue-700 bg-blue-50' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusTab(tab); setPage(0); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-5 h-20" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">
              {statusTab === 'ALL' ? "You haven't created any tickets yet." : `No ${statusTab.replace('_', ' ').toLowerCase()} tickets.`}
            </p>
            {statusTab === 'ALL' && (
              <Link to="/tickets/create" className="mt-3 inline-block text-blue-500 hover:underline text-sm">
                Create your first ticket →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">{ticket.title}</h2>
                    <p className="text-gray-500 text-sm line-clamp-2">{ticket.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      {ticket.assignedTo && ` · Assigned to: ${ticket.assignedTo}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(ticket.status)}`}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-xs font-medium ${priorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <SlaDeadline
                      createdAt={ticket.createdAt}
                      priority={ticket.priority}
                      status={ticket.status}
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isStaticAuth() && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => loadMyTickets(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                onClick={() => loadMyTickets(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
