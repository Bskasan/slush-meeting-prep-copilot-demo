export const POLL_INTERVAL_MS = 30_000;

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

/** Length limits for generator form (mirror server schemas). */
export const MIN_CHARS = 80;
export const MAX_CHARS = 8000;
export const MAX_NAME_LEN = 80;
export const MAX_TITLE_LEN = 120;
