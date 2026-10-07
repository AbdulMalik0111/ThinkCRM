import { apiSlice } from "../apiSlice";

export const interactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeadMeasurements: builder.query({
      query: (leadId) => `leads/${leadId}/measurements`,
      providesTags: (result, error, leadId) => [{ type: "Measurement", id: `List-${leadId}` }],
    }),
    createMeasurement: builder.mutation({
      query: ({ leadId, data }) => ({
        url: `leads/${leadId}/measurements`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Measurement", id: `List-${leadId}` },
        { type: "Lead", id: `Activity-${leadId}` },
        { type: "Lead", id: leadId },
      ],
    }),
    getLeadQuotations: builder.query({
      query: (leadId) => `leads/${leadId}/quotations`,
      providesTags: (result, error, leadId) => [{ type: "Quotation", id: `List-${leadId}` }],
    }),
    createQuotation: builder.mutation({
      query: ({ leadId, formData }) => ({
        url: `leads/${leadId}/quotations`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Quotation", id: `List-${leadId}` },
        { type: "Lead", id: `Activity-${leadId}` },
        { type: "Lead", id: leadId },
      ],
    }),
    sendQuotation: builder.mutation({
      query: ({ leadId, quotationId }) => ({
        url: `leads/${leadId}/quotations/${quotationId}/send`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { leadId }) => [
        { type: "Quotation", id: `List-${leadId}` },
        { type: "Lead", id: `Activity-${leadId}` },
        { type: "Lead", id: leadId },
      ],
    }),
  }),
});

export const {
  useGetLeadMeasurementsQuery,
  useCreateMeasurementMutation,
  useGetLeadQuotationsQuery,
  useCreateQuotationMutation,
  useSendQuotationMutation,
} = interactionsApi;
