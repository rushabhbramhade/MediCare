import { z } from "zod";

const logLevel = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info");

const port = z.coerce.number().int().min(1).max(65535);

const csv = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );

// `.env.example` uses empty values for optional settings. Treat "" as unset so a
// copied file boots instead of failing an optional field's minimum length.
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalSecret = (min: number) =>
  z.preprocess(emptyToUndefined, z.string().min(min).optional());

export const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: logLevel,
});

export const apiEnvSchema = runtimeEnvSchema
  .extend({
    API_PORT: port.default(4000),
    API_CORS_ORIGINS: csv,
    DATABASE_URL: z.url(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    REDIS_URL: z.url(),
    JWT_ISSUER: z.url(),
    JWT_AUDIENCE: z.string().min(1),
    JWT_JWKS_URL: z.url(),
    RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1000).default(60_000),
    RATE_LIMIT_LIMIT: z.coerce.number().int().min(1).default(100),
    AUTH_RATE_LIMIT_LIMIT: z.coerce.number().int().min(1).max(1000).default(10),
    INTERNAL_SERVICE_TOKEN: optionalSecret(16),
    ENCRYPTION_KEY: optionalSecret(32),
    // URL of the internal AI (FastAPI) service, called only by the API.
    AI_SERVICE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    HOSPITAL_PROVIDER: z.string().min(1).max(64).default("disabled"),
    HOSPITAL_API_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    HOSPITAL_API_KEY: optionalSecret(8),
    HOSPITAL_DATA_MAX_AGE_HOURS: z.coerce.number().int().min(1).max(720).default(24),
    // Google Maps Platform (server-side only; never exposed to the browser).
    GOOGLE_MAPS_SERVER_API_KEY: optionalSecret(8),
    GOOGLE_MAPS_REGION: z.string().min(2).max(3).default("IN"),
    GOOGLE_MAPS_LANGUAGE: z.string().min(2).max(8).default("en"),
    // OCR / document extraction (Tesseract — local, no paid API key).
    OCR_PROVIDER: z.enum(["disabled", "tesseract"]).default("disabled"),
    OCR_API_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    OCR_API_KEY: optionalSecret(8),
    OCR_LANGUAGES: z.string().min(1).default("eng,hin,mar"),
    OCR_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
    OCR_MAX_PAGES: z.coerce.number().int().min(1).max(200).default(50),
    OCR_TIMEOUT_SECONDS: z.coerce.number().int().min(10).max(600).default(120),
    // OpenStreetMap Overpass API (free, no API key required).
    OSM_OVERPASS_API_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    OSM_OVERPASS_TIMEOUT_SECONDS: z.coerce.number().int().min(5).max(300).default(30),
    OSM_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
    // ABDM HPR (doctor directory — requires approved integration).
    ABDM_HPR_API_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    ABDM_HPR_API_KEY: optionalSecret(8),
    ABDM_HPR_GATEWAY_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    DOCTOR_PROVIDER: z.string().min(1).max(64).default("disabled"),
  })
  .superRefine((value, ctx) => {
    if (value.API_CORS_ORIGINS.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["API_CORS_ORIGINS"],
        message: "At least one allowed origin is required",
      });
    }
    if (value.NODE_ENV === "production" && value.ENCRYPTION_KEY === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["ENCRYPTION_KEY"],
        message: "ENCRYPTION_KEY is required in production",
      });
    }
  });

export const workerEnvSchema = runtimeEnvSchema.extend({
  REDIS_URL: z.url(),
  QUEUE_PREFIX: z.string().min(1).default("medicare"),
  INTERNAL_SERVICE_TOKEN: optionalSecret(16),
});

export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

/** BullMQ queue names. Redis key prefixes come from QUEUE_PREFIX. */
export const QUEUES = {
  documentProcessing: "document-processing",
  inventorySync: "inventory-sync",
  notifications: "notifications",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export function loadEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
  label = "environment variables",
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "value"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid ${label}:\n${details}`);
  }
  return result.data;
}

export const loadApiEnv = (source: Record<string, string | undefined>): ApiEnv =>
  loadEnv(apiEnvSchema, source, "API environment");

export const loadWorkerEnv = (source: Record<string, string | undefined>): WorkerEnv =>
  loadEnv(workerEnvSchema, source, "worker environment");
