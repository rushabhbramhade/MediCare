import { ApiClientError } from "@medicare/api-client";
import type { HospitalSearchResponse, HospitalSummary } from "@medicare/types";
import { describe, expect, it } from "vitest";
import { locationErrorMessage } from "../../lib/location";
import {
  NO_DATA_SOURCE_MESSAGE,
  parseManualCoordinates,
  toHospitalViewState,
} from "./hospital-view-state";

const hospital: HospitalSummary = {
  id: "hospital-1",
  name: "Verified Hospital",
  addressLine: "1 Test Road",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  latitude: 19.076,
  longitude: 72.8777,
  distanceKm: 1.2,
  hasEmergency: true,
  phone: null,
  hospitalType: null,
  specialties: ["cardiology"],
  verificationStatus: "verified",
  source: "licensed-test",
  lastSyncedAt: "2026-01-01T00:00:00.000Z",
  isStale: false,
  bedAvailability: "unknown",
};

const meta: HospitalSearchResponse["meta"] = {
  source: "licensed-test",
  liveAvailabilitySupported: false,
  capabilities: { specialtyFilter: true, emergencyFilter: true, typeFilter: true },
  radiusKm: 10,
  page: 1,
  pageSize: 10,
  total: 1,
  generatedAt: "2026-01-01T00:00:00.000Z",
  maxStalenessHours: 24,
};

describe("hospital view state", () => {
  it("stays idle before a location is chosen", () => {
    expect(
      toHospitalViewState({ searched: false, isLoading: false, error: null, result: undefined }),
    ).toEqual({ kind: "idle" });
  });

  it("shows loading while searching", () => {
    expect(
      toHospitalViewState({ searched: true, isLoading: true, error: null, result: undefined }),
    ).toEqual({ kind: "loading" });
  });

  it("shows the explicit no-data-source state", () => {
    expect(
      toHospitalViewState({
        searched: true,
        isLoading: false,
        error: null,
        result: {
          status: "NO_DATA_SOURCE_CONFIGURED",
          data: [],
          meta: { ...meta, source: null, total: 0 },
        },
      }),
    ).toEqual({ kind: "no-source", message: NO_DATA_SOURCE_MESSAGE });
  });

  it("shows an empty result for a configured provider with no nearby records", () => {
    expect(
      toHospitalViewState({
        searched: true,
        isLoading: false,
        error: null,
        result: { status: "OK", data: [], meta: { ...meta, total: 0 } },
      }),
    ).toEqual({ kind: "empty", radiusKm: 10 });
  });

  it("shows only returned hospitals", () => {
    expect(
      toHospitalViewState({
        searched: true,
        isLoading: false,
        error: null,
        result: { status: "OK", data: [hospital], meta },
      }),
    ).toEqual({ kind: "results", hospitals: [hospital], meta });
  });

  it("shows an error with a safe message", () => {
    expect(
      toHospitalViewState({
        searched: true,
        isLoading: false,
        error: new Error("Hospital search is temporarily unavailable"),
        result: undefined,
      }),
    ).toEqual({ kind: "error", message: "Hospital search is temporarily unavailable" });
  });

  it("detects an expired session", () => {
    expect(
      toHospitalViewState({
        searched: true,
        isLoading: false,
        error: new ApiClientError("Unauthorized", { status: 401, code: "unauthorized" }),
        result: undefined,
      }),
    ).toEqual({ kind: "session-expired" });
  });
});

describe("manual coordinates", () => {
  it("accepts valid coordinates", () => {
    expect(parseManualCoordinates("19.076", "72.8777")).toEqual({
      ok: true,
      latitude: 19.076,
      longitude: 72.8777,
    });
  });

  it("rejects empty, non-numeric and out-of-range coordinates", () => {
    expect(parseManualCoordinates("", "72.8")).toMatchObject({ ok: false });
    expect(parseManualCoordinates("north", "72.8")).toMatchObject({ ok: false });
    expect(parseManualCoordinates("91", "72.8")).toMatchObject({ ok: false });
    expect(parseManualCoordinates("19", "181")).toMatchObject({ ok: false });
  });
});

describe("location permission copy", () => {
  it("offers manual entry when permission is denied", () => {
    expect(locationErrorMessage("denied")).toContain("coordinates");
    expect(locationErrorMessage("unavailable")).toContain("coordinates");
    expect(locationErrorMessage("granted")).toBeNull();
  });
});
