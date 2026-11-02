import {
  API_ROUTES,
  type HealthResponse,
  type MeResponse,
  type ReadinessResponse,
} from "@medicare/contracts";
import type { ApiErrorBody } from "@medicare/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;

  constructor(message: string, options: { status: number; code?: string; body?: unknown }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code ?? "request_failed";
    this.body = options.body;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Called per request; return a Supabase access token when signed in. */
  getAccessToken?: () => string | null | Promise<string | null>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    if (init.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const token = options.getAccessToken ? await options.getAccessToken() : null;
    if (token) headers.set("authorization", `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        ...init,
        headers,
        signal: init.signal ?? AbortSignal.timeout(options.timeoutMs ?? 8000),
      });
    } catch (error) {
      throw new ApiClientError("Unable to reach the Medicare API", {
        status: 0,
        code: "network_error",
        body: error,
      });
    }

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      const parsed = body as Partial<ApiErrorBody> | undefined;
      throw new ApiClientError(
        parsed?.error?.message ?? `API request failed (${response.status})`,
        {
          status: response.status,
          code: parsed?.error?.code ?? "http_error",
          body,
        },
      );
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    health: () => request<HealthResponse>(API_ROUTES.health),
    readiness: () => request<ReadinessResponse>(API_ROUTES.readiness),
    me: () => request<MeResponse>(API_ROUTES.me),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
