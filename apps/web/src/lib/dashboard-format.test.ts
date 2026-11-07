import type { DashboardHospital } from "@medicare/contracts";
import { describe, expect, it } from "vitest";
import {
  capacityStatusLabel,
  displayName,
  formatDistanceKm,
  greetingForHour,
  hospitalAddress,
  resourceTypeLabel,
} from "./dashboard-format";

function hospital(overrides: Partial<DashboardHospital> = {}): DashboardHospital {
  return {
    id: "h-1",
    name: "Test Hospital",
    addressLine: "1 Test Road",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    latitude: 19.076,
    longitude: 72.8777,
    distanceKm: 2.54,
    hasEmergency: true,
    phone: null,
    hospitalType: "private",
    specialties: [],
    verificationStatus: "verified",
    source: "test-source",
    lastSyncedAt: new Date().toISOString(),
    isStale: false,
    bedAvailability: "unknown",
    availability: [],
    capacityStatus: "UNKNOWN",
    capacitySource: null,
    capacityReportedAt: null,
    roadEtaMinutes: null,
    ...overrides,
  };
}

describe("greetingForHour", () => {
  it("changes with the time of day", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(13)).toBe("Good afternoon");
    expect(greetingForHour(20)).toBe("Good evening");
  });
});

describe("displayName", () => {
  it("uses the first name and handles missing profiles", () => {
    expect(displayName("Asha Rao")).toBe("Asha");
    expect(displayName("   ")).toBeNull();
    expect(displayName(null)).toBeNull();
  });
});

describe("hospital formatting", () => {
  it("joins only the address parts the source provided", () => {
    expect(hospitalAddress(hospital())).toBe("1 Test Road, Mumbai, Maharashtra, 400001");
    expect(hospitalAddress(hospital({ addressLine: null, city: null, state: null, postalCode: null }))).toBe(
      "Address not provided by the data source",
    );
  });

  it("formats distances and unknown capacity honestly", () => {
    expect(formatDistanceKm(2.54)).toBe("2.5 km");
    expect(capacityStatusLabel("UNKNOWN")).toBe("Unknown");
    expect(capacityStatusLabel("STALE")).toBe("Report outdated");
  });

  it("labels every resource type the backend stores", () => {
    expect(resourceTypeLabel("general_bed")).toBe("General ward");
    expect(resourceTypeLabel("icu_bed")).toBe("ICU beds");
    expect(resourceTypeLabel("ambulance")).toBe("Ambulance");
  });
});
