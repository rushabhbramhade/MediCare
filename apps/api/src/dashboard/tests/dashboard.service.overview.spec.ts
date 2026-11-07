import type { AuthUser, PatientProfile } from "@medicare/types";
import type { Logger } from "pino";
import { describe, expect, it, vi } from "vitest";
import { DisabledHospitalProvider } from "../../hospitals/providers/disabled-hospital-provider";
import type { HospitalAvailabilityService } from "../../hospitals/services/hospital-availability.service";
import type { HospitalsService } from "../../hospitals/services/hospitals.service";
import type { GoogleMapsService } from "../../map/services/google-maps.service";
import type { PatientsService } from "../../patients/services/patients.service";
import { DashboardService } from "../dashboard.service";

const actor: AuthUser = { id: "user-1", role: "patient", phone: "+919876543210" };

const profile: PatientProfile = {
  id: "profile-1",
  fullName: "Asha Rao",
  dateOfBirth: null,
  gender: null,
  phone: "+919876543210",
  preferredLanguage: "en",
  accessibilityPreferences: [],
  emergencyContactPhone: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const logger = { warn: vi.fn(), debug: vi.fn() } as unknown as Logger;

function createService(overrides: {
  search?: ReturnType<typeof vi.fn>;
  getAvailability?: ReturnType<typeof vi.fn>;
  getProfile?: ReturnType<typeof vi.fn>;
} = {}) {
  return new DashboardService(
    new DisabledHospitalProvider("disabled", "test"),
    { search: overrides.search ?? vi.fn() } as unknown as HospitalsService,
    {
      getAvailability: overrides.getAvailability ?? vi.fn(),
    } as unknown as HospitalAvailabilityService,
    {
      getProfile: overrides.getProfile ?? vi.fn().mockResolvedValue(profile),
    } as unknown as PatientsService,
    {
      reverseGeocode: vi.fn().mockRejectedValue(new Error("maps not configured")),
    } as unknown as GoogleMapsService,
    logger,
  );
}

describe("DashboardService overview", () => {
  it("keeps the dashboard working when hospital search fails", async () => {
    const service = createService({
      search: vi.fn().mockRejectedValue(new Error("provider down")),
    });

    const result = await service.getOverview(actor, {
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 5,
    });

    expect(result.profile?.fullName).toBe("Asha Rao");
    expect(result.hospitals.items).toEqual([]);
    expect(result.hospitals.source).toBeNull();
    expect(result.emergencyNumbers.numbers.map((number) => number.number)).toEqual([
      "112",
      "108",
    ]);
    expect(result.upcomingAppointments.connected).toBe(false);
    expect(result.activeAmbulanceRequest.connected).toBe(false);
  });

  it("shows UNKNOWN capacity when a hospital has no report", async () => {
    const service = createService({
      search: vi.fn().mockResolvedValue({
        status: "OK",
        data: [
          {
            id: "h-1",
            name: "Test Hospital",
            addressLine: "1 Test Road",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
            latitude: 19.08,
            longitude: 72.88,
            distanceKm: 1.2,
            hasEmergency: true,
            phone: null,
            hospitalType: "private",
            specialties: [],
            verificationStatus: "verified",
            source: "test-source",
            lastSyncedAt: new Date().toISOString(),
            isStale: false,
            bedAvailability: "unknown",
          },
        ],
        meta: {
          source: "test-source",
          total: 1,
          radiusKm: 5,
          maxStalenessHours: 24,
          generatedAt: new Date().toISOString(),
        },
      }),
      getAvailability: vi.fn().mockResolvedValue([]),
    });

    const result = await service.getOverview(actor, {
      latitude: 19.076,
      longitude: 72.8777,
    });

    expect(result.hospitals.items).toHaveLength(1);
    expect(result.hospitals.items[0]?.capacityStatus).toBe("UNKNOWN");
    expect(result.hospitals.items[0]?.capacityReportedAt).toBeNull();
    expect(result.hospitals.items[0]?.roadEtaMinutes).toBeNull();
  });

  it("does not search hospitals when no location is supplied", async () => {
    const search = vi.fn();
    const service = createService({ search });

    const result = await service.getOverview(actor, {});

    expect(search).not.toHaveBeenCalled();
    expect(result.location).toEqual({
      latitude: null,
      longitude: null,
      address: undefined,
      source: "unknown",
    });
    expect(result.hospitals.items).toEqual([]);
  });
});
