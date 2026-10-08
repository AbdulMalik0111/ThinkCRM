import { apiSlice } from "../apiSlice";

export const managementApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({
        url: "customers",
        params,
      }),
      providesTags: ["Customer"],
    }),
    getCustomerById: builder.query({
      query: (id) => ({
        url: `customers/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({
        url: "customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Customer"],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customer"],
    }),
    getCoupons: builder.query({
      query: (params) => ({
        url: "coupons",
        params,
      }),
      providesTags: ["Coupon"],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({
        url: "coupons",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `coupons/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),
    getMedicineRequests: builder.query({
      query: (params) => ({
        url: "medicine-requests",
        params,
      }),
      providesTags: ["MedicineRequest"],
    }),
    updateMedicineRequestStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `medicine-requests/${id}/status`,
        method: "PATCH",
        body: { status }
      }),
      invalidatesTags: ["MedicineRequest"],
    }),
    getReports: builder.query({
      query: (type) => ({
        url: `reports/${type}`,
        method: "GET",
      }),
      providesTags: ["Report"],
    }),
    getNotifications: builder.query({
      query: (params) => ({
        url: "notifications",
        params,
      }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notification"],
    }),
    
    // Staff Management
    getStaff: builder.query({
      query: (params) => ({
        url: "staff",
        params,
      }),
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation({
      query: (data) => ({
        url: "staff",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `staff/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Staff"],
    }),
    suspendStaff: builder.mutation({
      query: (id) => ({
        url: `staff/${id}`,
        method: "PATCH",
        body: { status: 'suspended', isActive: false },
      }),
      invalidatesTags: ["Staff"],
    }),
    reactivateStaff: builder.mutation({
      query: (id) => ({
        url: `staff/${id}`,
        method: "PATCH",
        body: { status: 'active', isActive: true },
      }),
      invalidatesTags: ["Staff"],
    }),
    resetStaffPassword: builder.mutation({
      query: (id) => ({
        url: `staff/${id}/reset-password`,
        method: "POST",
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),
    getPermissionsRegistry: builder.query({
      query: () => "permissions",
    }),
    getStaffActivity: builder.query({
      query: ({ id, ...params }) => ({
        url: `staff/${id}/activity`,
        params,
      }),
      providesTags: ["StaffActivity"],
    }),
    
    // Settings
    getSystemSettings: builder.query({
      query: () => "settings",
      providesTags: ["SystemSetting"],
    }),
    updateSystemSettings: builder.mutation({
      query: (data) => ({
        url: "settings",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SystemSetting"],
    }),
    
    // Audit Logs
    getAuditLogs: builder.query({
      query: (params) => ({
        url: "audit-logs",
        params,
      }),
      providesTags: ["AuditLog"],
    }),
    getDashboardData: builder.query({
      query: (params) => ({
        url: "analytics/dashboard",
        method: "GET",
        params
      }),
    }),
    getGlobalSearch: builder.query({
      query: (params) => ({
        url: "search",
        method: "GET",
        params
      }),
    }),
  }),
});

export const { 
  useGetCustomersQuery, 
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useGetMedicineRequestsQuery,
  useUpdateMedicineRequestStatusMutation,
  useGetReportsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetStaffQuery,
  useGetGlobalSearchQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSuspendStaffMutation,
  useReactivateStaffMutation,
  useResetStaffPasswordMutation,
  useDeleteStaffMutation,
  useGetPermissionsRegistryQuery,
  useGetStaffActivityQuery,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetAuditLogsQuery
} = managementApi;
