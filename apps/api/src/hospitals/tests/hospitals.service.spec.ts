import { ServiceUnavailableException } from "@nestjs/common";
import type { Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseService } from "../../database/database.service";
import { DisabledHospitalProvider } from "../providers/disabled-hospital-provider";
import type { HospitalProvider, HospitalProviderDescriptor } from "../providers/hospital-provider";
import { HospitalsService } from "../services/hospitals.service";

const logger = { warn: vi.fn(), error: vi.fn() } as unknown as Logger;

const configuredDescriptor: HospitalProviderDescriptor = {
  name: "licensed-test",
  configured: true,
  capabilities: {
    search: true,
    specialtyFilter: true,
    emergencyFilter: true,
    liveBedAvailability: false,
  },
  provenance: { source: "licensed-test", license: "contract-1" },
  sync: { strategy: "scheduled", maxStalenessHours: 24 },
};

class ConfiguredProvider implements HospitalProvider {
  describe() {
    return configuredDescriptor;
  }
}

const baseRow = {
  id: "00000000-0000-0000-0000-0000000000c1",
  name: "Verified Hospital",
  address_line: "1 Test Road",
  city: "Mumbai",
  state: "Maharashtra",
  postal_code: "400001",
  latitude: 19.076,
  longitude: 72.8777,
  distance_km: 1.234,
  has_emergency: true,
  specialties: ["cardiology"],
  verification_status: "verified" as const,
  provider: "licensed-test",
  last_synced_at: new Date().toISOString(),
};

function createDatabase() {
  return { query: vi.fn() };
}

function createService(provider: HospitalProvider) {
  const database = createDatabase();
  const service = new HospitalsService(database as unknown as DatabaseService, provider, logger);
  return { database, service };
}

describe("HospitalsService with no provider", () => {
  it("returns the explicit no-source status without querying the database", async () => {
    const { database, service } = createService(new DisabledHospitalProvider("disabled", "test"));

    const result = await service.search({ latitude: 19.076, longitude: 72.8777 });

    expect(result).toEqual({
      status: "NO_DATA_SOURCE_CONFIGURED",
      data: [],
      meta: {
        source: null,
        liveAvailabilitySupported: false,
        capabilities: { specialtyFilter: false, emergencyFilter: false },
        radiusKm: 10,
        page: 1,
        pageSize: 20,
        total: 0,
        generatedAt: expect.any(String),
        maxStalenessHours: null,
      },
    });
    expect(database.query).not.toHaveBeenCalled();
  });
});

describe("HospitalsService with a configured provider", () => {
  let database: ReturnType<typeof createDatabase>;
  let service: HospitalsService;

  beforeEach(() => {
    ({ database, service } = createService(new ConfiguredProvider()));
  });

  it("maps rows, rounds distance and keeps bed availability unknown", async () => {
    const old = new Date(Date.now() - 48 * 3_600_000).toISOString();
    database.query
      .mockResolvedValueOnce({ rows: [{ ...baseRow, last_synced_at: old }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: "1" }], rowCount: 1 });

    const result = await service.search({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 5,
      specialty: "cardiology",
      emergencyOnly: true,
      page: 2,
      pageSize: 10,
    });

    expect(result.status).toBe("OK");
    expect(result.data[0]).toMatchObject({
      distanceKm: 1.23,
      bedAvailability: "unknown",
      isStale: true,
      verificationStatus: "verified",
      source: "licensed-test",
    });
    expect(result.meta).toMatchObject({
      source: "licensed-test",
      liveAvailabilitySupported: false,
      radiusKm: 5,
      page: 2,
      pageSize: 10,
      total: 1,
      maxStalenessHours: 24,
      capabilities: { specialtyFilter: true, emergencyFilter: true },
    });

    const rowQueryParams = database.query.mock.calls[0]?.[1];
    expect(rowQueryParams).toEqual([72.8777, 19.076, 5_000, "cardiology", true, 10, 10]);
    const countParams = database.query.mock.calls[1]?.[1];
    expect(countParams).toEqual([72.8777, 19.076, 5_000, "cardiology", true]);
  });

  it("treats a null specialty as no filter", async () => {
    database.query
      .mockResolvedValueOnce({ rows: [baseRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: "1" }], rowCount: 1 });

    await service.search({ latitude: 19.076, longitude: 72.8777 });
    expect(database.query.mock.calls[0]?.[1]?.[3]).toBeNull();
    expect(database.query.mock.calls[0]?.[1]?.[4]).toBe(false);
  });

  it("fails honestly when the database is unreachable", async () => {
    database.query.mockRejectedValue(new Error("connection refused"));

    await expect(service.search({ latitude: 19.076, longitude: 72.8777 })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      "hospital_search_failed",
    );
  });
});
