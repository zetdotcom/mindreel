// HTTP response helper functions for the weekly summary edge function

import type { SuccessResponse, ErrorResponse } from "../_shared/types.ts";

/**
 * Creates a standardized JSON response with proper headers
 */
export function jsonResponse(
  data: SuccessResponse | ErrorResponse,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
    },
  });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  reason: ErrorResponse["reason"],
  message: string,
  status = 400,
  extra: Partial<ErrorResponse> = {},
): Response {
  return jsonResponse(
    {
      ok: false,
      reason,
      message,
      ...extra,
    },
    status,
  );
}
