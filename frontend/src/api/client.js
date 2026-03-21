const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

let accessTokenGetter = null;

export const setAccessTokenGetter = (getter) => {
  accessTokenGetter = typeof getter === "function" ? getter : null;
};

const buildUrl = (path, query) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const buildHeaders = async ({ headers = {}, auth = true, body } = {}) => {
  const nextHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    nextHeaders["Content-Type"] = "application/json";
  }

  if (auth && accessTokenGetter) {
    const token = await accessTokenGetter();

    // console.log("client auth", {
    //   auth,
    //   hasGetter: !!accessTokenGetter,
    //   hasToken: !!token,
    //   tokenPreview: token ? token.slice(0, 20) : null,
    // });

    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return nextHeaders;
};

export const request = async ({
  method = "GET",
  path,
  query,
  body,
  headers,
  auth = true,
}) => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not set");
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: await buildHeaders({ headers, auth, body }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (payload?.message || payload?.error)) ||
      response.statusText ||
      "Request failed";

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

const client = {
  get: (path, options = {}) =>
    request({
      method: "GET",
      path,
      ...options,
    }),

  post: (path, body, options = {}) =>
    request({
      method: "POST",
      path,
      body,
      ...options,
    }),

  put: (path, body, options = {}) =>
    request({
      method: "PUT",
      path,
      body,
      ...options,
    }),

  patch: (path, body, options = {}) =>
    request({
      method: "PATCH",
      path,
      body,
      ...options,
    }),

  delete: (path, options = {}) =>
    request({
      method: "DELETE",
      path,
      ...options,
    }),
};

export default client;