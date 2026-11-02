import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { DatabaseService } from "../../database/database.service";
import { HospitalAvailabilityService } from "../services/hospital-availability.service";

const hospitalId = "00000000-0000-0000-0000-0000000000a1";

function createDatabase() {
  return { query: vi.fn() };
}

function createService() {
  const database = createDatabase();
  const service = new HospitalAvailabilityService(database as unknown as DatabaseService);
  return { database, service };
}

describe("HospitalAvailabilityService", () => {
  it("returns empty availability list for a hospital with no records", async () => {
    const { database, service } = createService();
    database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await service.getAvailability(hospitalId);

    expect(result).toEqual([]);
    expect(database.query.mock.calls[0]?.[1]).toEqual([hospitalId]);
  });

  it("maps availability rows correctly", async () => {
    const { database, service } = createService();
    const now = new Date("2026-01-01T00:00:00.000Z");
    database.query.mockResolvedValueOnce({
      rows: [
        {
          id: "av-1",
          hospital_id: hospitalId,
          resource_type: "icu_bed",
          status: "AVAILABLE",
          quantity: 5,
          source: "hospital-admin",
          reported_at: now,
          verified_at: now,
          verification_status: "verified",
          created_at: now,
          updated_at: now,
        },
      ],
      rowCount: 1,
    });

    const result = await service.getAvailability(hospitalId);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "av-1",
      hospitalId,
      resourceType: "icu_bed",
      status: "AVAILABLE",
      quantity: 5,
      source: "hospital-admin",
      verificationStatus: "verified",
    });
  });

  it("upserts a new availability record", async () => {
    const { database, service } = createService();
    database.query
      .mockResolvedValueOnce({ rows: [{ id: hospitalId }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "av-1",
            hospital_id: hospitalId,
            resource_type: "general_bed",
            status: "LIMITED",
            quantity: 10,
            source: "hospital-admin",
            reported_at: new Date(),
            verified_at: null,
            verification_status: "unverified",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        rowCount: 1,
      });

    const result = await service.upsertAvailability(hospitalId, "general_bed", {
      status: "LIMITED",
      quantity: 10,
      source: "hospital-admin",
    });

    expect(result.resourceType).toBe("general_bed");
    expect(result.status).toBe("LIMITED");
    expect(result.quantity).toBe(10);
    expect(result.verificationStatus).toBe("unverified");
  });

  it("throws NotFoundException when hospital does not exist", async () => {
    const { database, service } = createService();
    database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(
      service.upsertAvailability("nonexistent", "general_bed", {
        status: "AVAILABLE",
        source: "test",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
