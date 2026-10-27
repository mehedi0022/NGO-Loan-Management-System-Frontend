import { baseApi } from "../../services/baseApi.js";

export const accountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query({
      query: () => "/accounts",
      providesTags: (result) => {
        const list = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.data?.accounts)
          ? result.data.accounts
          : [];

        return [
          "Accounts",
          ...list.map((account) => ({ type: "Accounts", id: account.id })),
        ];
      },
    }),

    getAccountById: builder.query({
      query: (id) => `/accounts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Accounts", id }],
    }),

    createAccount: builder.mutation({
      query: (body) => ({
        url: "/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounts"],
    }),

    updateAccount: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/accounts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Accounts",
        { type: "Accounts", id },
      ],
    }),

    transferFunds: builder.mutation({
      query: (body) => ({
        url: "/accounts/transfer",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounts", "AccountTransactions"],
    }),

    injectCapital: builder.mutation({
      query: (body) => ({
        url: "/accounts/inject-capital",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounts", "AccountTransactions"],
    }),

    getTransactions: builder.query({
      query: (params = {}) => ({
        url: "/accounts/transactions",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.accountId && params.accountId !== "ALL" && { accountId: params.accountId }),
          ...(params.sourceModule && params.sourceModule !== "ALL" && { sourceModule: params.sourceModule }),
          ...(params.type && params.type !== "ALL" && { type: params.type }),
          ...(params.fromDate && { fromDate: params.fromDate }),
          ...(params.toDate && { toDate: params.toDate }),
        },
      }),
      providesTags: ["AccountTransactions"],
    }),

    getDailyCashSheet: builder.query({
      query: (params = {}) => ({
        url: "/accounts/daily-cash-sheet",
        method: "GET",
        params: {
          ...(params.date && { date: params.date }),
          ...(params.accountId && { accountId: params.accountId }),
        },
      }),
      providesTags: ["AccountTransactions"],
    }),

    getProfitLoss: builder.query({
      query: (params = {}) => ({
        url: "/accounts/profit-loss",
        method: "GET",
        params: {
          ...(params.fromDate && { fromDate: params.fromDate }),
          ...(params.toDate && { toDate: params.toDate }),
        },
      }),
      providesTags: ["AccountTransactions", "IncomeExpense"],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useTransferFundsMutation,
  useInjectCapitalMutation,
  useGetTransactionsQuery,
  useGetDailyCashSheetQuery,
  useGetProfitLossQuery,
} = accountsApi;
