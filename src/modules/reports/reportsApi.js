import { baseApi } from "../../services/baseApi.js";

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailyCollectionsReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/daily-collections",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.fieldOfficerId && params.fieldOfficerId !== "ALL" && { fieldOfficerId: params.fieldOfficerId }),
          ...(params.collectedById && params.collectedById !== "ALL" && { collectedById: params.collectedById }),
          ...(params.paymentMethod && params.paymentMethod !== "ALL" && { paymentMethod: params.paymentMethod }),
        },
      }),
      providesTags: ["Reports", "Collections"],
    }),

    getLoanPortfolioReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/loan-portfolio",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.fieldOfficerId && params.fieldOfficerId !== "ALL" && { fieldOfficerId: params.fieldOfficerId }),
          ...(params.status && params.status !== "ALL" && { status: params.status }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
        },
      }),
      providesTags: ["Reports", "Loans"],
    }),

    getOverdueReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/overdue",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.asOfDate && { asOfDate: params.asOfDate }),
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.fieldOfficerId && params.fieldOfficerId !== "ALL" && { fieldOfficerId: params.fieldOfficerId }),
          ...(params.minDaysOverdue && { minDaysOverdue: params.minDaysOverdue }),
        },
      }),
      providesTags: ["Reports", "Loans", "Collections"],
    }),

    getSavingsSummaryReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/savings-summary",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.fieldOfficerId && params.fieldOfficerId !== "ALL" && { fieldOfficerId: params.fieldOfficerId }),
          ...(params.status && params.status !== "ALL" && { status: params.status }),
        },
      }),
      providesTags: ["Reports", "Savings"],
    }),

    getDpsSummaryReport: builder.query({
      query: (params = {}) => ({
        url: "/reports/dps-summary",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.fieldOfficerId && params.fieldOfficerId !== "ALL" && { fieldOfficerId: params.fieldOfficerId }),
          ...(params.status && params.status !== "ALL" && { status: params.status }),
        },
      }),
      providesTags: ["Reports", "DPS"],
    }),
  }),
});

export const {
  useGetDailyCollectionsReportQuery,
  useGetLoanPortfolioReportQuery,
  useGetOverdueReportQuery,
  useGetSavingsSummaryReportQuery,
  useGetDpsSummaryReportQuery,
} = reportsApi;
