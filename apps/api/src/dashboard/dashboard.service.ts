import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "pino";
import type { AuthUser } from "@medicare/types";
import { getEmergencyNumbers } from "../ambulance/emergency-numbers";
import { APP_LOGGER } from "../common/logger";
import { HOSPITAL_PROVIDER } from "../hospitals/providers/hospital-provider.factory";
import type { HospitalProvider } from "../hospitals/providers/hospital-provider";
import { HospitalAvailabilityService } from "../hospitals/services/hospital-availability.service";
import { HospitalsService } from "../hospitals/services/hospitals.service";
import { GoogleMapsService } from "../map/services/google-maps.service";
import { PatientsService } from "../patients/services/patients.service";
import {
  mapHospitalWithAvailability,
  type DashboardOverviewResponse,
} from "./dashboard.dto";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(HOSPITAL_PROVIDER) private readonly hospitalProvider: HospitalProvider,
    private readonly hospitalsService: HospitalsService,
    private readonly availabilityService: HospitalAvailabilityService,
    private readonly patientsService: PatientsService,
    private readonly googleMaps: GoogleMapsService,
    @Inject(APP_LOGGER) private readonly logger: Logger,
  ) {}

  async getOverview(
    actor: AuthUser,
    query: { latitude?: number; longitude?: number; radiusKm?: number },
  ): Promise<DashboardOverviewResponse> {
    const latitude = query.latitude ?? null;
    const longitude = query.longitude ?? null;
    const radiusKm = query.radiusKm ?? 5;
    const hasLocation = latitude !== null && longitude !== null;

    // 1. Patient profile (always available when authenticated)
    let profile: DashboardOverviewResponse["profile"] = null;
    try {
      profile = await this.patientsService.getProfile(actor);
    } catch (error) {
      this.logger.warn({ err: error, actorId: actor.id }, "dashboard_profile_failed");
    }

    // 2. Location context (reverse-geocode only when a Maps provider is configured)
    let address: string | undefined;
    if (hasLocation) {
      try {
        const reverse = await this.googleMaps.reverseGeocode({ latitude, longitude });
        address = reverse.formattedAddress;
      } catch (error) {
        this.logger.debug(
          { err: error, latitude, longitude },
          "dashboard_reverse_geocode_skipped",
        );
      }
    }

    // 3. Nearby hospitals + capacity (optional — degrades gracefully)
    const hospitals: DashboardOverviewResponse["hospitals"] = {
      items: [],
      total: 0,
      radiusKm,
      source: this.hospitalProvider.describe().provenance.source,
    };

    if (hasLocation) {
      try {
        const search = await this.hospitalsService.search({
          latitude,
          longitude,
          radiusKm,
          page: 1,
          pageSize: 8,
        });

        hospitals.source = search.meta.source;
        hospitals.total = search.meta.total;

        hospitals.items = await Promise.all(
          search.data.map(async (summary) => {
            let availability: Awaited<
              ReturnType<HospitalAvailabilityService["getAvailability"]>
            > = [];
            try {
              availability = await this.availabilityService.getAvailability(summary.id);
            } catch (error) {
              this.logger.warn(
                { err: error, hospitalId: summary.id },
                "dashboard_availability_failed",
              );
            }

            return mapHospitalWithAvailability(
              summary,
              availability,
              search.meta.maxStalenessHours,
            );
          }),
        );
      } catch (error) {
        this.logger.warn({ err: error }, "dashboard_hospitals_failed");
        // hospitals stays empty — the rest of the dashboard still works
      }
    }

    // 4. Services without a backend integration stay explicitly disconnected.
    return {
      profile,
      location: { latitude, longitude, address, source: hasLocation ? "browser" : "unknown" },
      emergencyNumbers: getEmergencyNumbers(),
      hospitals,
      upcomingAppointments: { items: [], connected: false },
      recentMedicalRecords: { items: [], connected: false },
      medicationSummary: { items: [], connected: false },
      activeAmbulanceRequest: { request: null, connected: false },
    };
  }
}
