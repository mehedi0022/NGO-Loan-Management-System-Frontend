import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    setAuthInitialized: (state, action) => {
      state.initialized = action.payload;
    },
  },
});

export const { setUser, clearAuth, setAuthInitialized } = authSlice.actions;

export default authSlice.reducer;
