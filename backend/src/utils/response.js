const corsAllowOrigin = process.env.CORS_ALLOW_ORIGIN || "*";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": corsAllowOrigin,
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

export const json = (statusCode, body) => ({
  statusCode,
  headers: defaultHeaders,
  body: JSON.stringify(body),
});

export const ok = (body) => json(200, body);
export const created = (body) => json(201, body);
export const badRequest = (message) => json(400, { message });
export const forbidden = (message) => json(403, { message });
export const notFound = (message) => json(404, { message });
export const serverError = (message = "Internal server error") =>
  json(500, { message });