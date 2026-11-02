import { UnauthorizedException, type INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import type { AuthUser, PatientProfile } from "@medicare/types";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AuthService } from "../../auth/services/auth.service";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard";
import { PatientsController } from "../controllers/patients.controller";
import { PatientsService } from "../services/patients.service";

const user: AuthUser = {
  id: "00000000-0000-0000-0000-0000000000a1",
  role: "patient",
  phone: "+919876543210",
};

const profile: PatientProfile = {
  id: "00000000-0000-0000-0000-0000000000b1",
  fullName: "Asha Rao",
  dateOfBirth: null,
  gender: null,
  phone: "+919876543210",
  preferredLanguage: "en",
  accessibilityPreferences: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("PatientsController", () => {
  let app: INestApplication;
  const patients = {
    getProfile: vi.fn(async () => profile),
    putProfile: vi.fn(async () => profile),
    patchProfile: vi.fn(async () => profile),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        Reflector,
        { provide: PatientsService, useValue: patients },
        {
          provide: AuthService,
          useValue: {
            verifyToken: vi.fn(async (token: string) => {
              if (token === "valid-token") return user;
              throw new UnauthorizedException("Invalid or expired access token");
            }),
          },
        },
        SupabaseAuthGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalGuards(moduleRef.get(SupabaseAuthGuard));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated access", async () => {
    await request(app.getHttpServer()).get("/v1/patients/me").expect(401);
    expect(patients.getProfile).not.toHaveBeenCalled();
  });

  it("rejects an invalid bearer token", async () => {
    await request(app.getHttpServer())
      .get("/v1/patients/me")
      .set("authorization", "Bearer bad-token")
      .expect(401);
  });

  it("reads the profile for the verified subject", async () => {
    const response = await request(app.getHttpServer())
      .get("/v1/patients/me")
      .set("authorization", "Bearer valid-token")
      .expect(200);

    expect(response.body).toEqual({ profile });
    expect(patients.getProfile).toHaveBeenCalledWith(user, undefined);
  });

  it("rejects a payload that tries to set another user id", async () => {
    await request(app.getHttpServer())
      .put("/v1/patients/me")
      .set("authorization", "Bearer valid-token")
      .send({
        fullName: "Asha Rao",
        userId: "00000000-0000-0000-0000-0000000000ff",
      })
      .expect(400);

    expect(patients.putProfile).not.toHaveBeenCalled();
  });

  it("passes the verified identity to the service, not a body id", async () => {
    await request(app.getHttpServer())
      .put("/v1/patients/me")
      .set("authorization", "Bearer valid-token")
      .send({ fullName: "Asha Rao", preferredLanguage: "en" })
      .expect(200);

    expect(patients.putProfile).toHaveBeenCalledWith(
      user,
      { fullName: "Asha Rao", preferredLanguage: "en", accessibilityPreferences: [] },
      undefined,
    );
  });

  it("rejects an empty PATCH body", async () => {
    await request(app.getHttpServer())
      .patch("/v1/patients/me")
      .set("authorization", "Bearer valid-token")
      .send({})
      .expect(400);
  });
});
