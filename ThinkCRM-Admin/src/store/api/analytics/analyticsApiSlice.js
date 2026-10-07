import { apiSlice } from "../apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query({
      query: (params) => ({
        url: "dashboard",
        params,
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardMetricsQuery } = analyticsApi;
