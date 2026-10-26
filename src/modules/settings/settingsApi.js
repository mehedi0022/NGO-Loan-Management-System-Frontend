import { baseApi } from "../../services/baseApi.js";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => ({
        url: "/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation({
      query: (body) => ({
        url: "/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useChangePasswordMutation,
} = settingsApi;
