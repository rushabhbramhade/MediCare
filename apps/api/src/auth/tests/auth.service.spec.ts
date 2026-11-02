import { generateKeyPairSync } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { ApiEnv } from "@medicare/config";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AuthService, mapClaimsToUser } from "../services/auth.service";

const jwks = vi.hoisted(() => ({ getSigningKey: vi.fn() }));

vi.mock("jwks-rsa", () => ({
  default: vi.fn(() => ({ getSigningKey: jwks.getSigningKey })),
}));

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
        app_metadata: { role: "platform_admin" },
        user_metadata: { role: "patient" },
      }),
    ).toMatchObject({ role: "platform_admin" });
  });

  it("ignores unknown or user-controlled roles", () => {
    expect(mapClaimsToUser({ sub: "user-4", app_metadata: { role: "superuser" } })).toMatchObject({
      role: "patient",
    });
    expect(
      mapClaimsToUser({ sub: "user-5", user_metadata: { role: "platform_admin" } }),
    ).toMatchObject({ role: "patient" });
    expect(mapClaimsToUser({ sub: "user-7", app_metadata: { role: "admin" } })).toMatchObject({
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
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const otherKey = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  beforeAll(() => {
    jwks.getSigningKey.mockImplementation(
      (_kid: string, callback: (error: Error | null, key?: unknown) => void) =>
        callback(null, { getPublicKey: () => publicKey }),
    );
  });

  function sign(
    payload: Record<string, unknown> = {},
    options: SignOptions = {},
    key = privateKey,
  ): string {
    return jwt.sign({ sub: "user-1", ...payload }, key, {
      algorithm: "RS256",
      keyid: "test-key",
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: "5m",
      ...options,
    });
  }

  it("rejects a malformed access token without calling the JWKS endpoint", async () => {
    jwks.getSigningKey.mockClear();
    const auth = new AuthService(env);
    await expect(auth.verifyToken("not-a-jwt")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwks.getSigningKey).not.toHaveBeenCalled();
  });

  it("accepts a token with a valid signature, issuer, audience and subject", async () => {
    const auth = new AuthService(env);
    await expect(auth.verifyToken(sign({ phone: "+919876543210" }))).resolves.toEqual({
      id: "user-1",
      role: "patient",
      phone: "+919876543210",
    });
  });

  it("maps app_metadata.role from a verified token", async () => {
    const auth = new AuthService(env);
    await expect(
      auth.verifyToken(sign({ app_metadata: { role: "doctor" } })),
    ).resolves.toMatchObject({ id: "user-1", role: "doctor" });
  });

  it("rejects a token signed by a different key", async () => {
    const auth = new AuthService(env);
    await expect(auth.verifyToken(sign({}, {}, otherKey.privateKey))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects an expired token", async () => {
    const auth = new AuthService(env);
    const token = jwt.sign({ sub: "user-1", exp: Math.floor(Date.now() / 1000) - 60 }, privateKey, {
      algorithm: "RS256",
      keyid: "test-key",
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    await expect(auth.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token from the wrong issuer", async () => {
    const auth = new AuthService(env);
    const token = sign({}, { issuer: "https://evil.example/auth/v1" });
    await expect(auth.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token for the wrong audience", async () => {
    const auth = new AuthService(env);
    const token = sign({}, { audience: "another-app" });
    await expect(auth.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token without a subject", async () => {
    const auth = new AuthService(env);
    const token = jwt.sign({ role: "patient" }, privateKey, {
      algorithm: "RS256",
      keyid: "test-key",
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: "5m",
    });
    await expect(auth.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("does not leak verifier details in the error message", async () => {
    const auth = new AuthService(env);
    await expect(auth.verifyToken(sign({}, { audience: "another-app" }))).rejects.toMatchObject({
      message: "Invalid or expired access token",
    });
  });
});
