import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "../../services/baseApi.js";
import authReducer from "../../modules/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
