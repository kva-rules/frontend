import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';
import authApi from '../../api/authApi';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

// Static credentials for testing
const STATIC_USERS = {
  'melvinabi757@gmail.com': {
    password: '123',
    user: { userId: 'static-user-1', email: 'melvinabi757@gmail.com', role: 'USER' },
  },
  'abhidhabmellwynva@gmail.com': {
    password: 'admin123',
    user: { userId: 'static-admin-1', email: 'abhidhabmellwynva@gmail.com', role: 'ADMIN' },
  },
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Check for static credentials first
      const staticUser = STATIC_USERS[credentials.email];
      if (staticUser && staticUser.password === credentials.password) {
        const fakeToken = 'static-token-' + Date.now();
        localStorage.setItem('token', fakeToken);
        localStorage.setItem('refreshToken', 'static-refresh-token');
        localStorage.setItem('user', JSON.stringify(staticUser.user));
        return { token: fakeToken, user: staticUser.user };
      }

      // Fall back to API login
      const response = await authApi.login(credentials);
      const { accessToken, refreshToken } = response.data.data;
      const decoded = jwtDecode(accessToken);
      const user = {
        authUserId: decoded.authUserId,
        userId: decoded.authUserId,
        email: decoded.sub,
        role: decoded.roles?.[0] || decoded.role,
      };
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      return { token: accessToken, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      const { accessToken, refreshToken } = response.data.data;
      const decoded = jwtDecode(accessToken);
      const user = {
        authUserId: decoded.authUserId,
        userId: decoded.authUserId,
        email: decoded.sub,
        role: decoded.roles?.[0] || decoded.role,
      };
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      return { token: accessToken, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    await authApi.logout(refreshToken);
  } catch (error) {
    console.error('Logout error:', error);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
