import { describe, expect, it } from "vitest";
import type { HospitalAvailability } from "@medicare/types";
import {
  computeCapacityStatus,
  isStaleReport,
  mapHospitalWithAvailability,
} from "../dashboard.dto";

const now = () => new Date().toISOString();

function availability(overrides: Partial<HospitalAvailability> = {}): HospitalAvailability {
  return {
    id: "av-1",
    hospitalId: "h-1",
    resourceType: "general_bed",
    status: "AVAILABLE",
    quantity: 10,
    source: "hospital staff",
    reportedAt: now(),
    verifiedAt: null,
    verificationStatus: "unverified",
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  };
}

describe("isStaleReport", () => {
  it("returns true when reportedAt is null", () => {
    expect(isStaleReport(null, 24)).toBe(true);
  });

  it("returns false when maxStalenessHours is null", () => {
    expect(isStaleReport(now(), null)).toBe(false);
  });

  it("returns true when report is older than maxStalenessHours", () => {
    const old = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    expect(isStaleReport(old, 24)).toBe(true);
  });

  it("returns false when report is within maxStalenessHours", () => {
    const recent = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(isStaleReport(recent, 24)).toBe(false);
  });
});

describe("computeCapacityStatus", () => {
  it("returns UNKNOWN when no availability rows exist", () => {
    const result = computeCapacityStatus([], 24);
    expect(result.status).toBe("UNKNOWN");
    expect(result.source).toBeNull();
    expect(result.reportedAt).toBeNull();
  });

  it("returns AVAILABLE when latest valid report has beds", () => {
    const result = computeCapacityStatus([availability()], 24);
    expect(result.status).toBe("AVAILABLE");
    expect(result.source).toBe("hospital staff");
  });

  it("returns LIMITED when latest valid report says LIMITED", () => {
    const result = computeCapacityStatus(
      [availability({ status: "LIMITED", quantity: 2 })],
      24,
    );
    expect(result.status).toBe("LIMITED");
  });

  it("returns FULL when latest valid report says FULL with zero quantity", () => {
    const result = computeCapacityStatus(
      [availability({ status: "FULL", quantity: 0 })],
      24,
    );
    expect(result.status).toBe("FULL");
  });

  it("returns STALE when the only report is older than maxStalenessHours", () => {
    const old = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    const result = computeCapacityStatus([availability({ reportedAt: old })], 24);
    expect(result.status).toBe("STALE");
  });

  it("prioritizes FULL over AVAILABLE when multiple resources exist", () => {
    const result = computeCapacityStatus(
      [
        availability({ resourceType: "general_bed", status: "AVAILABLE", quantity: 10 }),
        availability({ resourceType: "icu_bed", status: "FULL", quantity: 0 }),
      ],
      24,
    );
    expect(result.status).toBe("FULL");
  });

  it("prioritizes LIMITED over AVAILABLE", () => {
    const result = computeCapacityStatus(
      [
        availability({ resourceType: "general_bed", status: "AVAILABLE", quantity: 10 }),
        availability({ resourceType: "icu_bed", status: "LIMITED", quantity: 2 }),
      ],
      24,
    );
    expect(result.status).toBe("LIMITED");
  });

  it("uses the most recent non-stale report", () => {
    const older = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    const newer = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const result = computeCapacityStatus(
      [
        availability({ reportedAt: older, status: "FULL", quantity: 0 }),
        availability({ reportedAt: newer, status: "AVAILABLE", quantity: 5 }),
      ],
      24,
    );
    expect(result.status).toBe("AVAILABLE");
    expect(result.reportedAt).toBe(newer);
  });
});

describe("mapHospitalWithAvailability", () => {
  const summary = {
    id: "h-1",
    name: "Test Hospital",
    addressLine: "1 Test Road",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    latitude: 19.076,
    longitude: 72.8777,
    distanceKm: 2.5,
    hasEmergency: true,
    phone: "+912200000001",
    hospitalType: "private" as const,
    specialties: ["cardiology"],
    verificationStatus: "verified" as const,
    source: "licensed-provider",
    lastSyncedAt: now(),
    isStale: false,
    openingHours: null,
    isOpen24x7: null,
    hasAmbulance: null,
    bedAvailability: "unknown" as const,
    availability: [],
  };

  it("maps hospital with availability and capacity", () => {
    const result = mapHospitalWithAvailability(
      summary,
      [availability({ status: "AVAILABLE", quantity: 6 })],
      24,
    );
    expect(result.name).toBe("Test Hospital");
    expect(result.capacityStatus).toBe("AVAILABLE");
    expect(result.capacitySource).toBe("hospital staff");
    expect(result.roadEtaMinutes).toBeNull();
    expect(result.bedAvailability).toBe("unknown");
  });

  it("shows UNKNOWN capacity when no report exists", () => {
    const result = mapHospitalWithAvailability(summary, [], 24);
    expect(result.capacityStatus).toBe("UNKNOWN");
    expect(result.capacitySource).toBeNull();
    expect(result.capacityReportedAt).toBeNull();
  });
});
