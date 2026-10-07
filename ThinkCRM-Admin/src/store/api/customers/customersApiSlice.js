import { apiSlice } from "../apiSlice";

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({
        url: "customers",
        params,
      }),
      providesTags: ["Customer"],
    }),
    getCustomerById: builder.query({
      query: (id) => `customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    convertLeadToCustomer: builder.mutation({
      query: (sourceLeadId) => ({
        url: "customers",
        method: "POST",
        body: { sourceLeadId },
      }),
      invalidatesTags: ["Customer", "Lead", "Dashboard"],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, data }) => ({
        url: `customers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        "Customer",
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useConvertLeadToCustomerMutation,
  useUpdateCustomerMutation,
} = customersApi;
