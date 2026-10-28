import { baseApi } from "../../services/baseApi.js";

export const savingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMemberSavings: builder.query({
      query: (memberId) => `/savings/members/${memberId}`,
      providesTags: (_result, _error, memberId) => [
        "Savings",
        { type: "Savings", id: `MEMBER-${memberId}` },
      ],
    }),
    withdrawSavings: builder.mutation({
      query: (payload) => ({
        url: "/savings/withdrawals",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { memberId }) => [
        "Savings",
        "Member",
        "Dashboard",
        { type: "Savings", id: `MEMBER-${memberId}` },
        { type: "Savings", id: `MEMBER-TRANSACTIONS-${memberId}` },
        { type: "Member", id: memberId },
      ],
    }),
    reverseSavingsTransaction: builder.mutation({
      query: ({ transactionId, reason }) => ({
        url: `/savings/transactions/${transactionId}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        "Savings",
        "Member",
        "Dashboard",
        "Accounts",
      ],
    }),
  }),
});

export const {
  useGetMemberSavingsQuery,
  useWithdrawSavingsMutation,
  useReverseSavingsTransactionMutation,
} = savingsApi;
