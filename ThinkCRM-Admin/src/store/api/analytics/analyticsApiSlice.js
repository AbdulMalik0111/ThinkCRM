import { apiSlice } from "../apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: (params) => ({
        url: "admin/analytics/dashboard",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getMedicineDemand: builder.query({
      query: (params) => ({
        url: "admin/analytics/medicine-demand",
        params,
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetDashboardMetricsQuery, useGetMedicineDemandQuery } = analyticsApi;
