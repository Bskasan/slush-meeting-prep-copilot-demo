import type { Response } from "express";
import type DatabaseResponse from "../database/response";
import { statusForCode } from "../errors";

/** Send a repository result as an Express response (success → 2xx + data, failure → 4xx/5xx + structured error). */
export function sendRepoResult<T>(
  res: Response,
  result: DatabaseResponse<T>,
  options: { successStatus?: number } = {},
): void {
  const { successStatus = 200 } = options;

  if (result.ok) {
    res.status(successStatus).json(result.data);
    return;
  }

  const code = result.code ?? "INTERNAL_ERROR";
  const status = statusForCode(code);
  res.status(status).json({
    error: {
      code,
      message: result.message,
      details: result.details ?? null,
    },
  });
}
