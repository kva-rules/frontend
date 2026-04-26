import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import solutionApi from '../api/solutionApi';

const SolutionsPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadSolutions();
  }, []);

  const loadSolutions = async () => {
    setLoading(true);
    try {
      const response = await solutionApi.getAll();
      setSolutions(response.data.data?.content || response.data.data || []);
    } catch (error) {
      console.error('Failed to load solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSolutions = solutions.filter((solution) => {
    if (filter === 'ALL') return true;
    return solution.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Solutions</h1>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-4">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'All Solutions' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Solutions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-md p-6 h-40"></div>
            ))}
          </div>
        ) : filteredSolutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500 text-lg">No solutions found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'ALL' 
                ? 'Solutions will appear here when submitted to tickets'
                : `No ${filter.toLowerCase()} solutions`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSolutions.map((solution) => (
              <div
                key={solution.solutionId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/solutions/${solution.solutionId}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(solution.status)}`}>
                        {solution.status}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Ticket: {solution.ticketId}
                      </span>
                    </div>
                    <p className="text-gray-700 line-clamp-3">{solution.solutionContent}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                  <div className="flex items-center space-x-4">
                    <span>
                      <span className="font-medium">Submitted by:</span> {solution.submittedByEmail || solution.submittedBy || solution.createdBy}
                    </span>
                    {solution.contributorIds?.length > 1 && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        +{solution.contributorIds.length - 1} contributors
                      </span>
                    )}
                  </div>
                  <span>{new Date(solution.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionsPage;
