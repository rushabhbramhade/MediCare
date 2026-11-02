import type { Role } from "@medicare/types";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { RolesGuard } from "./roles.guard";

function contextFor(role: Role | undefined): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { id: "user-1", role } : {} }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: Role[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: vi.fn(() => roles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe("RolesGuard", () => {
  it("allows routes without a role requirement", () => {
    expect(guardRequiring(undefined).canActivate(contextFor(undefined))).toBe(true);
  });

  it("allows an exact role match", () => {
    expect(guardRequiring(["doctor"]).canActivate(contextFor("doctor"))).toBe(true);
  });

  it("denies a different role", () => {
    expect(() => guardRequiring(["doctor"]).canActivate(contextFor("patient"))).toThrow(
      ForbiddenException,
    );
  });

  it("lets platform_admin through every role check", () => {
    expect(guardRequiring(["hospital_admin"]).canActivate(contextFor("platform_admin"))).toBe(true);
  });

  it("denies when authentication did not run", () => {
    expect(() => guardRequiring(["patient"]).canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
