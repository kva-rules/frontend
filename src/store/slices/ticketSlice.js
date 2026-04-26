import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ticketApi from '../../api/ticketApi';

const initialState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Static sample tickets for demo
const STATIC_TICKETS = [
  {
    ticketId: 'TKT-001',
    title: 'Unable to login to the application',
    description: 'Getting 401 error when trying to login with valid credentials. The issue started after the recent deployment.',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'Authentication',
    createdBy: 'static-user-1',
    createdByEmail: 'melvinabi757@gmail.com',
    assignedTo: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    ticketId: 'TKT-002',
    title: 'Dashboard loading slowly',
    description: 'The dashboard takes more than 10 seconds to load. Performance degradation noticed after adding new widgets.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Performance',
    createdBy: 'static-user-1',
    createdByEmail: 'melvinabi757@gmail.com',
    assignedTo: 'static-admin-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    ticketId: 'TKT-003',
    title: 'Export feature not working',
    description: 'CSV export button does nothing when clicked. No error message displayed.',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'Feature Bug',
    createdBy: 'user-123',
    createdByEmail: 'john.doe@example.com',
    assignedTo: 'static-admin-1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    ticketId: 'TKT-004',
    title: 'Need password reset functionality',
    description: 'Users are requesting a self-service password reset feature via email.',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: 'Feature Request',
    createdBy: 'user-456',
    createdByEmail: 'jane.smith@example.com',
    assignedTo: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    ticketId: 'TKT-005',
    title: 'Mobile app crashes on startup',
    description: 'Android app crashes immediately after splash screen. Affects version 2.1.0.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    category: 'Mobile',
    createdBy: 'static-user-1',
    createdByEmail: 'melvinabi757@gmail.com',
    assignedTo: 'static-admin-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to check if using static auth
const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      if (isStaticAuth()) {
        return { content: STATIC_TICKETS, totalElements: STATIC_TICKETS.length };
      }
      const response = await ticketApi.getAll(params);
      // Backend returns a plain array
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      if (isStaticAuth()) {
        const ticket = STATIC_TICKETS.find(t => t.ticketId === id);
        if (ticket) return ticket;
      }
      const response = await ticketApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await ticketApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await ticketApi.updateStatus(id, status);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ticket status');
    }
  }
);

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.content || action.payload;
        state.totalCount = action.payload.totalElements || action.payload.length;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(t => t.ticketId === action.payload.ticketId);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?.ticketId === action.payload.ticketId) {
          state.selectedTicket = action.payload;
        }
      });
  },
});

export const { clearSelectedTicket, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
