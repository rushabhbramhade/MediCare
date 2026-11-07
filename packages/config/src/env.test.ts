import { describe, expect, it } from "vitest";
import { loadApiEnv, loadWorkerEnv } from "./env";

const apiBase = {
  DATABASE_URL: "postgresql://medicare:medicare@localhost:5432/medicare",
  REDIS_URL: "redis://localhost:6379",
  JWT_ISSUER: "https://example.supabase.co/auth/v1",
  JWT_AUDIENCE: "authenticated",
  JWT_JWKS_URL: "https://example.supabase.co/auth/v1/.well-known/jwks.json",
  API_CORS_ORIGINS: "http://localhost:3000",
};

describe("loadApiEnv", () => {
  it("treats empty optional secrets in .env.example as unset", () => {
    const env = loadApiEnv({
      ...apiBase,
      INTERNAL_SERVICE_TOKEN: "",
      ENCRYPTION_KEY: "",
    });
    expect(env.INTERNAL_SERVICE_TOKEN).toBeUndefined();
    expect(env.ENCRYPTION_KEY).toBeUndefined();
  });

  it("defaults Google Maps region and language", () => {
    const env = loadApiEnv({ ...apiBase, GOOGLE_MAPS_SERVER_API_KEY: "test-key" });
    expect(env.GOOGLE_MAPS_SERVER_API_KEY).toBe("test-key");
    expect(env.GOOGLE_MAPS_REGION).toBe("IN");
    expect(env.GOOGLE_MAPS_LANGUAGE).toBe("en");
  });

  it("accepts custom Google Maps region and language", () => {
    const env = loadApiEnv({
      ...apiBase,
      GOOGLE_MAPS_SERVER_API_KEY: "test-key",
      GOOGLE_MAPS_REGION: "US",
      GOOGLE_MAPS_LANGUAGE: "en",
    });
    expect(env.GOOGLE_MAPS_REGION).toBe("US");
    expect(env.GOOGLE_MAPS_LANGUAGE).toBe("en");
  });

  it("rejects a Google Maps region that is too long", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        GOOGLE_MAPS_SERVER_API_KEY: "test-key",
        GOOGLE_MAPS_REGION: "INDIA",
      }),
    ).toThrow(/GOOGLE_MAPS_REGION/);
  });

  it("rejects a Google Maps language that is too long", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        GOOGLE_MAPS_SERVER_API_KEY: "test-key",
        GOOGLE_MAPS_LANGUAGE: "english-locale",
      }),
    ).toThrow(/GOOGLE_MAPS_LANGUAGE/);
  });

  it("defaults OCR to disabled with Tesseract-safe limits", () => {
    const env = loadApiEnv(apiBase);
    expect(env.OCR_PROVIDER).toBe("disabled");
    expect(env.OCR_LANGUAGES).toBe("eng,hin,mar");
    expect(env.OCR_MAX_FILE_SIZE_MB).toBe(20);
    expect(env.OCR_MAX_PAGES).toBe(50);
    expect(env.OCR_TIMEOUT_SECONDS).toBe(120);
  });

  it("accepts OCR_PROVIDER=tesseract", () => {
    const env = loadApiEnv({
      ...apiBase,
      OCR_PROVIDER: "tesseract",
      OCR_LANGUAGES: "eng,hin",
      OCR_MAX_FILE_SIZE_MB: "10",
      OCR_MAX_PAGES: "25",
      OCR_TIMEOUT_SECONDS: "60",
    });
    expect(env.OCR_PROVIDER).toBe("tesseract");
    expect(env.OCR_LANGUAGES).toBe("eng,hin");
    expect(env.OCR_MAX_FILE_SIZE_MB).toBe(10);
    expect(env.OCR_MAX_PAGES).toBe(25);
    expect(env.OCR_TIMEOUT_SECONDS).toBe(60);
  });

  it("rejects an invalid OCR_PROVIDER value", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        OCR_PROVIDER: "azure",
      }),
    ).toThrow(/OCR_PROVIDER/);
  });

  it("rejects OCR_MAX_FILE_SIZE_MB above 100", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        OCR_MAX_FILE_SIZE_MB: "200",
      }),
    ).toThrow(/OCR_MAX_FILE_SIZE_MB/);
  });

  it("rejects OCR_MAX_PAGES above 200", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        OCR_MAX_PAGES: "500",
      }),
    ).toThrow(/OCR_MAX_PAGES/);
  });

  it("defaults OSM Overpass config", () => {
    const env = loadApiEnv(apiBase);
    expect(env.OSM_OVERPASS_API_URL).toBeUndefined();
    expect(env.OSM_OVERPASS_TIMEOUT_SECONDS).toBe(30);
    expect(env.OSM_CACHE_TTL_SECONDS).toBe(3600);
  });

  it("accepts custom OSM Overpass config", () => {
    const env = loadApiEnv({
      ...apiBase,
      OSM_OVERPASS_API_URL: "https://overpass-api.de/api/interpreter",
      OSM_OVERPASS_TIMEOUT_SECONDS: "60",
      OSM_CACHE_TTL_SECONDS: "7200",
    });
    expect(env.OSM_OVERPASS_API_URL).toBe("https://overpass-api.de/api/interpreter");
    expect(env.OSM_OVERPASS_TIMEOUT_SECONDS).toBe(60);
    expect(env.OSM_CACHE_TTL_SECONDS).toBe(7200);
  });

  it("rejects OSM_OVERPASS_TIMEOUT_SECONDS below 5", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        OSM_OVERPASS_TIMEOUT_SECONDS: "1",
      }),
    ).toThrow(/OSM_OVERPASS_TIMEOUT_SECONDS/);
  });

  it("rejects OSM_CACHE_TTL_SECONDS above 86400", () => {
    expect(() =>
      loadApiEnv({
        ...apiBase,
        OSM_CACHE_TTL_SECONDS: "200000",
      }),
    ).toThrow(/OSM_CACHE_TTL_SECONDS/);
  });

  it("accepts ABDM HPR config", () => {
    const env = loadApiEnv({
      ...apiBase,
      ABDM_HPR_API_URL: "https://sandbox.abdm.gov.in/hpr",
      ABDM_HPR_API_KEY: "test-key-12345678",
      ABDM_HPR_GATEWAY_BASE_URL: "https://gateway.abdm.gov.in",
    });
    expect(env.ABDM_HPR_API_URL).toBe("https://sandbox.abdm.gov.in/hpr");
    expect(env.ABDM_HPR_API_KEY).toBe("test-key-12345678");
    expect(env.ABDM_HPR_GATEWAY_BASE_URL).toBe("https://gateway.abdm.gov.in");
  });

  it("treats empty ABDM HPR values as unset", () => {
    const env = loadApiEnv({
      ...apiBase,
      ABDM_HPR_API_URL: "",
      ABDM_HPR_API_KEY: "",
      ABDM_HPR_GATEWAY_BASE_URL: "",
    });
    expect(env.ABDM_HPR_API_URL).toBeUndefined();
    expect(env.ABDM_HPR_API_KEY).toBeUndefined();
    expect(env.ABDM_HPR_GATEWAY_BASE_URL).toBeUndefined();
  });

  it("requires ENCRYPTION_KEY in production", () => {
    expect(() => loadApiEnv({ ...apiBase, NODE_ENV: "production" })).toThrow(/ENCRYPTION_KEY/);
  });

  it("rejects an empty CORS allowlist", () => {
    expect(() => loadApiEnv({ ...apiBase, API_CORS_ORIGINS: "" })).toThrow(
      /At least one allowed origin/,
    );
  });

  it("defaults the auth-specific rate limit and requires a positive value", () => {
    expect(loadApiEnv(apiBase).AUTH_RATE_LIMIT_LIMIT).toBe(10);
    expect(loadApiEnv({ ...apiBase, AUTH_RATE_LIMIT_LIMIT: "25" }).AUTH_RATE_LIMIT_LIMIT).toBe(25);
    expect(() => loadApiEnv({ ...apiBase, AUTH_RATE_LIMIT_LIMIT: "0" })).toThrow(
      /AUTH_RATE_LIMIT_LIMIT/,
    );
  });
});

describe("loadWorkerEnv", () => {
  it("accepts an empty internal token without a database URL", () => {
    const env = loadWorkerEnv({
      REDIS_URL: apiBase.REDIS_URL,
      INTERNAL_SERVICE_TOKEN: "",
    });
    expect(env.INTERNAL_SERVICE_TOKEN).toBeUndefined();
    expect(env.QUEUE_PREFIX).toBe("medicare");
  });

  it("rejects a token shorter than 16 characters", () => {
    expect(() =>
      loadWorkerEnv({
        REDIS_URL: apiBase.REDIS_URL,
        INTERNAL_SERVICE_TOKEN: "short",
      }),
    ).toThrow(/INTERNAL_SERVICE_TOKEN/);
  });
});
