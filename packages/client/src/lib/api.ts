import type { ApiFetchOptions } from "../types/api";
import type { GenerateRequest, GenerateResponse } from "../types/generateForm";
import type {
  SavePrepPackRequest,
  PrepPackDetail,
  PrepPackListItem,
  UpdatePrepPackRequest,
} from "../types/prePack";
import { BASE_URL } from "../utilities/constants";

/** Parse error body from a non-2xx response. Returns a user-safe message. */
export async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
    if (data?.error?.message && typeof data.error.message === "string")
      return data.error.message;
    if (typeof data?.message === "string") return data.message;
  } catch {
    // body is not JSON
  }
  if (res.status === 429) return "Too many requests. Please try again later.";
  if (res.status === 502 || res.status === 504)
    return "Generation failed. Please try again.";
  if (res.status >= 400 && res.status < 500)
    return res.statusText || "Request failed.";
  return "Something went wrong. Please try again.";
}

function messageForStatus(status: number, parsed: string): string {
  if (status === 429) return "Too many requests. Please try again later.";
  if (status === 502 || status === 504)
    return "Generation failed. Please try again.";
  return parsed || "Something went wrong. Please try again.";
}

async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, ...init } = options;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };

  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const msg =
      e instanceof TypeError &&
      (e.message === "Failed to fetch" || e.message.includes("fetch"))
        ? "Network error. Check your connection."
        : e instanceof Error
          ? e.message
          : "Network error. Check your connection.";
    throw new Error(msg);
  }

  if (!res.ok) {
    const parsed = await parseApiError(res);
    const message = messageForStatus(res.status, parsed);
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function generatePrepPack(
  body: GenerateRequest,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    body,
    signal,
  });
}

export function savePrepPack(
  body: SavePrepPackRequest,
  signal?: AbortSignal,
): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>("/api/prep-packs", {
    method: "POST",
    body,
    signal,
  });
}

export function fetchPrepPacks(
  signal?: AbortSignal,
): Promise<PrepPackListItem[]> {
  return apiFetch<PrepPackListItem[]>("/api/prep-packs", { signal });
}

export function fetchPrepPackById(
  id: string,
  signal?: AbortSignal,
): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>(`/api/prep-packs/${id}`, { signal });
}

export function updatePrepPack(
  id: string,
  body: UpdatePrepPackRequest,
  signal?: AbortSignal,
): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>(`/api/prep-packs/${id}`, {
    method: "PATCH",
    body,
    signal,
  });
}

export function deletePrepPack(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiFetch<unknown>(`/api/prep-packs/${id}`, {
    method: "DELETE",
    signal,
  }).then(() => {});
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const url = `${BASE_URL || ""}/health`;

  try {
    const res = await fetch(url, { signal });
    return res.ok;
  } catch {
    return false;
  }
}
