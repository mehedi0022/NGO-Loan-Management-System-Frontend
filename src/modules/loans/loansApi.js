import { baseApi } from "../../services/baseApi.js";

export const loansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLoan: builder.mutation({
      query: (payload) => ({
        url: "/loans",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Loans"],
    }),
    updateLoan: builder.mutation({
      query: ({ id, payload }) => ({ url: `/loans/${id}`, method: "PATCH", body: payload }),
      invalidatesTags: (_result, _error, { id }) => ["Loans", { type: "Loans", id }],
    }),
    approveLoan: builder.mutation({ query: (id) => ({ url: `/loans/${id}/approve`, method: "PATCH" }), invalidatesTags: (_result, _error, id) => ["Loans", { type: "Loans", id }] }),
    rejectLoan: builder.mutation({ query: ({ id, rejectionReason }) => ({ url: `/loans/${id}/reject`, method: "PATCH", body: { rejectionReason } }), invalidatesTags: (_result, _error, { id }) => ["Loans", { type: "Loans", id }] }),
    disburseLoan: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/loans/${id}/disburse`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => ["Loans", { type: "Loans", id }],
    }),
    getLoans: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search,
        status,
        frequency,
        memberId,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = {}) => ({
        url: "/loans",
        method: "GET",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(status && { status }),
          ...(frequency && { frequency }),
          ...(memberId && { memberId }),
          sortBy,
          sortOrder,
        },
      }),
      providesTags: ["Loans"],
    }),
    getLoanById: builder.query({
      query: (id) => ({ url: `/loans/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Loans", id }],
    }),
  }),
});

export const {
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useDisburseLoanMutation,
  useGetLoansQuery,
  useGetLoanByIdQuery,
} = loansApi;
