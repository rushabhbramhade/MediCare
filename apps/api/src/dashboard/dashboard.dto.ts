import { z } from "zod";
import type { AmbulanceEmergencyResponse } from "@medicare/contracts";
import type {
  HospitalAvailability,
  HospitalSearchResponse,
  PatientProfile,
} from "@medicare/types";

export const dashboardOverviewSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(15).default(5),
});

export type DashboardOverviewQuery = z.infer<typeof dashboardOverviewSchema>;

export interface HospitalWithAvailability {
  id: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  hasEmergency: boolean | null;
  phone: string | null;
  hospitalType: string | null;
  specialties: string[];
  verificationStatus: string;
  source: string;
  lastSyncedAt: string;
  isStale: boolean;
  bedAvailability: "unknown";
  availability: HospitalAvailability[];
  capacityStatus: "AVAILABLE" | "LIMITED" | "FULL" | "UNKNOWN" | "STALE";
  capacitySource: string | null;
  capacityReportedAt: string | null;
  roadEtaMinutes: number | null;
}

interface LocationContext {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  source: "browser" | "manual" | "unknown";
}

export interface DashboardOverviewResponse {
  profile: PatientProfile | null;
  location: LocationContext;
  emergencyNumbers: AmbulanceEmergencyResponse;
  hospitals: {
    items: HospitalWithAvailability[];
    total: number;
    radiusKm: number;
    source: string | null;
  };
  upcomingAppointments: {
    items: never[];
    connected: false;
  };
  recentMedicalRecords: {
    items: never[];
    connected: false;
  };
  medicationSummary: {
    items: never[];
    connected: false;
  };
  activeAmbulanceRequest: {
    request: null;
    connected: false;
  };
}

export function isStaleReport(reportedAt: string | null, maxHours: number | null): boolean {
  if (!reportedAt) return true;
  if (maxHours === null) return false;
  const ageMs = Date.now() - new Date(reportedAt).getTime();
  return ageMs > maxHours * 3_600_000;
}

export function computeCapacityStatus(
  availability: HospitalAvailability[],
  maxStalenessHours: number | null,
): {
  status: "AVAILABLE" | "LIMITED" | "FULL" | "UNKNOWN" | "STALE";
  source: string | null;
  reportedAt: string | null;
} {
  if (availability.length === 0) {
    return { status: "UNKNOWN", source: null, reportedAt: null };
  }

  const valid = availability
    .filter((a) => !isStaleReport(a.reportedAt, maxStalenessHours))
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  if (valid.length === 0) {
    const latest = availability[0]!;
    return {
      status: "STALE",
      source: latest.source,
      reportedAt: latest.reportedAt,
    };
  }

  // All resource types in a single hospital submission share the same
  // reported_at. Find the most recent report timestamp, then apply
  // worst-case logic across all resources reported at that time.
  const latestAt = new Date(valid[0]!.reportedAt).getTime();
  const latestReports = valid.filter((a) => new Date(a.reportedAt).getTime() === latestAt);
  const latest = latestReports[0]!;

  const hasAnyFull = latestReports.some((a) => a.status === "FULL" && a.quantity === 0);
  const hasAnyLimited = latestReports.some((a) => a.status === "LIMITED");

  if (hasAnyFull) {
    return { status: "FULL", source: latest.source, reportedAt: latest.reportedAt };
  }
  if (hasAnyLimited) {
    return { status: "LIMITED", source: latest.source, reportedAt: latest.reportedAt };
  }
  return { status: "AVAILABLE", source: latest.source, reportedAt: latest.reportedAt };
}

export function mapHospitalWithAvailability(
  summary: NonNullable<HospitalSearchResponse["data"]>[number],
  availability: HospitalAvailability[],
  maxStalenessHours: number | null,
): HospitalWithAvailability {
  const capacity = computeCapacityStatus(availability, maxStalenessHours);
  const roadEtaMinutes = null;

  return {
    id: summary.id,
    name: summary.name,
    addressLine: summary.addressLine,
    city: summary.city,
    state: summary.state,
    postalCode: summary.postalCode,
    latitude: summary.latitude,
    longitude: summary.longitude,
    distanceKm: summary.distanceKm,
    hasEmergency: summary.hasEmergency,
    phone: summary.phone,
    hospitalType: summary.hospitalType,
    specialties: summary.specialties,
    verificationStatus: summary.verificationStatus,
    source: summary.source,
    lastSyncedAt: summary.lastSyncedAt,
    isStale: summary.isStale,
    bedAvailability: summary.bedAvailability,
    availability,
    capacityStatus: capacity.status,
    capacitySource: capacity.source,
    capacityReportedAt: capacity.reportedAt,
    roadEtaMinutes,
  };
}
