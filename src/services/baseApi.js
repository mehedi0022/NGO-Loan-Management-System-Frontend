import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",

  credentials: "include",
});

const baseQueryWithAuthHandling = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const requestUrl = typeof args === "string" ? args : args.url;

  const skipRefresh =
    requestUrl === "/auth/login" ||
    requestUrl === "/auth/refresh" ||
    requestUrl === "/auth/logout";

  /**
   * Access token may have expired.
   *
   * Try refreshing the session using the
   * httpOnly refresh-token cookie.
   */
  if (result.error?.status === 401 && !skipRefresh) {
    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
      },
      api,
      extraOptions,
    );

    /**
     * Refresh succeeded.
     *
     * Backend has already set a new
     * accessToken httpOnly cookie.
     *
     * Retry the original request.
     */
    if (!refreshResult.error) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithAuthHandling,

  tagTypes: [
    "Auth",
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
