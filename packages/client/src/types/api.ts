export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}
