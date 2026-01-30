/**
 * Stable error codes for API responses. Client can branch on these.
 */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

/**
 * API error body sent to the client. Same shape for every error response.
 */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details: unknown;
}

/** Map error code to HTTP status. */
const CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
};

export function statusForCode(code: ApiErrorCode): number {
  return CODE_TO_STATUS[code];
}
