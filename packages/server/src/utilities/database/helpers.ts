import { ApiErrorCode } from "../errors";

/** Map Prisma/unknown errors to ApiErrorCode + user-facing message. Log full error server-side only. */
export function toRepoError(error: unknown): {
  code: ApiErrorCode;
  message: string;
} {
  if (error instanceof Error && error.name === "PrismaClientValidationError") {
    return {
      code: "BAD_REQUEST",
      message: "Invalid or missing required fields.",
    };
  }
  if (isPrismaKnownError(error)) {
    switch (error.code) {
      case "P2025":
        return {
          code: "NOT_FOUND",
          message:
            "This prep pack was not found or has already been deleted.",
        };
      case "P2002":
        return {
          code: "CONFLICT",
          message: "A prep pack with this value already exists.",
        };
      case "P2003":
      case "P2014":
        return {
          code: "BAD_REQUEST",
          message: "Invalid reference or relation.",
        };
      default:
        break;
    }
  }
  console.error(error);
  return {
    code: "INTERNAL_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

/** Prisma known request errors have a string `code` (e.g. P2025, P2002). */
export function isPrismaKnownError(
  error: unknown,
): error is { code: string; message?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}
