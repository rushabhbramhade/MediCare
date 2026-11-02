import { createApiClient, type ApiClient } from "@medicare/api-client";
import { isSupabaseConfigured, publicEnv } from "./env";
import { createSupabaseBrowserClient } from "./supabase/client";

let client: ApiClient | null = null;
let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/**
 * Authenticated browser client. The token comes from the Supabase session
 * cookie, never from local storage or a request body.
 */
export function getBrowserApiClient(): ApiClient {
  if (client) return client;

  client = createApiClient({
    baseUrl: publicEnv.NEXT_PUBLIC_API_URL,
    getAccessToken: async () => {
      if (!isSupabaseConfigured) return null;
      supabase ??= createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
  return client;
}
