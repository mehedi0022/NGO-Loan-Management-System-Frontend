import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  credentials: "include",
});

const baseQueryWithAuthHandling = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Refresh-token handling can be added here when authentication is introduced.
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: [
    "Dashboard",
    "Members",
    "Loans",
    "Collections",
    "Savings",
    "Transactions",
    "Reports",
    "Users",
  ],
  endpoints: () => ({}),
});
