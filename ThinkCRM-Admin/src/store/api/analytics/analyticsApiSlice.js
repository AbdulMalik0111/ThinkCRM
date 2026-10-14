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
    getAnalyticsOverview: builder.query({
      query: (params) => ({
        url: "reports/analytics",
        params,
      }),
      providesTags: ["Reports", "Dashboard", "Lead"],
    }),
    getExportReport: builder.query({
      query: (params) => ({
        url: "reports/export",
        params,
      }),
    }),
    getLeadReports: builder.query({
      query: (params) => ({
        url: "reports/leads",
        params,
      }),
      providesTags: ["Reports"],
    }),
    getSalesReports: builder.query({
      query: (params) => ({
        url: "reports/sales",
        params,
      }),
      providesTags: ["Reports"],
    }),
    getStaffReports: builder.query({
      query: (params) => ({
        url: "reports/staff",
        params,
      }),
      providesTags: ["Reports"],
    }),
    getDetailedRecords: builder.query({
      query: (params) => ({
        url: "reports/records",
        params,
      }),
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetAnalyticsOverviewQuery,
  useLazyGetExportReportQuery,
  useGetLeadReportsQuery,
  useGetSalesReportsQuery,
  useGetStaffReportsQuery,
  useGetDetailedRecordsQuery,
} = analyticsApi;
