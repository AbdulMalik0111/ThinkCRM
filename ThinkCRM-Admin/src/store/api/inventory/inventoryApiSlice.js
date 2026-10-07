import { apiSlice } from "../apiSlice";

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryStats: builder.query({
      query: () => "admin/inventory/overview",
      providesTags: ["Inventory"],
    }),
    getInventoryList: builder.query({
      query: (params) => ({
        url: "inventory/inventory",
        params,
      }),
      providesTags: ["Inventory"],
    }),
    getBatches: builder.query({
      query: (params) => ({
        url: "admin/inventory/batches",
        params,
      }),
      providesTags: ["Batch"],
    }),
    getLedger: builder.query({
      query: (params) => ({
        url: "admin/inventory/ledger",
        params,
      }),
      providesTags: ["Ledger"],
    }),
    uploadInventoryCsv: builder.mutation({
      query: (formData) => ({
        url: "admin/inventory/import/upload",
        method: "POST",
        body: formData,
      }),
    }),
    confirmInventoryCsv: builder.mutation({
      query: (importId) => ({
        url: "admin/inventory/import/confirm",
        method: "POST",
        body: { importId },
      }),
      invalidatesTags: ["Inventory", "Batch", "Ledger"],
    }),
    adjustStock: builder.mutation({
      query: ({ id, data }) => ({
        url: `admin/inventory/batches/${id}/adjust`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Inventory", "Batch", "Ledger"],
    }),
    getSuppliers: builder.query({
      query: (params) => ({
        url: "inventory/suppliers",
        params,
      }),
      providesTags: ["Supplier"],
    }),
    getSupplierById: builder.query({
      query: (id) => ({
        url: `inventory/suppliers/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Supplier", id }],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({
        url: "inventory/suppliers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Supplier"],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `inventory/suppliers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Supplier"],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `inventory/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Supplier"],
    }),
    getPurchases: builder.query({
      query: (params) => ({
        url: "inventory/purchases",
        params,
      }),
      providesTags: ["Purchase"],
    }),
    getPurchaseById: builder.query({
      query: (id) => ({
        url: `inventory/purchases/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Purchase", id }],
    }),
    createPurchase: builder.mutation({
      query: (data) => ({
        url: "inventory/purchases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Purchase"],
    }),
    receivePurchase: builder.mutation({
      query: ({ id, data }) => ({
        url: `inventory/purchases/${id}/receive`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Purchase", "Inventory", "Batch", "Ledger"],
    }),
    getLowStockItems: builder.query({
      query: (params) => ({
        url: "admin/inventory/low-stock",
        params,
      }),
      providesTags: ["Inventory"],
    }),
    getExpiringBatches: builder.query({
      query: (params) => ({
        url: "admin/inventory/expiry",
        params,
      }),
      providesTags: ["Batch"],
    }),
    markBatchExpired: builder.mutation({
      query: ({ id, data }) => ({
        url: `admin/inventory/batches/${id}/expire`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Inventory", "Batch", "Ledger"],
    }),
    updateBatch: builder.mutation({
      query: ({ id, data }) => ({
        url: `admin/inventory/batches/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Batch", "Inventory"],
    }),
  }),
});

export const { 
  useGetInventoryStatsQuery, 
  useGetInventoryListQuery,
  useGetBatchesQuery, 
  useGetLedgerQuery,
  useUploadInventoryCsvMutation,
  useConfirmInventoryCsvMutation,
  useAdjustStockMutation,
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPurchasesQuery,
  useGetPurchaseByIdQuery,
  useCreatePurchaseMutation,
  useReceivePurchaseMutation,
  useGetLowStockItemsQuery,
  useGetExpiringBatchesQuery,
  useMarkBatchExpiredMutation,
  useUpdateBatchMutation
} = inventoryApi;
