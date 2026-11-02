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

  it("requires ENCRYPTION_KEY in production", () => {
    expect(() => loadApiEnv({ ...apiBase, NODE_ENV: "production" })).toThrow(/ENCRYPTION_KEY/);
  });

  it("rejects an empty CORS allowlist", () => {
    expect(() => loadApiEnv({ ...apiBase, API_CORS_ORIGINS: "" })).toThrow(
      /At least one allowed origin/,
    );
  });
});

describe("loadWorkerEnv", () => {
  it("accepts an empty internal token", () => {
    const env = loadWorkerEnv({
      DATABASE_URL: apiBase.DATABASE_URL,
      REDIS_URL: apiBase.REDIS_URL,
      INTERNAL_SERVICE_TOKEN: "",
    });
    expect(env.INTERNAL_SERVICE_TOKEN).toBeUndefined();
    expect(env.QUEUE_PREFIX).toBe("medicare");
  });

  it("rejects a token shorter than 16 characters", () => {
    expect(() =>
      loadWorkerEnv({
        DATABASE_URL: apiBase.DATABASE_URL,
        REDIS_URL: apiBase.REDIS_URL,
        INTERNAL_SERVICE_TOKEN: "short",
      }),
    ).toThrow(/INTERNAL_SERVICE_TOKEN/);
  });
});
