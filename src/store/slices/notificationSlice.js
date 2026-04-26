import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationApi from '../../api/notificationApi';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Static notifications for demo
const STATIC_NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'TICKET_ASSIGNED',
    title: 'New Ticket Assigned',
    message: 'You have been assigned to ticket TKT-002: Dashboard loading slowly',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    ticketId: 'TKT-002',
  },
  {
    id: 'notif-002',
    type: 'SOLUTION_APPROVED',
    title: 'Solution Approved',
    message: 'Your solution for ticket TKT-003 has been approved! You earned 50 points.',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ticketId: 'TKT-003',
  },
  {
    id: 'notif-003',
    type: 'TICKET_STATUS_CHANGED',
    title: 'Ticket Status Updated',
    message: 'Ticket TKT-005 status changed to IN_PROGRESS',
    read: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ticketId: 'TKT-005',
  },
  {
    id: 'notif-004',
    type: 'NEW_COMMENT',
    title: 'New Comment',
    message: 'Admin User commented on your ticket TKT-001',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ticketId: 'TKT-001',
  },
  {
    id: 'notif-005',
    type: 'LEADERBOARD_UPDATE',
    title: 'Leaderboard Rank Up!',
    message: 'Congratulations! You moved up to rank #4 on the leaderboard.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ticketId: null,
  },
];

// Helper to check if using static auth
const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (userId, { rejectWithValue }) => {
    try {
      // Return static data for demo
      if (isStaticAuth()) {
        return { content: STATIC_NOTIFICATIONS };
      }
      const response = await notificationApi.getUserNotifications(userId);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (userId, { rejectWithValue }) => {
    try {
      // Return static data for demo
      if (isStaticAuth()) {
        return STATIC_NOTIFICATIONS.filter(n => !n.read).length;
      }
      const response = await notificationApi.getUnreadCount(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      await notificationApi.markAsRead(id, userId);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.content || action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.notificationId === action.payload);
        if (notification) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
