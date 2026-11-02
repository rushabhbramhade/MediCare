/**
 * Roles are granted by trusted, server-side administration only.
 * In Supabase this lives in `app_metadata.role` (admin-writable), never in
 * `user_metadata` (user-writable).
 */
export type Role =
  | "patient"
  | "caregiver"
  | "doctor"
  | "hospital_admin"
  | "ambulance_provider"
  | "pharmacy_admin"
  | "platform_admin";

export const ROLES: readonly Role[] = [
  "patient",
  "caregiver",
  "doctor",
  "hospital_admin",
  "ambulance_provider",
  "pharmacy_admin",
  "platform_admin",
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

export const SUPPORTED_LANGUAGES = ["en", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const GENDERS = ["female", "male", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof GENDERS)[number];

export const ACCESSIBILITY_PREFERENCES = [
  "large_text",
  "high_contrast",
  "screen_reader",
  "reduced_motion",
] as const;
export type AccessibilityPreference = (typeof ACCESSIBILITY_PREFERENCES)[number];

export interface PatientProfile {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  /** Present only when the identity provider verified it. */
  phone: string | null;
  preferredLanguage: SupportedLanguage;
  accessibilityPreferences: AccessibilityPreference[];
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface PatientProfileWriteInput {
  fullName: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  preferredLanguage?: SupportedLanguage;
  accessibilityPreferences?: AccessibilityPreference[];
}

export type PatientProfilePatchInput = Partial<PatientProfileWriteInput>;

export const HOSPITAL_VERIFICATION_STATUSES = ["verified", "stale"] as const;
export type HospitalVerificationStatus = (typeof HOSPITAL_VERIFICATION_STATUSES)[number];

export type BedAvailability = "unknown";

export const HOSPITAL_TYPES = [
  "government",
  "private",
  "charitable",
  "multi_specialty",
  "clinic",
  "other",
] as const;
export type HospitalType = (typeof HOSPITAL_TYPES)[number];

export interface HospitalSummary {
  id: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  /** Great-circle distance from the search origin, in kilometres. */
  distanceKm: number;
  /** NULL means the provider did not verify emergency capability. */
  hasEmergency: boolean | null;
  /** Verified contact phone in E.164 format, populated only from a verified source. */
  phone: string | null;
  hospitalType: HospitalType | null;
  specialties: string[];
  verificationStatus: HospitalVerificationStatus;
  source: string;
  lastSyncedAt: IsoDateTimeString;
  isStale: boolean;
  /** Never a number until a licensed live source exists. */
  bedAvailability: BedAvailability;
}

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "LIMITED",
  "FULL",
  "UNKNOWN",
  "STALE",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_VERIFICATION_STATUSES = [
  "verified",
  "unverified",
  "stale",
] as const;
export type AvailabilityVerificationStatus = (typeof AVAILABILITY_VERIFICATION_STATUSES)[number];

export const RESOURCE_TYPES = [
  "general_bed",
  "icu_bed",
  "oxygen",
  "ventilator",
  "ambulance",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface HospitalAvailability {
  id: string;
  hospitalId: string;
  resourceType: ResourceType;
  status: AvailabilityStatus;
  quantity: number | null;
  source: string;
  reportedAt: IsoDateTimeString;
  verifiedAt: IsoDateTimeString | null;
  verificationStatus: AvailabilityVerificationStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface HospitalAvailabilityQuery {
  hospitalId?: string;
  resourceType?: ResourceType;
  status?: AvailabilityStatus;
}

export type HospitalSearchStatus = "OK" | "NO_DATA_SOURCE_CONFIGURED";

export interface HospitalSearchMeta {
  source: string | null;
  liveAvailabilitySupported: boolean;
  capabilities: {
    specialtyFilter: boolean;
    emergencyFilter: boolean;
    typeFilter: boolean;
  };
  radiusKm: number;
  page: number;
  pageSize: number;
  total: number;
  generatedAt: IsoDateTimeString;
  /** Null when no provider declares a freshness window. */
  maxStalenessHours: number | null;
}

export interface HospitalSearchResponse {
  status: HospitalSearchStatus;
  data: HospitalSummary[];
  meta: HospitalSearchMeta;
}

export interface HospitalSearchQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  specialty?: string;
  emergencyOnly?: boolean;
  hospitalType?: HospitalType;
  page?: number;
  pageSize?: number;
}
