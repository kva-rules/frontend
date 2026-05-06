import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ticketApi from '../api/ticketApi';
import SlaDeadline from '../components/SlaDeadline';

const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const DIFFICULTIES = ['', 'EASY', 'MEDIUM', 'HARD', 'CRITICAL'];
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

// Static tickets from ticketSlice for demo users
const STATIC_TICKETS = [
  { ticketId: 'TKT-001', title: 'Unable to login to the application', description: 'Getting 401 error when trying to login with valid credentials.', status: 'OPEN', priority: 'HIGH', difficultyLevel: 'MEDIUM', createdBy: 'melvinabi757@gmail.com', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { ticketId: 'TKT-002', title: 'Dashboard loading slowly', description: 'The dashboard takes more than 10 seconds to load.', status: 'IN_PROGRESS', priority: 'MEDIUM', difficultyLevel: 'EASY', createdBy: 'melvinabi757@gmail.com', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { ticketId: 'TKT-003', title: 'Export feature not working', description: 'CSV export button does nothing when clicked.', status: 'RESOLVED', priority: 'LOW', difficultyLevel: 'EASY', createdBy: 'john.doe@example.com', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { ticketId: 'TKT-004', title: 'Need password reset functionality', description: 'Users are requesting a self-service password reset feature.', status: 'OPEN', priority: 'MEDIUM', difficultyLevel: 'HARD', createdBy: 'jane.smith@example.com', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { ticketId: 'TKT-005', title: 'Mobile app crashes on startup', description: 'Android app crashes immediately after splash screen.', status: 'IN_PROGRESS', priority: 'HIGH', difficultyLevel: 'CRITICAL', createdBy: 'melvinabi757@gmail.com', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

const TicketListPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter state
  const [titleSearch, setTitleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');

  const hasFilters = titleSearch || statusFilter || priorityFilter || difficultyFilter;

  const loadTickets = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      if (isStaticAuth()) {
        let filtered = STATIC_TICKETS;
        if (titleSearch) filtered = filtered.filter(t => t.title.toLowerCase().includes(titleSearch.toLowerCase()));
        if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
        if (priorityFilter) filtered = filtered.filter(t => t.priority === priorityFilter);
        if (difficultyFilter) filtered = filtered.filter(t => t.difficultyLevel === difficultyFilter);
        setTickets(filtered);
        setTotalElements(filtered.length);
        setTotalPages(1);
        return;
      }

      let response;
      if (hasFilters) {
        response = await ticketApi.search({
          title: titleSearch || undefined,
          status: statusFilter || undefined,
          difficultyLevel: difficultyFilter || undefined,
          page: pageNum,
          size: PAGE_SIZE,
        });
      } else {
        response = await ticketApi.getAll({ page: pageNum, size: PAGE_SIZE });
      }

      const data = response.data?.data || response.data;
      setTickets(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [titleSearch, statusFilter, priorityFilter, difficultyFilter, hasFilters]);

  useEffect(() => {
    loadTickets(0);
  }, [titleSearch, statusFilter, priorityFilter, difficultyFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setTitleSearch(pendingSearch);
    setPage(0);
  };

  const handleClearFilters = () => {
    setTitleSearch('');
    setPendingSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setDifficultyFilter('');
    setPage(0);
  };

  const isAdmin = user?.role?.includes('ADMIN') || user?.role?.includes('MANAGER');

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tickets</h1>
            {totalElements > 0 && (
              <p className="text-gray-500 text-sm mt-1">{totalElements} tickets found</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link to="/tickets/my" className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50">
              My Tickets
            </Link>
            <Link to="/tickets/create" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              + Create Ticket
            </Link>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-3">
            <input
              type="text"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Search by title..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              Search
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.filter(Boolean).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => { setDifficultyFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                {DIFFICULTIES.filter(Boolean).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-24" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
            {hasFilters ? 'No tickets match your filters.' : 'No tickets yet. Create the first one!'}
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
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
                      <span>By: {ticket.createdBy || 'N/A'}</span>
                      {ticket.assignedTo && <span>· Assigned: {ticket.assignedTo}</span>}
                      <span>· {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(ticket.status)}`}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-xs font-medium ${priorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    {ticket.difficultyLevel && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {ticket.difficultyLevel}
                      </span>
                    )}
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
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages} · {totalElements} total
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => loadTickets(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = page < 3 ? i : page - 2 + i;
                if (pageNum >= totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => loadTickets(pageNum)}
                    className={`px-3 py-2 border rounded-md text-sm ${
                      pageNum === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => loadTickets(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

export default TicketListPage;
