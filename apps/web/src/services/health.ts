import { createApiClient } from "@medicare/api-client";
import type { HealthResponse } from "@medicare/contracts";
import { serverEnv } from "@/lib/server-env";

/** Server-side liveness check. Returns null instead of breaking the page. */
export async function getApiHealth(): Promise<HealthResponse | null> {
  try {
    const client = createApiClient({
      baseUrl: serverEnv.API_BASE_URL,
      timeoutMs: 2_500,
    });
    return await client.health();
  } catch {
    return null;
  }
}
