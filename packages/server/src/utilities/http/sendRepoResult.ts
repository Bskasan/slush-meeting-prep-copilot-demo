import type { Response } from "express";
import type DatabaseResponse from "../database/response";
import { statusForCode } from "../errors";

export interface SendRepoResultOptions {
  successStatus?: number;
  requestId?: string;
}

/** Send a repository result as an Express response (success → 2xx + data, failure → 4xx/5xx + structured error). */
export function sendRepoResult<T>(
  res: Response,
  result: DatabaseResponse<T>,
  options: SendRepoResultOptions = {},
): void {
  const { successStatus = 200, requestId } = options;

  if (result.ok) {
    res.status(successStatus).json(result.data);
    return;
  }

  const code = result.code ?? "INTERNAL_ERROR";
  const status = statusForCode(code);
  const body: { error: string; code?: string; requestId?: string } = {
    error: result.message ?? "Something went wrong.",
    code,
  };
  if (requestId) body.requestId = requestId;
  res.status(status).json(body);
}
