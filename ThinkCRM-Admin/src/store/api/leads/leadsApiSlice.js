import { apiSlice } from "../apiSlice";

export const leadsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: (params) => ({
        url: "leads",
        params,
      }),
      providesTags: ["Lead"],
    }),
    getLeadById: builder.query({
      query: (id) => `leads/${id}`,
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),
    createLead: builder.mutation({
      query: (data) => ({
        url: "leads",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Lead", "Dashboard"],
    }),
    updateLead: builder.mutation({
      query: ({ id, data }) => ({
        url: `leads/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        "Lead",
        "Dashboard",
      ],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({
        url: `leads/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Lead", "Dashboard"],
    }),
    assignLead: builder.mutation({
      query: ({ id, staffId }) => ({
        url: `leads/${id}/assign`,
        method: "POST",
        body: { staffId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        "Lead",
      ],
    }),
    getLeadActivities: builder.query({
      query: (id) => `leads/${id}/activities`,
      providesTags: (result, error, id) => [{ type: "Lead", id: `Activity-${id}` }],
    }),
    getLeadStats: builder.query({
      query: () => "leads/stats",
      providesTags: ["LeadStats", "Lead"],
    }),
    convertLeadToCustomer: builder.mutation({
      query: (id) => ({
        url: `leads/${id}/convert`,
        method: "POST",
      }),
      invalidatesTags: ["Lead", "Customer", "Dashboard", "LeadStats"],
    }),
    addLeadNote: builder.mutation({
      query: ({ id, content }) => ({
        url: `leads/${id}/notes`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        { type: "Lead", id: `Activity-${id}` },
        "Lead",
      ],
    }),
    sendLeadEmail: builder.mutation({
      query: ({ id, emailData }) => ({
        url: `leads/${id}/email`,
        method: "POST",
        body: emailData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        { type: "Lead", id: `Activity-${id}` },
      ],
    }),
    bulkAssignLeads: builder.mutation({
      query: ({ leadIds, assignedTo }) => ({
        url: "leads/bulk/assign",
        method: "POST",
        body: { leadIds, assignedTo },
      }),
      invalidatesTags: ["Lead"],
    }),
    bulkUpdateStatus: builder.mutation({
      query: ({ leadIds, status }) => ({
        url: "leads/bulk/status",
        method: "POST",
        body: { leadIds, status },
      }),
      invalidatesTags: ["Lead", "LeadStats"],
    }),
    bulkDeleteLeads: builder.mutation({
      query: ({ leadIds }) => ({
        url: "leads/bulk/delete",
        method: "POST",
        body: { leadIds },
      }),
      invalidatesTags: ["Lead", "LeadStats", "Dashboard"],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadByIdQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useAssignLeadMutation,
  useGetLeadActivitiesQuery,
  useGetLeadStatsQuery,
  useConvertLeadToCustomerMutation,
  useAddLeadNoteMutation,
  useSendLeadEmailMutation,
  useBulkAssignLeadsMutation,
  useBulkUpdateStatusMutation,
  useBulkDeleteLeadsMutation,
} = leadsApi;

