import { baseApi } from "../../services/baseApi.js";

export const dpsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDpsAccounts: builder.query({
      query: (params) => ({
        url: "/dps",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data?.accounts
          ? [
              ...result.data.accounts.map(({ id }) => ({ type: "DPS", id })),
              { type: "DPS", id: "LIST" },
            ]
          : [{ type: "DPS", id: "LIST" }],
    }),

    getDpsAccountById: builder.query({
      query: (id) => ({
        url: `/dps/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "DPS", id }],
    }),

    calculateDpsMaturity: builder.query({
      query: ({ monthlyAmount, durationMonths, interestRate }) => ({
        url: "/dps/calculator",
        method: "GET",
        params: { monthlyAmount, durationMonths, interestRate },
      }),
    }),

    createDpsAccount: builder.mutation({
      query: (payload) => ({
        url: "/dps",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["DPS", "Member", "Dashboard"],
    }),

    depositDpsInstallment: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/dps/${id}/deposit`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DPS", id },
        { type: "DPS", id: "LIST" },
        "Member",
        "Dashboard",
      ],
    }),

    closeDpsAccount: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/dps/${id}/close`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DPS", id },
        { type: "DPS", id: "LIST" },
        "Member",
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetDpsAccountsQuery,
  useGetDpsAccountByIdQuery,
  useLazyCalculateDpsMaturityQuery,
  useCreateDpsAccountMutation,
  useDepositDpsInstallmentMutation,
  useCloseDpsAccountMutation,
} = dpsApi;
