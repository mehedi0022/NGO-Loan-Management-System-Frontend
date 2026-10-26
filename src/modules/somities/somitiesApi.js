import { baseApi } from "../../services/baseApi.js";

export const somitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSomities: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search,
        status,
        meetingDay,
        fieldOfficerId,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = {}) => ({
        url: "/somities",
        method: "GET",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(status && status !== "ALL" && { status }),
          ...(meetingDay && meetingDay !== "ALL" && { meetingDay }),
          ...(fieldOfficerId && fieldOfficerId !== "ALL" && { fieldOfficerId }),
          sortBy,
          sortOrder,
        },
      }),
      providesTags: (result) => [
        "Somiti",
        ...(result?.data ?? []).map((somiti) => ({
          type: "Somiti",
          id: somiti.id,
        })),
      ],
    }),

    getActiveSomities: builder.query({
      query: () => ({
        url: "/somities/active",
        method: "GET",
      }),
      providesTags: ["Somiti"],
    }),

    getSomitiById: builder.query({
      query: (id) => ({
        url: `/somities/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Somiti", id }],
    }),

    getSomitiMembers: builder.query({
      query: (arg) => {
        const id = typeof arg === "object" ? arg.id : arg;
        const params =
          typeof arg === "object"
            ? { page: arg.page || 1, limit: arg.limit || 1000 }
            : { limit: 1000 };
        return {
          url: `/somities/${id}/members`,
          method: "GET",
          params,
        };
      },
      providesTags: (_result, _error, arg) => {
        const id = typeof arg === "object" ? arg.id : arg;
        return [
          { type: "Somiti", id: `MEMBERS-${id}` },
          "Member",
        ];
      },
    }),

    createSomiti: builder.mutation({
      query: (payload) => ({
        url: "/somities",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Somiti", "Dashboard"],
    }),

    updateSomiti: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/somities/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Somiti",
        "Dashboard",
        { type: "Somiti", id },
        { type: "Somiti", id: `MEMBERS-${id}` },
      ],
    }),

    deleteSomiti: builder.mutation({
      query: (id) => ({
        url: `/somities/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Somiti", "Dashboard"],
    }),
  }),
});

export const {
  useGetSomitiesQuery,
  useGetActiveSomitiesQuery,
  useGetSomitiByIdQuery,
  useGetSomitiMembersQuery,
  useCreateSomitiMutation,
  useUpdateSomitiMutation,
  useDeleteSomitiMutation,
} = somitiesApi;
