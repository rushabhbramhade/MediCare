import { z } from "zod";

/**
 * OpenStreetMap Overpass API discovery DTOs.
 *
 * Results come from the public Overpass API (no API key required).
 * All results are marked as unverified — OSM data is not a verified
 * medical directory and must never be represented as verified or
 * currently operational without an independent verification step.
 */

// ---------- Request validation ----------

const osmCoordinateSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const osmRadiusSchema = z
  .coerce
  .number()
  .int()
  .min(100, "Radius must be at least 100 meters")
  .max(50_000, "Radius must be at most 50 km")
  .default(5000);

export const osmHospitalsQuerySchema = osmCoordinateSchema.extend({
  radiusMeters: osmRadiusSchema,
});

export type OsmHospitalsQuery = z.infer<typeof osmHospitalsQuerySchema>;

export const osmPharmaciesQuerySchema = osmCoordinateSchema.extend({
  radiusMeters: osmRadiusSchema,
});

export type OsmPharmaciesQuery = z.infer<typeof osmPharmaciesQuerySchema>;

// ---------- Response shapes ----------

export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

export interface OsmPlaceResult {
  /** Stable id: osm:{type}:{id} */
  id: string;
  name: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  /** Always "unknown" for OSM results — OSM is not a verified source. */
  hasEmergency: null;
  phone: string | null;
  /** OpenStreetMap feature type (e.g. "hospital", "pharmacy"). */
  featureType: string;
  /** Always "unknown" — OSM does not verify operational status. */
  operationalStatus: "unknown";
  source: "openstreetmap";
  /** ISO timestamp of when the data was fetched from Overpass. */
  lastSyncedAt: string;
  /** Never verified — OSM data is unverified by default. */
  verificationStatus: "unverified";
  /** Bed/ICU availability is always unknown for OSM sources. */
  bedAvailability: "unknown";
}

export interface OsmDiscoveryResponse {
  places: OsmPlaceResult[];
  total: number;
  radiusMeters: number;
  source: "openstreetmap";
  lastSyncedAt: string;
}

/** Overpass API raw response element. */
export interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

// ---------- Zod schemas for responses ----------

export const osmPlaceResultSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  distanceKm: z.number(),
  hasEmergency: z.null(),
  phone: z.string().nullable(),
  featureType: z.string(),
  operationalStatus: z.string(),
  source: z.literal("openstreetmap"),
  lastSyncedAt: z.string(),
  verificationStatus: z.literal("unverified"),
  bedAvailability: z.literal("unknown"),
});

export const osmDiscoveryResponseSchema = z.object({
  places: z.array(osmPlaceResultSchema),
  total: z.number(),
  radiusMeters: z.number(),
  source: z.literal("openstreetmap"),
  lastSyncedAt: z.string(),
});
