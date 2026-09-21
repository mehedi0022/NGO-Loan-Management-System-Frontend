import { baseApi } from "../../services/baseApi.js";

export const membersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createMember: builder.mutation({
      query: (payload) => ({
        url: "/members",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Member"],
    }),

    getAllMembers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search,
        status,
        district,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = {}) => ({
        url: "/members",
        method: "GET",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(status && { status }),
          ...(district && { district }),
          sortBy,
          sortOrder,
        },
      }),

      providesTags: ["Member"],
    }),

    getMemberById: builder.query({
      query: (id) => ({
        url: `/members/${id}`,
        method: "GET",
      }),

      providesTags: (_result, _error, id) => [
        {
          type: "Member",
          id,
        },
      ],
    }),

    updateMember: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/members/${id}`,
        method: "PATCH",
        body: payload,
      }),

      invalidatesTags: (_result, _error, { id }) => [
        "Member",
        {
          type: "Member",
          id,
        },
      ],
    }),
  }),
});

export const {
  useCreateMemberMutation,
  useGetAllMembersQuery,
  useGetMemberByIdQuery,
  useUpdateMemberMutation,
} = membersApi;
