import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("adminUser"));
const storedPermissions = JSON.parse(localStorage.getItem("adminPermissions"));
const storedToken = localStorage.getItem("adminToken");
const storedRefreshToken = localStorage.getItem("adminRefreshToken");
const storedSessionId = localStorage.getItem("adminSessionId");

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser || null,
    permissions: storedPermissions || [],
    token: storedToken || null,
    refreshToken: storedRefreshToken || null,
    sessionId: storedSessionId || null,
    isAuth: !!storedToken,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.permissions = action.payload.user?.permissions || [];
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.sessionId = action.payload.sessionId;
      state.isAuth = true;
      localStorage.setItem("adminUser", JSON.stringify(action.payload.user));
      localStorage.setItem("adminPermissions", JSON.stringify(state.permissions));
      localStorage.setItem("adminToken", action.payload.token);
      localStorage.setItem("adminRefreshToken", action.payload.refreshToken);
      localStorage.setItem("adminSessionId", action.payload.sessionId);
    },
    setToken: (state, action) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      if (action.payload.permissions) {
        state.permissions = action.payload.permissions;
        localStorage.setItem("adminPermissions", JSON.stringify(state.permissions));
      }
      localStorage.setItem("adminToken", action.payload.accessToken);
      localStorage.setItem("adminRefreshToken", action.payload.refreshToken);
    },
    logOut: (state) => {
      state.user = null;
      state.permissions = [];
      state.token = null;
      state.refreshToken = null;
      state.sessionId = null;
      state.isAuth = false;
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminPermissions");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRefreshToken");
      localStorage.removeItem("adminSessionId");
    },
  },
});

export const { setUser, setToken, logOut } = authSlice.actions;
export default authSlice.reducer;
