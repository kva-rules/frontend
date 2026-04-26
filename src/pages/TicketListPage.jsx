import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTickets } from '../store/slices/ticketSlice';

const TicketListPage = () => {
  const dispatch = useDispatch();
  const { tickets, loading } = useSelector((state) => state.tickets);

  useEffect(() => {
    dispatch(fetchTickets({}));
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tickets</h1>
          <Link
            to="/tickets/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Ticket
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-24"></div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No tickets found. Create your first ticket!
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.ticketId}
                to={`/tickets/${ticket.ticketId}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{ticket.title}</h2>
                    <p className="text-gray-600 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      ticket.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'RESOLVED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ticket.difficultyLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      ticket.difficultyLevel === 'HARD' ? 'bg-orange-100 text-orange-800' :
                      ticket.difficultyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.difficultyLevel}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Created: {new Date(ticket.createdAt).toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketListPage;
