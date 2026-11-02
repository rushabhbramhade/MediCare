/**
 * Roles are granted by trusted, server-side administration only.
 * In Supabase this lives in `app_metadata.role` (admin-writable), never in
 * `user_metadata` (user-writable).
 */
export type Role =
  "patient" | "caregiver" | "doctor" | "hospital" | "pharmacy" | "ambulance" | "admin";

export const ROLES: readonly Role[] = [
  "patient",
  "caregiver",
  "doctor",
  "hospital",
  "pharmacy",
  "ambulance",
  "admin",
] as const;

export interface AuthUser {
  id: string;
  role: Role;
  email?: string;
  phone?: string;
}

/** Shape returned by every API error filter. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type IsoDateTimeString = string;
