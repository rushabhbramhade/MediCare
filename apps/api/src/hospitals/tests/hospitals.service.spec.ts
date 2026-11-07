import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";
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

const availabilityJson = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    hospital_id: "00000000-0000-0000-0000-0000000000c1",
    resource_type: "icu_bed",
    status: "AVAILABLE",
    quantity: 6,
    source: "hospital-report",
    reported_at: "2026-01-01T10:00:00.000Z",
    verified_at: null,
    verification_status: "verified",
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
  },
];

const baseRow = {
  id: "00000000-0000-0000-0000-0000000000c1",
  external_id: "ext-1",
  name: "Verified Hospital",
  address_line: "1 Test Road",
  city: "Mumbai",
  state: "Maharashtra",
  postal_code: "400001",
  country_code: "IN",
  latitude: 19.076,
  longitude: 72.8777,
  distance_km: 1.234,
  has_emergency: true,
  phone: "+912200000001",
  hospital_type: "private" as const,
  specialties: ["cardiology"],
  opening_hours: "Open 24 hours",
  is_open_24x7: true,
  has_ambulance: true,
  verification_status: "verified" as const,
  provider: "licensed-test",
  last_synced_at: new Date().toISOString(),
  last_verified_at: new Date().toISOString(),
  is_active: true,
  availability: availabilityJson,
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
        capabilities: {
          specialtyFilter: false,
          emergencyFilter: false,
          typeFilter: false,
        },
        radiusKm: 5,
        page: 1,
        pageSize: 20,
        total: 0,
        generatedAt: expect.any(String),
        maxStalenessHours: null,
      },
    });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("refuses to return a hospital detail when no provider is configured", async () => {
    const { database, service } = createService(new DisabledHospitalProvider("disabled", "test"));
    await expect(service.getById(baseRow.id)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(database.query).not.toHaveBeenCalled();
  });
});

describe("HospitalsService with a configured provider", () => {
  let database: ReturnType<typeof createDatabase>;
  let service: HospitalsService;

  beforeEach(() => {
    ({ database, service } = createService(new ConfiguredProvider()));
  });

  it("maps rows, availability provenance, distance and staleness", async () => {
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
      openingHours: "Open 24 hours",
      isOpen24x7: true,
      hasAmbulance: true,
    });
    expect(result.data[0]?.availability).toEqual([
      expect.objectContaining({
        resourceType: "icu_bed",
        status: "AVAILABLE",
        quantity: 6,
        source: "hospital-report",
        reportedAt: "2026-01-01T10:00:00.000Z",
      }),
    ]);
    expect(result.meta).toMatchObject({
      source: "licensed-test",
      liveAvailabilitySupported: false,
      radiusKm: 5,
      page: 2,
      pageSize: 10,
      total: 1,
      maxStalenessHours: 24,
    });

    const rowQueryParams = database.query.mock.calls[0]?.[1];
    expect(rowQueryParams).toEqual([72.8777, 19.076, 5_000, "cardiology", 10, 10]);
    const countParams = database.query.mock.calls[1]?.[1];
    expect(countParams).toEqual([72.8777, 19.076, 5_000, "cardiology"]);
  });

  it("supports text, ownership, 24x7 and ambulance filters", async () => {
    database.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: "0" }], rowCount: 1 });

    await service.search({
      latitude: 19.076,
      longitude: 72.8777,
      q: "Manipal",
      hospitalType: "private",
      open24x7: true,
      ambulanceAvailable: true,
    });

    const sql = database.query.mock.calls[0]?.[0] as string;
    expect(sql).toContain("ILIKE");
    expect(sql).toContain("h.hospital_type =");
    expect(sql).toContain("h.is_open_24x7 IS TRUE");
    expect(sql).toContain("h.has_ambulance IS TRUE");
    const params = database.query.mock.calls[0]?.[1] as unknown[];
    expect(params).toContain("%Manipal%");
    expect(params).toContain("private");
  });

  it("uses bbox instead of radius when a viewport is supplied", async () => {
    database.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: "0" }], rowCount: 1 });

    await service.search({
      latitude: 19.076,
      longitude: 72.8777,
      bbox: "72.8,19.0,72.94,19.14",
    });

    const sql = database.query.mock.calls[0]?.[0] as string;
    expect(sql).toContain("ST_Intersects");
    expect(sql).toContain("ST_MakeEnvelope");
    expect(sql).not.toContain("ST_DWithin");
    const params = database.query.mock.calls[0]?.[1] as unknown[];
    expect(params.slice(2, 6)).toEqual([72.8, 19.0, 72.94, 19.14]);
  });

  it("filters bed and ICU availability on fresh reports only", async () => {
    database.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: "0" }], rowCount: 1 });

    await service.search({
      latitude: 19.076,
      longitude: 72.8777,
      availableBeds: true,
      icuAvailable: true,
    });

    const sql = database.query.mock.calls[0]?.[0] as string;
    expect(sql).toContain("a.resource_type = $");
    expect(sql).toContain("a.status IN ('AVAILABLE', 'LIMITED')");
    expect(sql).toContain("a.quantity IS NULL OR a.quantity > 0");
    expect(sql).toContain("interval '1 hour'");
    const params = database.query.mock.calls[0]?.[1] as unknown[];
    expect(params).toContain("general_bed");
    expect(params).toContain("icu_bed");
    expect(params).toContain(24);
  });

  it("returns a detail record with a null distance instead of inventing one", async () => {
    database.query.mockResolvedValueOnce({
      rows: [{ ...baseRow, distance_km: null }],
      rowCount: 1,
    });

    const detail = await service.getById(baseRow.id);

    expect(detail).toMatchObject({
      id: baseRow.id,
      externalId: "ext-1",
      countryCode: "IN",
      distanceKm: null,
      lastVerifiedAt: expect.any(String),
    });
    expect(detail.availability).toHaveLength(1);
  });

  it("returns 404 for an unknown hospital", async () => {
    database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(service.getById(baseRow.id)).rejects.toBeInstanceOf(NotFoundException);
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
