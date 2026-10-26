import { baseApi } from "../../services/baseApi.js";

export const incomeExpenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeExpenses: builder.query({
      query: (params = {}) => ({
        url: "/income-expense",
        method: "GET",
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.type && params.type !== "ALL" && { type: params.type }),
          ...(params.categoryId && params.categoryId !== "ALL" && { categoryId: params.categoryId }),
          ...(params.somitiId && params.somitiId !== "ALL" && { somitiId: params.somitiId }),
          ...(params.paymentMethod && params.paymentMethod !== "ALL" && { paymentMethod: params.paymentMethod }),
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.search && { search: params.search }),
        },
      }),
      providesTags: (result) => [
        "IncomeExpense",
        ...(result?.data ?? []).map((item) => ({ type: "IncomeExpense", id: item.id })),
      ],
    }),

    getIncomeExpenseById: builder.query({
      query: (id) => `/income-expense/${id}`,
      providesTags: (_result, _error, id) => [{ type: "IncomeExpense", id }],
    }),

    createIncomeExpense: builder.mutation({
      query: (body) => ({
        url: "/income-expense",
        method: "POST",
        body,
      }),
      invalidatesTags: ["IncomeExpense"],
    }),

    updateIncomeExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/income-expense/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "IncomeExpense",
        { type: "IncomeExpense", id },
      ],
    }),

    deleteIncomeExpense: builder.mutation({
      query: (id) => ({
        url: `/income-expense/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["IncomeExpense"],
    }),

    // Category Endpoints
    getCategories: builder.query({
      query: (params = {}) => ({
        url: "/income-expense/categories",
        method: "GET",
        params: {
          ...(params.type && params.type !== "ALL" && { type: params.type }),
          ...(params.isActive !== undefined && { isActive: params.isActive }),
        },
      }),
      providesTags: ["Categories"],
    }),

    createCategory: builder.mutation({
      query: (body) => ({
        url: "/income-expense/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories"],
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/income-expense/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Categories", "IncomeExpense"],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/income-expense/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetIncomeExpensesQuery,
  useGetIncomeExpenseByIdQuery,
  useCreateIncomeExpenseMutation,
  useUpdateIncomeExpenseMutation,
  useDeleteIncomeExpenseMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = incomeExpenseApi;
