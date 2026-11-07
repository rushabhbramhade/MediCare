import type { HospitalProvider, HospitalProviderDescriptor } from "./hospital-provider";

/**
 * Provider adapter for manually curated (development/sample) hospital records.
 *
 * Records are seeded into `app.hospitals` with provider = 'dev-sample' and are
 * clearly marked as development data. This adapter does not call any external
 * endpoint: it simply declares itself configured so the HospitalsService can
 * query the seeded rows directly.
 *
 * Replace this adapter with a licensed provider implementation when a real
 * data contract exists.
 */
export class ManualHospitalProvider implements HospitalProvider {
  constructor(private readonly maxStalenessHours = 24) {}

  describe(): HospitalProviderDescriptor {
    return {
      name: "dev-sample",
      configured: true,
      capabilities: {
        search: true,
        specialtyFilter: true,
        emergencyFilter: true,
        liveBedAvailability: false,
      },
      provenance: {
        source: "dev-sample",
        license: "development-sample-data",
      },
      sync: {
        strategy: "manual",
        maxStalenessHours: this.maxStalenessHours,
      },
    };
  }
}
