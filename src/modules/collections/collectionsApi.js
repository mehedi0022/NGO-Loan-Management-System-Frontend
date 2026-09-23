import { baseApi } from "../../services/baseApi.js";

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /collections/installments
     *
     * Get due installments for the daily collection sheet.
     */
    getDueInstallments: builder.query({
      query: (dueDate) => ({
        url: "/collections/installments",
        params: { dueDate },
      }),

      providesTags: (_result, _error, dueDate) => [
        "Collections",
        {
          type: "Collections",
          id: `DUE-${dueDate}`,
        },
      ],
    }),

    /**
     * POST /collections
     *
     * Single member collection.
     *
     * Supports:
     * - Loan only
     * - Loan + savings
     * - General savings only
     * - Special savings only
     * - Both savings
     */
    createCollection: builder.mutation({
      query: (payload) => ({
        url: "/collections",
        method: "POST",
        body: payload,
      }),

      invalidatesTags: ["Collections", "Loans", "Savings", "Member", "Dashboard"],
    }),

    /**
     * POST /collections/batch
     *
     * Used by the daily collection sheet
     * to collect from multiple members.
     */
    createBatchCollections: builder.mutation({
      query: (payload) => ({
        url: "/collections/batch",
        method: "POST",
        body: payload,
      }),

      invalidatesTags: ["Collections", "Loans", "Savings", "Member", "Dashboard"],
    }),

    /**
     * GET /collections
     *
     * Collection history.
     *
     * Supported params:
     * - memberId
     * - fromDate
     * - toDate
     * - page
     * - limit
     */
    getCollections: builder.query({
      query: (params = {}) => ({
        url: "/collections",
        params,
      }),

      providesTags: ["Collections"],
    }),

    /**
     * GET /collections/:collectionId
     *
     * Get collection receipt/details.
     *
     * IMPORTANT:
     * collectionId here is the numeric database ID
     * expected by the current backend route.
     */
    getCollectionById: builder.query({
      query: (collectionId) => ({
        url: `/collections/${collectionId}`,
      }),

      providesTags: (_result, _error, collectionId) => [
        {
          type: "Collections",
          id: String(collectionId),
        },
      ],
    }),
  }),
});

export const {
  useGetDueInstallmentsQuery,

  useCreateCollectionMutation,
  useCreateBatchCollectionsMutation,

  useGetCollectionsQuery,
  useGetCollectionByIdQuery,
} = collectionsApi;
