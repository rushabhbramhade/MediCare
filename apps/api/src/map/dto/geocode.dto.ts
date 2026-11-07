import { z } from "zod";

/**
 * Request validation for forward geocoding (address -> coordinates).
 * Calls the Google Geocoding API server-side.
 */
export const geocodeRequestSchema = z
  .object({
    address: z.string().trim().min(1, "Address is required").max(500),
  })
  .strict();

export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;

export const geocodeResponseSchema = z.object({
  placeId: z.string().min(1),
  formattedAddress: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type GeocodeResponse = z.infer<typeof geocodeResponseSchema>;

/**
 * Request validation for reverse geocoding (coordinates -> address).
 */
export const reverseGeocodeRequestSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  })
  .strict();

export type ReverseGeocodeRequest = z.infer<typeof reverseGeocodeRequestSchema>;

export const reverseGeocodeResponseSchema = z.object({
  placeId: z.string().min(1),
  formattedAddress: z.string().min(1),
});

export type ReverseGeocodeResponse = z.infer<typeof reverseGeocodeResponseSchema>;

/**
 * Request validation for Places API (New) Text Search.
 */
export const placesSearchRequestSchema = z
  .object({
    query: z.string().trim().min(1, "Search query is required").max(200),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusKm: z.coerce
      .number()
      .min(0.1)
      .max(50, "Radius must be at most 50 km")
      .default(10),
    type: z.enum(["hospital", "pharmacy"]).optional(),
  })
  .strict();

export type PlacesSearchRequest = z.infer<typeof placesSearchRequestSchema>;

/**
 * Request validation for Places API (New) Text Search.
 * radiusKm has a Zod default of 10, so it is optional at runtime.
 */
export type PlacesSearchRequestInput = {
  query: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  type?: "hospital" | "pharmacy";
};

export const placeSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  formattedAddress: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  types: z.array(z.string()).default([]),
});

export type Place = z.infer<typeof placeSchema>;

export const placesSearchResponseSchema = z.object({
  places: z.array(placeSchema),
});

export type PlacesSearchResponse = z.infer<typeof placesSearchResponseSchema>;

/**
 * Request validation for Routes API (distance + ETA).
 */
export const routeRequestSchema = z
  .object({
    originLatitude: z.coerce.number().min(-90).max(90),
    originLongitude: z.coerce.number().min(-180).max(180),
    destinationLatitude: z.coerce.number().min(-90).max(90),
    destinationLongitude: z.coerce.number().min(-180).max(180),
  })
  .strict();

export type RouteRequest = z.infer<typeof routeRequestSchema>;

export const routeResponseSchema = z.object({
  distanceMeters: z.coerce.number().int().nonnegative(),
  durationSeconds: z.coerce.number().int().nonnegative(),
});

export type RouteResponse = z.infer<typeof routeResponseSchema>;
