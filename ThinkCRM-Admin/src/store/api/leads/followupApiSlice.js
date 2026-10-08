import { apiSlice } from "../apiSlice";

export const followupApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeadFollowUps: builder.query({
      query: (leadId) => `leads/${leadId}/follow-ups`,
      providesTags: (result, error, leadId) => [{ type: "FollowUp", id: `List-${leadId}` }],
    }),
    createFollowUp: builder.mutation({
      query: ({ leadId, data }) => ({
        url: `leads/${leadId}/follow-ups`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "FollowUp", id: `List-${leadId}` },
        { type: "Lead", id: `Activity-${leadId}` }, // invalidates activity timeline
        "Dashboard"
      ],
    }),
    updateFollowUp: builder.mutation({
      query: ({ id, data }) => ({
        url: `follow-ups/${id}`,
        method: "PATCH",
        body: data,
      }),
      // We don't have leadId here easily without looking at result, so invalidate broadly or parse result
      invalidatesTags: (result) => result?.data?.followUp?.leadId ? [
        { type: "FollowUp", id: `List-${result.data.followUp.leadId}` },
        { type: "Lead", id: `Activity-${result.data.followUp.leadId}` },
        "Dashboard"
      ] : ["FollowUp", "Dashboard"],
    }),
    getAllFollowUps: builder.query({
      query: () => "follow-ups",
      providesTags: ["FollowUp"],
    }),
  }),
});

export const {
  useGetLeadFollowUpsQuery,
  useGetAllFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
} = followupApi;
