import { baseApi } from "../../services/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Login
     *
     * Backend sets:
     * - accessToken httpOnly cookie
     * - refreshToken httpOnly cookie
     *
     * Response contains user information only.
     */
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),

      invalidatesTags: ["Auth"],
    }),

    /**
     * Get currently authenticated user
     */
    getMe: builder.query({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),

      providesTags: ["Auth"],
    }),

    /**
     * Manual refresh endpoint.
     *
     * Normally this does NOT need to be called
     * from components because baseApi handles
     * expired access tokens automatically.
     */
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    /**
     * Logout current session
     */
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),

      invalidatesTags: ["Auth"],
    }),

    /**
     * Logout all sessions
     */
    logoutAll: builder.mutation({
      query: () => ({
        url: "/auth/logout-all",
        method: "POST",
      }),

      invalidatesTags: ["Auth"],
    }),

    /**
     * Forgot password
     */
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Reset password
     */
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Auth"],
    }),

    /**
     * Change password
     */
    changePassword: builder.mutation({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Auth"],
    }),

    /**
     * Resend verification email
     */
    resendVerification: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Verify email
     */
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useResendVerificationMutation,
  useVerifyEmailMutation,
} = authApi;
