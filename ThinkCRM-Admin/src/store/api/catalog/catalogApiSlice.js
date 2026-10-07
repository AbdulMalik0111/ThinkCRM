import { apiSlice } from "../apiSlice";

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Categories
    getCategories: builder.query({
      query: (params) => ({ url: "catalog/categories", params }),
      providesTags: ["Category"],
    }),
    getCategory: builder.query({
      query: (id) => `catalog/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    createCategory: builder.mutation({
      query: (body) => ({
        url: "catalog/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `catalog/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }, "Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `catalog/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
    uploadCategoryImage: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `catalog/categories/${id}/image`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }, "Category"],
    }),
    deleteCategoryImage: builder.mutation({
      query: (id) => ({
        url: `catalog/categories/${id}/image`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Category", id }, "Category"],
    }),

    // Brands
    getBrands: builder.query({
      query: (params) => ({ url: "catalog/brands", params }),
      providesTags: ["Brand"],
    }),
    getBrand: builder.query({
      query: (id) => `catalog/brands/${id}`,
      providesTags: (result, error, id) => [{ type: "Brand", id }],
    }),
    createBrand: builder.mutation({
      query: (body) => ({
        url: "catalog/brands",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Brand"],
    }),
    updateBrand: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `catalog/brands/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Brand", id }, "Brand"],
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `catalog/brands/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Brand"],
    }),

    // Manufacturers
    getManufacturers: builder.query({
      query: (params) => ({ url: "catalog/manufacturers", params }),
      providesTags: ["Manufacturer"],
    }),
    getManufacturer: builder.query({
      query: (id) => `catalog/manufacturers/${id}`,
      providesTags: (result, error, id) => [{ type: "Manufacturer", id }],
    }),
    createManufacturer: builder.mutation({
      query: (body) => ({
        url: "catalog/manufacturers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Manufacturer"],
    }),
    updateManufacturer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `catalog/manufacturers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Manufacturer", id }, "Manufacturer"],
    }),
    deleteManufacturer: builder.mutation({
      query: (id) => ({
        url: `catalog/manufacturers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Manufacturer"],
    }),

    // Salts
    getSalts: builder.query({
      query: (params) => ({ url: "catalog/salts", params }),
      providesTags: ["Salt"],
    }),
    getSalt: builder.query({
      query: (id) => `catalog/salts/${id}`,
      providesTags: (result, error, id) => [{ type: "Salt", id }],
    }),
    createSalt: builder.mutation({
      query: (body) => ({
        url: "catalog/salts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Salt"],
    }),
    updateSalt: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `catalog/salts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Salt", id }, "Salt"],
    }),
    deleteSalt: builder.mutation({
      query: (id) => ({
        url: `catalog/salts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Salt"],
    }),

    // Products
    getProducts: builder.query({
      query: (params) => ({ url: "catalog/products", params }),
      providesTags: ["Product"],
    }),
    getProduct: builder.query({
      query: (id) => `catalog/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: "catalog/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `catalog/products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }, "Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `catalog/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    uploadProductImage: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("image", file);
        return {
          url: `catalog/products/${id}/images`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
    }),
    deleteProductImage: builder.mutation({
      query: ({ id, imageId }) => ({
        url: `catalog/products/${id}/images/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
    }),
    getAlternativeCandidates: builder.query({
      query: (id) => `catalog/products/${id}/alternative-candidates`,
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadCategoryImageMutation,
  useDeleteCategoryImageMutation,
  
  useGetBrandsQuery,
  useGetBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  
  useGetManufacturersQuery,
  useGetManufacturerQuery,
  useCreateManufacturerMutation,
  useUpdateManufacturerMutation,
  useDeleteManufacturerMutation,

  useGetSaltsQuery,
  useGetSaltQuery,
  useCreateSaltMutation,
  useUpdateSaltMutation,
  useDeleteSaltMutation,

  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  useDeleteProductImageMutation,
  useGetAlternativeCandidatesQuery,
} = catalogApi;
