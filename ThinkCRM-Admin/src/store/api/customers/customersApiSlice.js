import { apiSlice } from "../apiSlice";

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({
        url: "customers",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.customers.map(({ _id }) => ({ type: "Customer", id: _id })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),
    getCustomerById: builder.query({
      query: (id) => `customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({
        url: "customers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }, "Dashboard", "Lead"],
    }),
    convertLeadToCustomer: builder.mutation({
      query: (sourceLeadId) => ({
        url: "customers",
        method: "POST",
        body: { sourceLeadId },
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }, "Customer", "Lead", "Dashboard"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, data }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
    addCustomerNote: builder.mutation({
      query: ({ id, content }) => ({
        url: `customers/${id}/notes`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    deleteCustomerNote: builder.mutation({
      query: ({ id, noteId }) => ({
        url: `customers/${id}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    addCustomerDocument: builder.mutation({
      query: ({ id, documentData }) => ({
        url: `customers/${id}/documents`,
        method: "POST",
        body: documentData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    deleteCustomerDocument: builder.mutation({
      query: ({ id, docId }) => ({
        url: `customers/${id}/documents/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    addCustomerProject: builder.mutation({
      query: ({ id, projectData }) => ({
        url: `customers/${id}/projects`,
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        { type: "Customer", id: "LIST" },
      ],
    }),
    createCustomerFollowUp: builder.mutation({
      query: ({ id, data }) => ({
        url: `customers/${id}/follow-ups`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }, "FollowUp", "Dashboard"],
    }),
    updateCustomerFollowUp: builder.mutation({
      query: ({ customerId, followUpId, data }) => ({
        url: `customers/${customerId}/follow-ups/${followUpId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: "Customer", id: customerId },
        "FollowUp",
        "Dashboard",
      ],
    }),
    deleteCustomerFollowUp: builder.mutation({
      query: ({ customerId, followUpId }) => ({
        url: `customers/${customerId}/follow-ups/${followUpId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: "Customer", id: customerId },
        "FollowUp",
        "Dashboard",
      ],
    }),
    updateCustomerNote: builder.mutation({
      query: ({ id, noteId, content }) => ({
        url: `customers/${id}/notes/${noteId}`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    importCustomers: builder.mutation({
      query: (customers) => ({
        url: "customers/import",
        method: "POST",
        body: { customers },
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }, "Dashboard"],
    }),
    sendCustomerEmail: builder.mutation({
      query: ({ id, emailData }) => ({
        url: `customers/${id}/email`,
        method: "POST",
        body: emailData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }],
    }),
    createCustomerQuotation: builder.mutation({
      query: ({ customerId, formData }) => ({
        url: `customers/${customerId}/quotations`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: "Customer", id: customerId },
        { type: "Quotation" },
        "Lead",
      ],
    }),
    sendCustomerQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `quotations/${quotationId}/send`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Customer" },
        { type: "Quotation" },
        "Lead",
      ],
    }),
    deleteCustomerQuotation: builder.mutation({
      query: (quotationId) => ({
        url: `quotations/${quotationId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Customer" },
        { type: "Quotation" },
        "Lead",
      ],
    }),
    logCustomerCall: builder.mutation({
      query: ({ customerId, data }) => ({
        url: `customers/${customerId}/calls`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: "Customer", id: customerId }],
    }),
    logCustomerWhatsApp: builder.mutation({
      query: ({ customerId, data }) => ({
        url: `customers/${customerId}/whatsapp`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { customerId }) => [{ type: "Customer", id: customerId }],
    }),
    getDuplicateCustomers: builder.query({
      query: () => "customers/duplicates",
      providesTags: ["Customer"],
    }),
    resolveDuplicateCustomers: builder.mutation({
      query: (data) => ({
        url: "customers/merge",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Customer" }, "Lead", "Dashboard"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useConvertLeadToCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useAddCustomerNoteMutation,
  useUpdateCustomerNoteMutation,
  useDeleteCustomerNoteMutation,
  useAddCustomerDocumentMutation,
  useDeleteCustomerDocumentMutation,
  useAddCustomerProjectMutation,
  useCreateCustomerFollowUpMutation,
  useUpdateCustomerFollowUpMutation,
  useDeleteCustomerFollowUpMutation,
  useSendCustomerEmailMutation,
  useCreateCustomerQuotationMutation,
  useSendCustomerQuotationMutation,
  useDeleteCustomerQuotationMutation,
  useLogCustomerCallMutation,
  useLogCustomerWhatsAppMutation,
  useGetDuplicateCustomersQuery,
  useResolveDuplicateCustomersMutation,
  useImportCustomersMutation,
} = customersApi;
