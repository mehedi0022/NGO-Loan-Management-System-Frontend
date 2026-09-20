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
  }),
});

export const { useCreateMemberMutation } = membersApi;
