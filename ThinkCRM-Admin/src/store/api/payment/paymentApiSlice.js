import { apiSlice } from "../apiSlice";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({
        url: "admin/payments",
        params,
      }),
      providesTags: ["Payment"],
    }),
  }),
});

export const { useGetPaymentsQuery } = paymentApi;
