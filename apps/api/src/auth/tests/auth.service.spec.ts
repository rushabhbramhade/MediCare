import { describe, expect, it } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { ApiEnv } from "@medicare/config";
import { AuthService, mapClaimsToUser } from "../services/auth.service";

const env = {
  JWT_ISSUER: "https://example.supabase.co/auth/v1",
  JWT_AUDIENCE: "authenticated",
  JWT_JWKS_URL: "https://example.supabase.co/auth/v1/.well-known/jwks.json",
} as ApiEnv;

describe("mapClaimsToUser", () => {
  it("defaults to patient and trusts only app_metadata roles", () => {
    expect(mapClaimsToUser({ sub: "user-1" })).toEqual({ id: "user-1", role: "patient" });
    expect(mapClaimsToUser({ sub: "user-2", app_metadata: { role: "doctor" } })).toMatchObject({
      id: "user-2",
      role: "doctor",
    });
    expect(
      mapClaimsToUser({
        sub: "user-3",
        app_metadata: { role: "admin" },
        user_metadata: { role: "patient" },
      }),
    ).toMatchObject({ role: "admin" });
  });

  it("ignores unknown or user-controlled roles", () => {
    expect(mapClaimsToUser({ sub: "user-4", app_metadata: { role: "superuser" } })).toMatchObject({
      role: "patient",
    });
    expect(mapClaimsToUser({ sub: "user-5", user_metadata: { role: "admin" } })).toMatchObject({
      role: "patient",
    });
  });

  it("keeps contact claims when present", () => {
    expect(mapClaimsToUser({ sub: "user-6", phone: "+919876543210" })).toEqual({
      id: "user-6",
      role: "patient",
      phone: "+919876543210",
    });
  });

  it("rejects tokens without a subject", () => {
    expect(() => mapClaimsToUser({})).toThrow(UnauthorizedException);
  });
});

describe("AuthService", () => {
  it("rejects a malformed access token without calling the JWKS endpoint", async () => {
    const auth = new AuthService(env);
    await expect(auth.verifyToken("not-a-jwt")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
