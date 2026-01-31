/**
 * Stable error codes for API responses. Client can branch on these.
 */
export type ApiErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "BAD_GATEWAY"
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
  BAD_GATEWAY: 502,
  INTERNAL_ERROR: 500,
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
  return "INTERNAL_ERROR";
}

/** Thrown for HTTP responses; central error middleware will send status + body. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
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
