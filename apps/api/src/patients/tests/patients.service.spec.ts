import { NotFoundException } from "@nestjs/common";
import type { AuthUser } from "@medicare/types";
import { describe, expect, it, vi } from "vitest";
import type { AuditService } from "../../audit/audit.service";
import type { DatabaseService } from "../../database/database.service";
import { PatientsService, mapProfileRow } from "../services/patients.service";

const actor: AuthUser = {
  id: "00000000-0000-0000-0000-0000000000a1",
  role: "patient",
  phone: "+919876543210",
};

const row = {
  id: "00000000-0000-0000-0000-0000000000b1",
  full_name: "Asha Rao",
  date_of_birth: "1990-04-12",
  gender: "female" as const,
  phone: "+919876543210",
  preferred_language: "en" as const,
  accessibility_preferences: ["large_text" as const],
  emergency_contact_phone: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

function createHarness() {
  const client = { query: vi.fn() };
  const database = {
    query: vi.fn(),
    withTransaction: vi.fn(async (work: (c: typeof client) => Promise<unknown>) => work(client)),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined), recordWithin: vi.fn() };
  const service = new PatientsService(
    database as unknown as DatabaseService,
    audit as unknown as AuditService,
  );
  return { client, database, audit, service };
}

describe("mapProfileRow", () => {
  it("maps database columns to the public profile shape", () => {
    expect(mapProfileRow(row)).toEqual({
      id: row.id,
      fullName: "Asha Rao",
      dateOfBirth: "1990-04-12",
      gender: "female",
      phone: "+919876543210",
      preferredLanguage: "en",
      accessibilityPreferences: ["large_text"],
      emergencyContactPhone: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });
});

describe("PatientsService reads", () => {
  it("returns only the profile scoped to the verified subject", async () => {
    const { database, audit, service } = createHarness();
    database.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });

    await expect(service.getProfile(actor, "req-1")).resolves.toMatchObject({ id: row.id });
    expect(database.query.mock.calls[0]?.[1]).toEqual([actor.id]);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "patient_profile.read",
        resourceId: row.id,
        actorId: actor.id,
        requestId: "req-1",
      }),
    );
  });

  it("returns profile_not_found when the subject has no profile", async () => {
    const { database, service } = createHarness();
    database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(service.getProfile(actor)).rejects.toMatchObject({
      response: { code: "profile_not_found" },
    });
  });
});

describe("PatientsService writes", () => {
  it("creates a profile with the identity phone and a transactional audit row", async () => {
    const { client, audit, service } = createHarness();
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...row, inserted: true }], rowCount: 1 });
    audit.recordWithin.mockResolvedValue(undefined);

    const profile = await service.putProfile(
      actor,
      {
        fullName: "Asha Rao",
        dateOfBirth: "1990-04-12",
        gender: "female",
        preferredLanguage: "en",
        accessibilityPreferences: ["large_text"],
      },
      "req-2",
    );

    expect(profile.id).toBe(row.id);
    expect(client.query.mock.calls[0]?.[1]).toEqual([actor.id, actor.phone, "patient"]);
    expect(client.query.mock.calls[1]?.[1]).toEqual([
      actor.id,
      "Asha Rao",
      "1990-04-12",
      "female",
      actor.phone,
      "en",
      ["large_text"],
      null,
    ]);
    expect(audit.recordWithin).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        action: "patient_profile.created",
        actorId: actor.id,
        requestId: "req-2",
        metadata: { changedFields: expect.arrayContaining(["fullName"]) },
      }),
    );
  });

  it("never takes ownership from the payload", async () => {
    const { client, audit, service } = createHarness();
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...row, inserted: true }], rowCount: 1 });
    audit.recordWithin.mockResolvedValue(undefined);

    const payloadWithUserId = {
      fullName: "Asha Rao",
      userId: "00000000-0000-0000-0000-0000000000ff",
    } as unknown as { fullName: string };

    await service.putProfile(actor, payloadWithUserId);
    expect(client.query.mock.calls[1]?.[1]?.[0]).toBe(actor.id);
  });

  it("rolls back when the audit write fails", async () => {
    const { client, audit, service } = createHarness();
    client.query
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ ...row, inserted: true }], rowCount: 1 });
    audit.recordWithin.mockRejectedValueOnce(new Error("audit down"));

    await expect(service.putProfile(actor, { fullName: "Asha Rao" })).rejects.toThrow("audit down");
  });

  it("returns profile_not_found when patching a profile that does not exist", async () => {
    const { client, service } = createHarness();
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(service.patchProfile(actor, { fullName: "Asha Rao" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("updates only provided fields and audits the change", async () => {
    const { client, audit, service } = createHarness();
    client.query.mockResolvedValueOnce({ rows: [row], rowCount: 1 });
    audit.recordWithin.mockResolvedValue(undefined);

    await service.patchProfile(actor, { fullName: "Asha R." }, "req-3");
    expect(client.query.mock.calls[0]?.[1]?.slice(0, 3)).toEqual([actor.id, true, "Asha R."]);
    expect(client.query.mock.calls[0]?.[1]?.slice(3, 5)).toEqual([false, null]);
    expect(audit.recordWithin).toHaveBeenCalledWith(
      client,
      expect.objectContaining({ action: "patient_profile.updated", requestId: "req-3" }),
    );
  });
});
