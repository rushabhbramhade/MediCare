import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalKey = z.preprocess(emptyToUndefined, z.string().min(10).optional());

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:4000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalKey,
  NEXT_PUBLIC_MAP_TILE_URL: z
    .string()
    .min(1)
    .default("https://tile.openstreetmap.org/{z}/{x}/{y}.png"),
  NEXT_PUBLIC_MAP_ATTRIBUTION: z.string().min(1).default("© OpenStreetMap contributors"),
  // Google Maps - Browser. The key is safe to expose; never add backend keys here.
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required when MAP_PROVIDER=google")
    .optional(),
  NEXT_PUBLIC_MAP_PROVIDER: z.enum(["osm", "google"]).default("osm"),
  NEXT_PUBLIC_MAP_DEFAULT_LAT: z.coerce.number().min(-90).max(90).default(18.5204),
  NEXT_PUBLIC_MAP_DEFAULT_LNG: z.coerce.number().min(-180).max(180).default(73.8567),
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: z.coerce.number().int().min(1).max(22).default(12),
  NEXT_PUBLIC_MAP_DEFAULT_RADIUS_KM: z.coerce
    .number()
    .min(0.5)
    .max(50)
    .default(10),
  NEXT_PUBLIC_MAP_MAX_RADIUS_KM: z.coerce.number().min(0.5).max(100).default(50),
});

// Static references are required so Next.js can inline NEXT_PUBLIC_* at build time.
const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_TILE_URL: process.env.NEXT_PUBLIC_MAP_TILE_URL,
  NEXT_PUBLIC_MAP_ATTRIBUTION: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER,
  NEXT_PUBLIC_MAP_DEFAULT_LAT: process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
  NEXT_PUBLIC_MAP_DEFAULT_LNG: process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM,
  NEXT_PUBLIC_MAP_DEFAULT_RADIUS_KM: process.env.NEXT_PUBLIC_MAP_DEFAULT_RADIUS_KM,
  NEXT_PUBLIC_MAP_MAX_RADIUS_KM: process.env.NEXT_PUBLIC_MAP_MAX_RADIUS_KM,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid web environment: ${details}`);
}

export const publicEnv = parsed.data;

export const isSupabaseConfigured =
  publicEnv.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined;
