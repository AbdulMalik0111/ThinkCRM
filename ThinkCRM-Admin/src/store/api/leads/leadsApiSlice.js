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
} = leadsApi;
