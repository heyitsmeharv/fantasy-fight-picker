import { importFighters } from "../services/fightersService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  forbidden,
  ok,
  serverError,
} from "../utils/response.js";


const parseBody = (event) => {
  if (!event?.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("INVALID_JSON");
  }
};

export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
    }

    let payload;

    try {
      payload = parseBody(event);
    } catch (error) {
      if (error.message === "INVALID_JSON") {
        return badRequest("Request body must be valid JSON");
      }
      throw error;
    }

    const rows = Array.isArray(payload?.rows) ? payload.rows : [];

    if (!rows.length) {
      return badRequest("rows must be a non-empty array");
    }

    const invalidRow = rows.find((row) => !String(row?.name || "").trim());

    if (invalidRow) {
      return badRequest("Every row must include a fighter name");
    }

    const result = await importFighters(rows);

    return ok(result);
  } catch (error) {
    console.error("adminImportFighters error", error);
    return serverError(error.message);
  }
};