import type { AuthUser, HospitalSearchResponse, Paginated, PatientProfile } from "@medicare/types";

export const API_VERSION = "v1" as const;

/** Paths are relative to the API origin. Keep them in one place for clients. */
export const API_ROUTES = {
  health: "/v1/health",
  readiness: "/v1/health/ready",
  me: "/v1/auth/me",
  patientProfile: "/v1/patients/me",
  hospitals: "/v1/hospitals",
} as const;

export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessResponse {
  status: "ok" | "degraded";
  checks: Record<string, "up" | "down">;
}

export interface MeResponse {
  user: AuthUser;
}

export interface PaginatedResponse<T> {
  data: Paginated<T>;
}

export interface PatientProfileResponse {
  profile: PatientProfile;
}

export type HospitalSearchApiResponse = HospitalSearchResponse;
