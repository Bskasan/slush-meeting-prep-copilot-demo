import type {
  GenerateRequest,
  GenerateResponse,
  PrepPackDetail,
  PrepPackListItem,
  SavePrepPackRequest,
  UpdatePrepPackRequest,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, ...init } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
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
      e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('fetch'))
        ? 'Cannot connect to the API. Make sure the server is running (e.g. npm run dev in packages/server).'
        : e instanceof Error
          ? e.message
          : 'Network error';
    throw new Error(msg);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.error === 'string') message = data.error;
      else if (data?.error?.message) message = data.error.message;
      else if (typeof data?.message === 'string') message = data.message;
    } catch {
      // use statusText
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function generatePrepPack(
  body: GenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>('/api/generate', {
    method: 'POST',
    body,
    signal,
  });
}

export function savePrepPack(
  body: SavePrepPackRequest,
  signal?: AbortSignal
): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>('/api/prep-packs', {
    method: 'POST',
    body,
    signal,
  });
}

export function fetchPrepPacks(signal?: AbortSignal): Promise<PrepPackListItem[]> {
  return apiFetch<PrepPackListItem[]>('/api/prep-packs', { signal });
}

export function fetchPrepPackById(id: string, signal?: AbortSignal): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>(`/api/prep-packs/${id}`, { signal });
}

export function updatePrepPack(
  id: string,
  body: UpdatePrepPackRequest,
  signal?: AbortSignal
): Promise<PrepPackDetail> {
  return apiFetch<PrepPackDetail>(`/api/prep-packs/${id}`, {
    method: 'PATCH',
    body,
    signal,
  });
}

export function deletePrepPack(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<unknown>(`/api/prep-packs/${id}`, { method: 'DELETE', signal }).then(() => {});
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const url = `${BASE_URL || ''}/health`;
  try {
    const res = await fetch(url, { signal });
    return res.ok;
  } catch {
    return false;
  }
}
