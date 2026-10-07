import { apiSlice } from "../apiSlice";

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params) => ({
        url: "admin/orders",
        params,
      }),
      providesTags: ["Order"],
    }),
    getOrderById: builder.query({
      query: (id) => `admin/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    getPrescriptions: builder.query({
      query: (params) => ({
        url: "admin/prescriptions",
        method: "GET",
        params: params,
      }),
      providesTags: ["Prescription"],
    }),
    approvePrescription: builder.mutation({
      query: (orderId) => ({
        url: `admin/prescriptions/${orderId}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Prescription", "Order"],
    }),
    rejectPrescription: builder.mutation({
      query: ({ orderId, reason }) => ({
        url: `admin/prescriptions/${orderId}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Prescription", "Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status, reason }) => ({
        url: `admin/orders/${orderId}/status`,
        method: "PATCH",
        body: { status, reason },
      }),
      invalidatesTags: ["Order"],
    }),
    cancelOrder: builder.mutation({
      query: ({ orderId, reason }) => ({
        url: `admin/orders/${orderId}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Order"],
    }),
    processReturn: builder.mutation({
      query: ({ orderId, action, reason, condition, itemsToReturn }) => ({
        url: `admin/orders/${orderId}/return`,
        method: "POST",
        body: { action, reason, condition, itemsToReturn },
      }),
      invalidatesTags: ["Order"],
    }),
    processRefund: builder.mutation({
      query: ({ orderId, reason, refundMethod, refundReference }) => ({
        url: `admin/orders/${orderId}/refund`,
        method: "POST",
        body: { reason, refundMethod, refundReference },
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const { 
  useGetOrdersQuery, 
  useGetOrderByIdQuery,
  useGetPrescriptionsQuery,
  useApprovePrescriptionMutation,
  useRejectPrescriptionMutation,
  useUpdateOrderStatusMutation,
  useCancelOrderMutation,
  useProcessReturnMutation,
  useProcessRefundMutation
} = orderApi;
