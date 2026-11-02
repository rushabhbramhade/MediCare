import { getCurrentUser } from "./supabase/server";

export interface SessionSummary {
  id: string;
  phone?: string;
  email?: string;
  role: string;
}

/**
 * Trusted session role comes from app_metadata, which only server-side
 * administration can set. user_metadata is never used for authorization.
 */
export async function getSessionSummary(): Promise<SessionSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const appRole = user.app_metadata?.role;
  return {
    id: user.id,
    phone: user.phone ?? undefined,
    email: user.email ?? undefined,
    role: typeof appRole === "string" ? appRole : "patient",
  };
}
