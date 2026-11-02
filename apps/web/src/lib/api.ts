import { createApiClient } from "@medicare/api-client";
import { publicEnv } from "./env";

/**
 * Browser/server-safe client for public endpoints. Authenticated calls should
 * attach the Supabase access token via `getAccessToken`.
 */
export const api = createApiClient({
  baseUrl: publicEnv.NEXT_PUBLIC_API_URL,
  timeoutMs: 5_000,
});
