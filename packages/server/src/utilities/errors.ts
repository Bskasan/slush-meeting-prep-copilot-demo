/**
 * Stable error codes for API responses. Client can branch on these.
 */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "BAD_GATEWAY"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "LOW_SIGNAL_INPUT"
  | "LLM_OUTPUT_INVALID"
  | "LLM_TIMEOUT"
  | "DB_ERROR";

/**
 * API error body sent to the client. Same shape for every error response.
 */
export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details: unknown;
}

/**
 * JSON error shape for all error responses. Backward-compatible: clients that only read `error` still work.
 */
export interface ApiError {
  error: string;
  code?: ApiErrorCode;
  requestId?: string;
}

/** Map error code to HTTP status. */
const CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  BAD_GATEWAY: 502,
  INTERNAL_ERROR: 500,
  RATE_LIMITED: 429,
  LOW_SIGNAL_INPUT: 400,
  LLM_OUTPUT_INVALID: 502,
  LLM_TIMEOUT: 504,
  DB_ERROR: 500,
};

export function statusForCode(code: ApiErrorCode): number {
  return CODE_TO_STATUS[code];
}

/** Map HTTP status to ApiErrorCode for error middleware. */
export function codeForStatus(status: number): ApiErrorCode {
  if (status === 404) return "NOT_FOUND";
  if (status === 502) return "BAD_GATEWAY";
  if (status === 409) return "CONFLICT";
  if (status === 400) return "BAD_REQUEST";
  if (status === 429) return "RATE_LIMITED";
  if (status === 504) return "LLM_TIMEOUT";
  return "INTERNAL_ERROR";
}

/** Thrown for HTTP responses; central error middleware will send status + body. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: ApiErrorCode,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Thrown when LLM output is invalid after repair; map to 502. */
export class LLMOutputInvalidError extends Error {
  constructor(message = "LLM output invalid") {
    super(message);
    this.name = "LLMOutputInvalidError";
  }
}
