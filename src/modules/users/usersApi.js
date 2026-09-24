import { baseApi } from "../../services/baseApi.js";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({
        page = 1,
        limit = 10,
        search,
        role,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = {}) => ({
        url: "/users",
        params: {
          page,
          limit,
          ...(search && { search }),
          ...(role && { role }),
          ...(status && { status }),
          sortBy,
          sortOrder,
        },
      }),
      providesTags: (result) => [
        "Users",
        ...(result?.data ?? []).map((user) => ({ type: "Users", id: user.id })),
      ],
    }),

    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),

    createUser: builder.mutation({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),

    updateUser: builder.mutation({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        "Users",
        { type: "Users", id },
      ],
    }),

    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Users",
        "Auth",
        { type: "Users", id },
      ],
    }),

    changeUserStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Users",
        "Auth",
        { type: "Users", id },
      ],
    }),

    resetUserPassword: builder.mutation({
      query: ({ id, newPassword }) => ({
        url: `/users/${id}/reset-password`,
        method: "POST",
        body: { newPassword },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
  useChangeUserStatusMutation,
  useResetUserPasswordMutation,
} = usersApi;
