import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut, setToken } from "./auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1/",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    const { sessionId, refreshToken } = api.getState().auth;
    if (sessionId && refreshToken) {
      // Try to get a new token
      const refreshResult = await baseQuery(
        {
          url: 'auth/refresh',
          method: 'POST',
          body: { sessionId, refreshToken }
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store the new token
        api.dispatch(setToken({
          accessToken: refreshResult.data.data.tokens.accessToken,
          refreshToken: refreshResult.data.data.tokens.refreshToken
        }));
        // Retry the original query with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logOut());
      }
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Category", "Brand", "Manufacturer", "Salt", "Product"],
  endpoints: (builder) => ({}),
});
