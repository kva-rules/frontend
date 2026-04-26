import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import rewardApi from '../../api/rewardApi';

const initialState = {
  leaderboard: [],
  myPoints: 0,
  loading: false,
  error: null,
};

// Static leaderboard data for demo
const STATIC_LEADERBOARD = [
  { rank: 1, userId: 'static-admin-1', email: 'abhidhabmellwynva@gmail.com', username: 'Admin User', totalPoints: 2450, solutionsApproved: 28, ticketsResolved: 45 },
  { rank: 2, userId: 'user-expert-1', email: 'sarah.tech@example.com', username: 'Sarah Tech', totalPoints: 1890, solutionsApproved: 22, ticketsResolved: 35 },
  { rank: 3, userId: 'user-expert-2', email: 'mike.dev@example.com', username: 'Mike Developer', totalPoints: 1650, solutionsApproved: 18, ticketsResolved: 30 },
  { rank: 4, userId: 'static-user-1', email: 'melvinabi757@gmail.com', username: 'Melvin Abi', totalPoints: 1200, solutionsApproved: 12, ticketsResolved: 22 },
  { rank: 5, userId: 'user-helper-1', email: 'alex.support@example.com', username: 'Alex Support', totalPoints: 980, solutionsApproved: 10, ticketsResolved: 18 },
  { rank: 6, userId: 'user-helper-2', email: 'emma.help@example.com', username: 'Emma Helper', totalPoints: 750, solutionsApproved: 8, ticketsResolved: 14 },
  { rank: 7, userId: 'user-new-1', email: 'john.new@example.com', username: 'John Newbie', totalPoints: 320, solutionsApproved: 3, ticketsResolved: 6 },
  { rank: 8, userId: 'user-new-2', email: 'lisa.starter@example.com', username: 'Lisa Starter', totalPoints: 150, solutionsApproved: 1, ticketsResolved: 3 },
];

// Helper to check if using static auth
const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

export const fetchLeaderboard = createAsyncThunk(
  'rewards/fetchLeaderboard',
  async (params, { rejectWithValue }) => {
    try {
      // Return static data for demo
      if (isStaticAuth()) {
        return STATIC_LEADERBOARD;
      }
      const response = await rewardApi.getLeaderboard(params);
      return response.data.content || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const fetchMyPoints = createAsyncThunk(
  'rewards/fetchMyPoints',
  async (userId, { rejectWithValue }) => {
    try {
      // Return static data for demo
      if (isStaticAuth()) {
        const user = STATIC_LEADERBOARD.find(u => u.userId === userId);
        return user ? user.totalPoints : 0;
      }
      const response = await rewardApi.getUserPoints(userId);
      return response.data.totalPoints || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch points');
    }
  }
);

const rewardSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyPoints.fulfilled, (state, action) => {
        state.myPoints = action.payload;
      });
  },
});

export const { clearError } = rewardSlice.actions;
export default rewardSlice.reducer;
