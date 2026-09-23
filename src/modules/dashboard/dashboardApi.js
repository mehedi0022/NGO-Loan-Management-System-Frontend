import { baseApi } from "../../services/baseApi.js";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query({
      query: ({ date, trendDays = 7 } = {}) => ({
        url: "/dashboard/summary",
        params: {
          ...(date && { date }),
          trendDays,
        },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
