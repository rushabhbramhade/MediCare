import type { HospitalAvailability, HospitalSummary } from "@medicare/types";
import { describe, expect, it } from "vitest";
import {
  directionsUrl,
  emergencyBadge,
  hospitalAddress,
  hospitalTypeLabel,
  latestReport,
  reportLabel,
} from "./hospital-data";

function report(overrides: Partial<HospitalAvailability>): HospitalAvailability {
  return {
    id: "report-1",
    hospitalId: "hospital-1",
    resourceType: "icu_bed",
    status: "AVAILABLE",
    quantity: 6,
    source: "hospital-report",
    reportedAt: "2026-01-01T10:00:00.000Z",
    verifiedAt: null,
    verificationStatus: "verified",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

const hospital = (availability: HospitalAvailability[]): Pick<HospitalSummary, "availability"> => ({
  availability,
});

describe("hospital formatting", () => {
  it("returns the newest non-unknown report for a resource", () => {
    const view = latestReport(
      hospital([
        report({ id: "old", reportedAt: "2026-01-01T08:00:00.000Z", quantity: 2 }),
        report({ id: "new", reportedAt: "2026-01-01T12:00:00.000Z", quantity: 6 }),
        report({ id: "unknown", status: "UNKNOWN", quantity: null }),
      ]),
      "icu_bed",
      24,
      new Date("2026-01-01T13:00:00.000Z").getTime(),
    );

    expect(view?.report.id).toBe("new");
    expect(view?.fresh).toBe(true);
    expect(view?.label).toBe("6 reported available");
  });

  it("returns null when nothing has been reported", () => {
    expect(latestReport(hospital([]), "general_bed", 24)).toBeNull();
    expect(
      latestReport(hospital([report({ status: "UNKNOWN", quantity: null })]), "general_bed", 24),
    ).toBeNull();
  });

  it("marks reports past the freshness window as stale", () => {
    const view = latestReport(
      hospital([report({ reportedAt: "2026-01-01T10:00:00.000Z" })]),
      "icu_bed",
      1,
      new Date("2026-01-01T13:00:00.000Z").getTime(),
    );
    expect(view?.fresh).toBe(false);
  });

  it("labels reported statuses without inventing counts", () => {
    expect(reportLabel(report({ quantity: null, status: "LIMITED" }))).toBe(
      "Reported limited",
    );
    expect(reportLabel(report({ quantity: null, status: "FULL" }))).toBe("Reported full");
    expect(reportLabel(report({ quantity: 0, status: "FULL" }))).toBe("Reported full");
    expect(reportLabel(report({ quantity: 0 }))).toBe("0 reported available");
  });

  it("builds an OSM directions link from the user location", () => {
    const url = directionsUrl(
      { latitude: 19.076, longitude: 72.8777 },
      { latitude: 19.02, longitude: 72.85 },
    );
    expect(url).toContain("openstreetmap.org/directions");
    expect(url).toContain("19.02%2C72.85%3B19.076%2C72.8777");
  });

  it("keeps unknown emergency data unknown", () => {
    expect(emergencyBadge(null)).toEqual({
      label: "Emergency services not reported",
      known: false,
      available: false,
    });
    expect(emergencyBadge(true).available).toBe(true);
  });

  it("formats addresses and ownership", () => {
    expect(
      hospitalAddress({
        addressLine: "1 Test Road",
        city: "Mumbai",
        state: null,
        postalCode: null,
      }),
    ).toBe("1 Test Road, Mumbai");
    expect(hospitalAddress({ addressLine: null, city: null, state: null, postalCode: null }))
      .toBe("Address not reported");
    expect(hospitalTypeLabel("government")).toBe("Government");
    expect(hospitalTypeLabel(null)).toBeNull();
  });
});
