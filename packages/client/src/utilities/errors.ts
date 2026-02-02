export function isAbortError(e: unknown): boolean {
  if (e instanceof Error && e.name === "AbortError") return true;
  if (e instanceof Error && /aborted/i.test(e.message)) return true;
  if (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as { name: string }).name === "AbortError"
  )
    return true;
  return false;
}
