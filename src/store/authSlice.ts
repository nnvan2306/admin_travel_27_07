import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API } from "@/lib/axios";

export interface User {
  id: number;
  full_name: string;
  email: string;
  avatar?: string;
  role: string;
  avatar_url?: string;
  is_verified: boolean;
  is_deleted: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

// ===== ASYNC ACTION: fetch user from /me =====
export const fetchUser = createAsyncThunk(
  "auth/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      const res = await API.get("/me");
      if (res.status === 200 && res.data.user) {
        return res.data.user;
      }
      return rejectWithValue("User not found");
    } catch (err: any) {
      console.error("Fetch user error:", err?.response ?? err);
      return rejectWithValue("Failed to fetch user");
    }
  }
);
// ===== ASYNC ACTION: logout =====
export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await API.post("/logout");
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    localStorage.removeItem("access_token");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
