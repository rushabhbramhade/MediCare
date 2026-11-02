import { HttpException } from "@nestjs/common";
import type { ApiEnv } from "@medicare/config";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { AuthRateLimitGuard } from "../guards/auth-rate-limit.guard";

const env = {
  RATE_LIMIT_TTL_MS: 60_000,
  AUTH_RATE_LIMIT_LIMIT: 2,
} as ApiEnv;

function contextFor(key: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: key, role: "patient" }, ip: "127.0.0.1" }),
    }),
  } as unknown as ExecutionContext;
}

describe("AuthRateLimitGuard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests up to the configured limit, then returns 429", () => {
    const guard = new AuthRateLimitGuard(env);
    const context = contextFor("user-1");

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(() => guard.canActivate(context)).toThrow(/Too many authentication attempts/);
  });

  it("counts each user separately", () => {
    const guard = new AuthRateLimitGuard(env);
    expect(guard.canActivate(contextFor("user-1"))).toBe(true);
    expect(guard.canActivate(contextFor("user-1"))).toBe(true);
    expect(guard.canActivate(contextFor("user-2"))).toBe(true);
  });

  it("resets after the window", () => {
    const guard = new AuthRateLimitGuard(env);
    const context = contextFor("user-1");
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);

    now += env.RATE_LIMIT_TTL_MS + 1;
    expect(guard.canActivate(context)).toBe(true);
  });
});
