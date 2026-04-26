import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketReducer from './slices/ticketSlice';
import notificationReducer from './slices/notificationSlice';
import rewardReducer from './slices/rewardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    notifications: notificationReducer,
    rewards: rewardReducer,
  },
});

export default store;
