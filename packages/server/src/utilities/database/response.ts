import type { ApiErrorCode } from "../errors";

/**
 * Standard result shape from repository layer.
 * Success: ok true, data set. Failure: ok false, code + message (and optional details) for API error body.
 */
export default interface DatabaseResponse<T> {
  data: T | null;
  message: string;
  ok: boolean;
  /** Set when ok is false; drives HTTP status and client handling. */
  code?: ApiErrorCode;
  /** Optional extra payload (e.g. validation field errors). */
  details?: unknown;
}
