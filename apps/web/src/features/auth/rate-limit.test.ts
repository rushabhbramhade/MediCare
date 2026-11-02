import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit", () => {
    const now = 1_000;
    expect(checkRateLimit("phone:1", 2, now).allowed).toBe(true);
    expect(checkRateLimit("phone:1", 2, now).allowed).toBe(true);
  });

  it("blocks the request over the limit and reports the wait", () => {
    const now = 1_000;
    checkRateLimit("phone:1", 1, now);
    expect(checkRateLimit("phone:1", 1, now)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it("resets after the window", () => {
    const now = 1_000;
    checkRateLimit("phone:1", 1, now);
    expect(checkRateLimit("phone:1", 1, now + 60_001).allowed).toBe(true);
  });

  it("keeps keys independent", () => {
    const now = 1_000;
    checkRateLimit("phone:1", 1, now);
    expect(checkRateLimit("phone:2", 1, now).allowed).toBe(true);
  });
});
