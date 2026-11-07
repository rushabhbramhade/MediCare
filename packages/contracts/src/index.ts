import type {
  AuthUser,
  HospitalAvailability,
  HospitalDetail,
  HospitalSearchResponse,
  Paginated,
  PatientProfile,
} from "@medicare/types";

export const API_VERSION = "v1" as const;

/** Paths are relative to the API origin. Keep them in one place for clients. */
export const API_ROUTES = {
  health: "/v1/health",
  readiness: "/v1/health/ready",
  me: "/v1/auth/me",
  patientProfile: "/v1/patients/me",
  hospitals: "/v1/hospitals",
  hospitalNearby: "/v1/hospitals/nearby",
  hospital: (hospitalId: string) => `/v1/hospitals/${hospitalId}`,
  hospitalAvailability: (hospitalId: string) => `/v1/hospital-availability/hospital/${hospitalId}`,
  mapGeocode: "/v1/map/geocode",
  mapReverseGeocode: "/v1/map/reverse-geocode",
  mapPlaces: "/v1/map/places",
  mapRoute: "/v1/map/route",
  osmHospitals: "/v1/osm/hospitals",
  osmPharmacies: "/v1/osm/pharmacies",
  ambulanceEmergencyNumbers: "/v1/ambulance/emergency-numbers",
  dashboardOverview: "/v1/dashboard/overview",
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

export interface HospitalDetailApiResponse {
  hospital: HospitalDetail;
}

export interface HospitalAvailabilityApiResponse {
  availability: HospitalAvailability[];
}

/** Google Maps Platform server-side API responses (never expose keys). */
export interface GeocodeResponse {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResponse {
  placeId: string;
  formattedAddress: string;
}

export interface Place {
  placeId: string;
  name: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  types: string[];
}

export interface PlacesSearchResponse {
  places: Place[];
}

export interface RouteResponse {
  distanceMeters: number;
  durationSeconds: number;
}

/** Ambulance emergency numbers (public information, no provider integration). */
export interface AmbulanceEmergencyNumber {
  number: string;
  name: string;
  description: string;
  coverage: string;
  type: "national" | "state";
}

export interface AmbulanceEmergencyResponse {
  numbers: AmbulanceEmergencyNumber[];
  source: "public";
  lastVerifiedAt: string;
  disclaimer: string;
}

export interface DashboardHospital {
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

/** Dashboard overview response (aggregated, honest-empty for unconnected services). */
export interface DashboardOverviewResponse {
  profile: PatientProfile | null;
  location: {
    latitude: number | null;
    longitude: number | null;
    address?: string;
    source: "browser" | "manual" | "unknown";
  };
  emergencyNumbers: AmbulanceEmergencyResponse;
  hospitals: {
    items: DashboardHospital[];
    total: number;
    radiusKm: number;
    source: string | null;
  };
  upcomingAppointments: { items: never[]; connected: boolean };
  recentMedicalRecords: { items: never[]; connected: boolean };
  medicationSummary: { items: never[]; connected: boolean };
  activeAmbulanceRequest: { request: null; connected: boolean };
}

/** OpenStreetMap Overpass discovery result place. */
export interface OsmPlaceResult {
  id: string;
  name: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  hasEmergency: null;
  phone: string | null;
  featureType: string;
  operationalStatus: "unknown";
  source: "openstreetmap";
  lastSyncedAt: string;
  verificationStatus: "unverified";
  bedAvailability: "unknown";
}

export interface OsmDiscoveryResponse {
  places: OsmPlaceResult[];
  total: number;
  radiusMeters: number;
  source: "openstreetmap";
  lastSyncedAt: string;
}
