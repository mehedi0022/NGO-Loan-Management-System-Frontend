import { baseApi } from "../../services/baseApi.js";

export const migrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMigrationTemplate: builder.query({
      query: () => "/migration/template",
    }),

    getMigrationStatus: builder.query({
      query: () => "/migration/status",
      providesTags: ["MigrationStatus", "Settings"],
    }),

    toggleMigrationLock: builder.mutation({
      query: (locked) => ({
        url: "/migration/lock",
        method: "PATCH",
        body: { locked },
      }),
      invalidatesTags: ["MigrationStatus", "Settings"],
    }),

    migrateSingleMember: builder.mutation({
      query: (payload) => ({
        url: "/migration/single",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Member", "Loans", "Savings", "DPS", "Dashboard"],
    }),

    migrateBatchMembers: builder.mutation({
      query: (payload) => ({
        url: "/migration/batch",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Member", "Loans", "Savings", "DPS", "Dashboard"],
    }),
  }),
});

export const {
  useGetMigrationTemplateQuery,
  useGetMigrationStatusQuery,
  useToggleMigrationLockMutation,
  useMigrateSingleMemberMutation,
  useMigrateBatchMembersMutation,
} = migrationApi;
