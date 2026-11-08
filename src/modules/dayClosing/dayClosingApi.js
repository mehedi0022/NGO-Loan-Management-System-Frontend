import { baseApi } from "../../services/baseApi.js";

export const dayClosingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveBusinessDay: builder.query({
      query: () => "/day-closing/active",
      providesTags: ["DayClosing"],
    }),

    getDayClosingPreview: builder.query({
      query: () => "/day-closing/preview",
      providesTags: ["DayClosingPreview", "DayClosing"],
    }),

    executeDayClosing: builder.mutation({
      query: (body) => ({
        url: "/day-closing/close",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "DayClosing",
        "DayClosingPreview",
        "DayClosingHistory",
        "Accounts",
        "AccountTransactions",
        "Dashboard",
        "Collections",
        "Loans",
        "Savings",
        "Dps",
      ],
    }),

    reopenDay: builder.mutation({
      query: (body) => ({
        url: "/day-closing/reopen",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "DayClosing",
        "DayClosingPreview",
        "DayClosingHistory",
        "Accounts",
        "AccountTransactions",
        "Dashboard",
        "Collections",
        "Loans",
        "Savings",
        "Dps",
      ],
    }),

    getDayClosingHistory: builder.query({
      query: (params = {}) => ({
        url: "/day-closing/history",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.fromDate && { fromDate: params.fromDate }),
          ...(params.toDate && { toDate: params.toDate }),
          ...(params.status && { status: params.status }),
        },
      }),
      providesTags: ["DayClosingHistory", "DayClosing"],
    }),
  }),
});

export const {
  useGetActiveBusinessDayQuery,
  useGetDayClosingPreviewQuery,
  useExecuteDayClosingMutation,
  useReopenDayMutation,
  useGetDayClosingHistoryQuery,
} = dayClosingApi;
